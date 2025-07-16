-- Extensible Character Model Migration Script for Supabase
-- Run this migration after the party-system-migration.sql script
-- This adds support for extensible character attributes and relationships

-- Add extensible fields to party_member_classes table
ALTER TABLE party_member_classes ADD COLUMN IF NOT EXISTS model_version INTEGER DEFAULT 1;
ALTER TABLE party_member_classes ADD COLUMN IF NOT EXISTS extended_attributes JSONB DEFAULT '{}';
ALTER TABLE party_member_classes ADD COLUMN IF NOT EXISTS attribute_schema JSONB DEFAULT '{}';
ALTER TABLE party_member_classes ADD COLUMN IF NOT EXISTS relationship_types JSONB DEFAULT '["friendship", "rivalry", "mentorship"]';
ALTER TABLE party_member_classes ADD COLUMN IF NOT EXISTS trait_categories JSONB DEFAULT '["personality", "background", "quirks"]';
ALTER TABLE party_member_classes ADD COLUMN IF NOT EXISTS extension_data JSONB DEFAULT '{}';

-- Add extensible fields to party_members table
ALTER TABLE party_members ADD COLUMN IF NOT EXISTS model_version INTEGER DEFAULT 1;
ALTER TABLE party_members ADD COLUMN IF NOT EXISTS dynamic_attributes JSONB DEFAULT '{}';
ALTER TABLE party_members ADD COLUMN IF NOT EXISTS relationships JSONB DEFAULT '{}';
ALTER TABLE party_members ADD COLUMN IF NOT EXISTS traits JSONB DEFAULT '{}';
ALTER TABLE party_members ADD COLUMN IF NOT EXISTS experience_data JSONB DEFAULT '{"totalXP": 0, "skillXP": {}, "milestones": []}';
ALTER TABLE party_members ADD COLUMN IF NOT EXISTS extension_data JSONB DEFAULT '{}';

-- Add extensible fields to party_configurations table
ALTER TABLE party_configurations ADD COLUMN IF NOT EXISTS model_version INTEGER DEFAULT 1;
ALTER TABLE party_configurations ADD COLUMN IF NOT EXISTS party_traits JSONB DEFAULT '{}';
ALTER TABLE party_configurations ADD COLUMN IF NOT EXISTS dynamics JSONB DEFAULT '{"cohesion": 50, "specializations": {}}';
ALTER TABLE party_configurations ADD COLUMN IF NOT EXISTS extension_data JSONB DEFAULT '{}';

-- Create indexes for the new JSONB fields for better query performance
CREATE INDEX IF NOT EXISTS idx_party_member_classes_model_version ON party_member_classes(model_version);
CREATE INDEX IF NOT EXISTS idx_party_member_classes_extended_attributes ON party_member_classes USING gin(extended_attributes);

CREATE INDEX IF NOT EXISTS idx_party_members_model_version ON party_members(model_version);
CREATE INDEX IF NOT EXISTS idx_party_members_dynamic_attributes ON party_members USING gin(dynamic_attributes);
CREATE INDEX IF NOT EXISTS idx_party_members_relationships ON party_members USING gin(relationships);
CREATE INDEX IF NOT EXISTS idx_party_members_traits ON party_members USING gin(traits);

CREATE INDEX IF NOT EXISTS idx_party_configurations_model_version ON party_configurations(model_version);
CREATE INDEX IF NOT EXISTS idx_party_configurations_party_traits ON party_configurations USING gin(party_traits);
CREATE INDEX IF NOT EXISTS idx_party_configurations_dynamics ON party_configurations USING gin(dynamics);

-- Update existing party member classes with extensible fields
UPDATE party_member_classes SET 
  model_version = 1,
  extended_attributes = '{}',
  attribute_schema = '{}',
  relationship_types = '["friendship", "rivalry", "mentorship"]',
  trait_categories = '["personality", "background", "quirks"]',
  extension_data = '{}'
WHERE model_version IS NULL;

-- Update existing party members with extensible fields
UPDATE party_members SET 
  model_version = 1,
  dynamic_attributes = '{}',
  relationships = '{}',
  traits = '{}',
  experience_data = '{"totalXP": 0, "skillXP": {}, "milestones": []}',
  extension_data = '{}'
WHERE model_version IS NULL;

-- Update existing party configurations with extensible fields
UPDATE party_configurations SET 
  model_version = 1,
  party_traits = '{}',
  dynamics = '{"cohesion": 50, "specializations": {}}',
  extension_data = '{}'
WHERE model_version IS NULL;

-- Create a view for extensible character information
CREATE OR REPLACE VIEW character_extended_view AS
SELECT 
  pm.id as member_id,
  pm.name as member_name,
  pm.level as member_level,
  pm.model_version,
  pm.custom_attributes,
  pm.dynamic_attributes,
  pm.relationships,
  pm.traits,
  pm.experience_data,
  pm.member_order,
  pmc.id as class_id,
  pmc.name as class_name,
  pmc.description as class_description,
  pmc.abilities as class_abilities,
  pmc.base_stats as class_base_stats,
  pmc.extended_attributes as class_extended_attributes,
  pmc.attribute_schema as class_attribute_schema,
  pmc.relationship_types as class_relationship_types,
  pmc.trait_categories as class_trait_categories,
  pc.id as party_id,
  pc.formation as party_formation,
  pc.party_traits,
  pc.dynamics as party_dynamics
FROM party_members pm
LEFT JOIN party_member_classes pmc ON pm.class_id = pmc.id
LEFT JOIN party_configurations pc ON pm.party_configuration_id = pc.id
ORDER BY pc.id, pm.member_order;

-- Create a view for character attributes (both core and extended)
CREATE OR REPLACE VIEW character_attributes_view AS
SELECT 
  pm.id as member_id,
  pm.name as member_name,
  -- Core stats from class base_stats
  (pmc.base_stats->>'strength')::INTEGER as base_strength,
  (pmc.base_stats->>'dexterity')::INTEGER as base_dexterity,
  (pmc.base_stats->>'intelligence')::INTEGER as base_intelligence,
  (pmc.base_stats->>'wisdom')::INTEGER as base_wisdom,
  (pmc.base_stats->>'charisma')::INTEGER as base_charisma,
  (pmc.base_stats->>'constitution')::INTEGER as base_constitution,
  -- Dynamic attributes
  pm.dynamic_attributes,
  -- Extended class attributes
  pmc.extended_attributes as class_extended_attributes,
  -- Computed total attributes (base + dynamic)
  COALESCE((pm.dynamic_attributes->>'strength')::INTEGER, (pmc.base_stats->>'strength')::INTEGER) as total_strength,
  COALESCE((pm.dynamic_attributes->>'dexterity')::INTEGER, (pmc.base_stats->>'dexterity')::INTEGER) as total_dexterity,
  COALESCE((pm.dynamic_attributes->>'intelligence')::INTEGER, (pmc.base_stats->>'intelligence')::INTEGER) as total_intelligence,
  COALESCE((pm.dynamic_attributes->>'wisdom')::INTEGER, (pmc.base_stats->>'wisdom')::INTEGER) as total_wisdom,
  COALESCE((pm.dynamic_attributes->>'charisma')::INTEGER, (pmc.base_stats->>'charisma')::INTEGER) as total_charisma,
  COALESCE((pm.dynamic_attributes->>'constitution')::INTEGER, (pmc.base_stats->>'constitution')::INTEGER) as total_constitution
FROM party_members pm
LEFT JOIN party_member_classes pmc ON pm.class_id = pmc.id;

-- Create a view for character relationships
CREATE OR REPLACE VIEW character_relationships_view AS
SELECT 
  pm1.id as member_id,
  pm1.name as member_name,
  rel_key as target_member_id,
  pm2.name as target_member_name,
  (rel_value->>'type') as relationship_type,
  (rel_value->>'strength')::INTEGER as relationship_strength,
  (rel_value->'data') as relationship_data
FROM party_members pm1
CROSS JOIN LATERAL jsonb_each(pm1.relationships) as rel(rel_key, rel_value)
LEFT JOIN party_members pm2 ON pm2.id = rel_key
WHERE jsonb_typeof(pm1.relationships) = 'object'
  AND pm1.relationships != '{}'::jsonb;

-- Add helpful functions for querying extensible attributes

-- Function to get a character's attribute value (with fallback to base stats)
CREATE OR REPLACE FUNCTION get_character_attribute(
  member_id TEXT,
  attribute_name TEXT
) RETURNS INTEGER AS $$
DECLARE
  attr_value INTEGER;
BEGIN
  -- First try to get from dynamic_attributes
  SELECT (dynamic_attributes->>attribute_name)::INTEGER
  INTO attr_value
  FROM party_members
  WHERE id = member_id
    AND dynamic_attributes ? attribute_name;
  
  -- If not found, try base_stats from class
  IF attr_value IS NULL THEN
    SELECT (pmc.base_stats->>attribute_name)::INTEGER
    INTO attr_value
    FROM party_members pm
    JOIN party_member_classes pmc ON pm.class_id = pmc.id
    WHERE pm.id = member_id
      AND pmc.base_stats ? attribute_name;
  END IF;
  
  RETURN attr_value;
END;
$$ LANGUAGE plpgsql;

-- Function to get all character traits
CREATE OR REPLACE FUNCTION get_character_traits(member_id TEXT)
RETURNS TABLE(trait_id TEXT, trait_value JSONB, trait_source TEXT, acquired_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    trait_key as trait_id,
    trait_value->'value' as trait_value,
    trait_value->>'source' as trait_source,
    (trait_value->>'acquiredAt')::TIMESTAMP WITH TIME ZONE as acquired_at
  FROM party_members
  CROSS JOIN LATERAL jsonb_each(traits) as trait(trait_key, trait_value)
  WHERE id = member_id
    AND jsonb_typeof(traits) = 'object'
    AND traits != '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- Verify the migration by showing counts
SELECT 'Party Member Classes (Extended)' as table_name, COUNT(*) as row_count,
       COUNT(CASE WHEN model_version = 1 THEN 1 END) as migrated_count
FROM party_member_classes
UNION ALL
SELECT 'Party Members (Extended)' as table_name, COUNT(*) as row_count,
       COUNT(CASE WHEN model_version = 1 THEN 1 END) as migrated_count
FROM party_members
UNION ALL
SELECT 'Party Configurations (Extended)' as table_name, COUNT(*) as row_count,
       COUNT(CASE WHEN model_version = 1 THEN 1 END) as migrated_count
FROM party_configurations;

-- Show sample of extensible data structure
SELECT 
  'Sample Extended Party Member Class' as info,
  id, name, model_version,
  jsonb_pretty(extended_attributes) as extended_attributes_sample,
  jsonb_pretty(relationship_types) as relationship_types_sample
FROM party_member_classes 
WHERE is_active = true 
LIMIT 1;