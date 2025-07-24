-- Parties & Characters Migration Script for Supabase
-- Creates dedicated `parties` and `characters` tables for party metadata and extensible character model
-- This script is idempotent and can be run multiple times safely
-- Run this after the main migrate-story-data.sql script

-- ====================
-- PARTIES TABLE
-- ====================

-- Create parties table for party metadata
CREATE TABLE IF NOT EXISTS parties (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  description TEXT,
  max_members INTEGER NOT NULL DEFAULT 4 CHECK (max_members >= 1 AND max_members <= 8),
  formation TEXT, -- Optional formation preference (e.g., 'defensive', 'balanced', 'offensive')
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disbanded', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Extensible party attributes
  metadata JSONB DEFAULT '{}',
  party_traits JSONB DEFAULT '{}', -- Party-wide traits and bonuses
  dynamics JSONB DEFAULT '{"cohesion": 50, "specializations": {}}', -- Party dynamics
  extension_data JSONB DEFAULT '{}', -- Future extension point
  
  -- Version control for safe migrations
  model_version INTEGER DEFAULT 1,
  
  -- Constraints
  CONSTRAINT parties_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- ====================
-- CHARACTERS TABLE
-- ====================

-- Create characters table for extensible character model
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  party_id TEXT REFERENCES parties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class_id TEXT NOT NULL, -- References character class (flexible - doesn't require FK to support fallback classes)
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 100),
  position_order INTEGER NOT NULL DEFAULT 0, -- Order/position within party
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deceased', 'retired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Core character data
  base_stats JSONB DEFAULT '{}', -- Core stats (strength, dexterity, etc.)
  custom_attributes JSONB DEFAULT '{}', -- Legacy custom attributes for backward compatibility
  
  -- Extensible character model fields
  dynamic_attributes JSONB DEFAULT '{}', -- Extensible attribute system
  relationships JSONB DEFAULT '{}', -- Inter-character relationships
  traits JSONB DEFAULT '{}', -- Character traits and personality features
  experience_data JSONB DEFAULT '{"totalXP": 0, "skillXP": {}, "milestones": []}', -- Experience and progression
  equipment JSONB DEFAULT '{}', -- Character equipment and inventory
  extension_data JSONB DEFAULT '{}', -- Future extension point
  
  -- Version control for safe migrations
  model_version INTEGER DEFAULT 1,
  
  -- Constraints
  CONSTRAINT characters_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT characters_unique_name_per_party UNIQUE(party_id, name)
);

-- ====================
-- INDEXES
-- ====================

-- Performance indexes for parties table
CREATE INDEX IF NOT EXISTS idx_parties_status ON parties(status);
CREATE INDEX IF NOT EXISTS idx_parties_created_at ON parties(created_at);
CREATE INDEX IF NOT EXISTS idx_parties_model_version ON parties(model_version);
CREATE INDEX IF NOT EXISTS idx_parties_metadata ON parties USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_parties_party_traits ON parties USING gin(party_traits);
CREATE INDEX IF NOT EXISTS idx_parties_dynamics ON parties USING gin(dynamics);

-- Performance indexes for characters table
CREATE INDEX IF NOT EXISTS idx_characters_party_id ON characters(party_id);
CREATE INDEX IF NOT EXISTS idx_characters_class_id ON characters(class_id);
CREATE INDEX IF NOT EXISTS idx_characters_status ON characters(status);
CREATE INDEX IF NOT EXISTS idx_characters_level ON characters(level);
CREATE INDEX IF NOT EXISTS idx_characters_position_order ON characters(party_id, position_order);
CREATE INDEX IF NOT EXISTS idx_characters_created_at ON characters(created_at);
CREATE INDEX IF NOT EXISTS idx_characters_model_version ON characters(model_version);
CREATE INDEX IF NOT EXISTS idx_characters_dynamic_attributes ON characters USING gin(dynamic_attributes);
CREATE INDEX IF NOT EXISTS idx_characters_relationships ON characters USING gin(relationships);
CREATE INDEX IF NOT EXISTS idx_characters_traits ON characters USING gin(traits);
CREATE INDEX IF NOT EXISTS idx_characters_base_stats ON characters USING gin(base_stats);

-- ====================
-- ROW LEVEL SECURITY
-- ====================

-- Enable RLS on both tables
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parties (users can manage their own parties)
DO $$ 
BEGIN
  -- Drop existing policies if they exist (for idempotency)
  DROP POLICY IF EXISTS "Users can manage their own parties" ON parties;
  DROP POLICY IF EXISTS "Users can insert their own parties" ON parties;
  DROP POLICY IF EXISTS "Users can read their own parties" ON parties;
  DROP POLICY IF EXISTS "Users can update their own parties" ON parties;
  DROP POLICY IF EXISTS "Users can delete their own parties" ON parties;
  
  -- Create comprehensive policies
  CREATE POLICY "Users can manage their own parties" ON parties FOR ALL USING (true);
END $$;

-- RLS Policies for characters (users can manage characters in their own parties)
DO $$ 
BEGIN
  -- Drop existing policies if they exist (for idempotency)
  DROP POLICY IF EXISTS "Users can manage characters in their parties" ON characters;
  DROP POLICY IF EXISTS "Users can insert characters in their parties" ON characters;
  DROP POLICY IF EXISTS "Users can read characters in their parties" ON characters;
  DROP POLICY IF EXISTS "Users can update characters in their parties" ON characters;
  DROP POLICY IF EXISTS "Users can delete characters in their parties" ON characters;
  
  -- Create comprehensive policies
  CREATE POLICY "Users can manage characters in their parties" ON characters 
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM parties 
        WHERE parties.id = characters.party_id
      )
    );
END $$;

-- ====================
-- HELPER VIEWS
-- ====================

-- View to get complete party information with character details
CREATE OR REPLACE VIEW parties_complete AS
SELECT 
  p.id as party_id,
  p.name as party_name,
  p.description as party_description,
  p.max_members,
  p.formation,
  p.status as party_status,
  p.created_at as party_created_at,
  p.party_traits,
  p.dynamics as party_dynamics,
  c.id as character_id,
  c.name as character_name,
  c.class_id,
  c.level as character_level,
  c.position_order,
  c.status as character_status,
  c.base_stats as character_base_stats,
  c.dynamic_attributes as character_dynamic_attributes,
  c.relationships as character_relationships,
  c.traits as character_traits,
  c.experience_data as character_experience_data,
  c.equipment as character_equipment
FROM parties p
LEFT JOIN characters c ON p.id = c.party_id
ORDER BY p.id, c.position_order;

-- View to get party statistics
CREATE OR REPLACE VIEW parties_statistics AS
SELECT 
  p.id as party_id,
  p.name as party_name,
  p.status as party_status,
  COUNT(c.id) as character_count,
  p.max_members,
  ROUND(AVG(c.level), 2) as average_level,
  STRING_AGG(c.class_id, ', ' ORDER BY c.position_order) as class_composition,
  p.created_at,
  p.updated_at
FROM parties p
LEFT JOIN characters c ON p.id = c.party_id AND c.status = 'active'
GROUP BY p.id, p.name, p.status, p.max_members, p.created_at, p.updated_at;

-- View for character attributes (core stats with dynamic overrides)
CREATE OR REPLACE VIEW characters_attributes_extended AS
SELECT 
  c.id as character_id,
  c.name as character_name,
  c.party_id,
  c.class_id,
  c.level,
  -- Core stats from base_stats with dynamic attribute overrides
  COALESCE((c.dynamic_attributes->>'strength')::INTEGER, (c.base_stats->>'strength')::INTEGER) as total_strength,
  COALESCE((c.dynamic_attributes->>'dexterity')::INTEGER, (c.base_stats->>'dexterity')::INTEGER) as total_dexterity,
  COALESCE((c.dynamic_attributes->>'intelligence')::INTEGER, (c.base_stats->>'intelligence')::INTEGER) as total_intelligence,
  COALESCE((c.dynamic_attributes->>'wisdom')::INTEGER, (c.base_stats->>'wisdom')::INTEGER) as total_wisdom,
  COALESCE((c.dynamic_attributes->>'charisma')::INTEGER, (c.base_stats->>'charisma')::INTEGER) as total_charisma,
  COALESCE((c.dynamic_attributes->>'constitution')::INTEGER, (c.base_stats->>'constitution')::INTEGER) as total_constitution,
  -- All attributes
  c.base_stats,
  c.dynamic_attributes,
  c.traits,
  c.relationships
FROM characters c;

-- ====================
-- HELPER FUNCTIONS
-- ====================

-- Function to get a character's attribute value (with fallback)
CREATE OR REPLACE FUNCTION get_character_attribute_value(
  character_id TEXT,
  attribute_name TEXT
) RETURNS INTEGER AS $$
DECLARE
  attr_value INTEGER;
BEGIN
  -- First try to get from dynamic_attributes
  SELECT (dynamic_attributes->>attribute_name)::INTEGER
  INTO attr_value
  FROM characters
  WHERE id = character_id
    AND dynamic_attributes ? attribute_name;
  
  -- If not found, try base_stats
  IF attr_value IS NULL THEN
    SELECT (base_stats->>attribute_name)::INTEGER
    INTO attr_value
    FROM characters
    WHERE id = character_id
      AND base_stats ? attribute_name;
  END IF;
  
  RETURN attr_value;
END;
$$ LANGUAGE plpgsql;

-- Function to get all character traits
CREATE OR REPLACE FUNCTION get_character_traits_list(character_id TEXT)
RETURNS TABLE(trait_id TEXT, trait_value JSONB, trait_source TEXT, acquired_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    trait_key as trait_id,
    trait_value->'value' as trait_value,
    trait_value->>'source' as trait_source,
    (trait_value->>'acquiredAt')::TIMESTAMP WITH TIME ZONE as acquired_at
  FROM characters
  CROSS JOIN LATERAL jsonb_each(traits) as trait(trait_key, trait_value)
  WHERE id = character_id
    AND jsonb_typeof(traits) = 'object'
    AND traits != '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- Function to validate party configuration
CREATE OR REPLACE FUNCTION validate_party_configuration(party_id TEXT)
RETURNS TABLE(is_valid BOOLEAN, error_message TEXT) AS $$
DECLARE
  party_record parties%ROWTYPE;
  character_count INTEGER;
  duplicate_names INTEGER;
BEGIN
  -- Get party information
  SELECT * INTO party_record FROM parties WHERE id = party_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Party not found';
    RETURN;
  END IF;
  
  -- Check character count
  SELECT COUNT(*) INTO character_count 
  FROM characters 
  WHERE party_id = party_record.id AND status = 'active';
  
  IF character_count = 0 THEN
    RETURN QUERY SELECT false, 'Party must have at least one active character';
    RETURN;
  END IF;
  
  IF character_count > party_record.max_members THEN
    RETURN QUERY SELECT false, 'Party exceeds maximum member limit';
    RETURN;
  END IF;
  
  -- Check for duplicate names
  SELECT COUNT(*) INTO duplicate_names
  FROM (
    SELECT name, COUNT(*) as cnt
    FROM characters 
    WHERE party_id = party_record.id AND status = 'active'
    GROUP BY name
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_names > 0 THEN
    RETURN QUERY SELECT false, 'Party has characters with duplicate names';
    RETURN;
  END IF;
  
  -- All validations passed
  RETURN QUERY SELECT true, 'Party configuration is valid';
END;
$$ LANGUAGE plpgsql;

-- ====================
-- COMPATIBILITY LAYER
-- ====================

-- Create a compatibility view that maps to existing party_configurations table structure
-- This ensures existing code continues to work
CREATE OR REPLACE VIEW party_configurations_compat AS
SELECT 
  p.id,
  NULL::TEXT as session_id, -- Can be populated by application logic if needed
  NULL::TEXT as story_id,   -- Can be populated by application logic if needed
  p.formation,
  p.max_members as max_size,
  p.created_at,
  p.updated_at,
  p.model_version,
  p.party_traits,
  p.dynamics,
  p.extension_data
FROM parties p
WHERE p.status = 'active';

-- Create a compatibility view that maps to existing party_members table structure
CREATE OR REPLACE VIEW party_members_compat AS
SELECT 
  c.id,
  c.party_id as party_configuration_id,
  c.name,
  c.class_id,
  c.level,
  c.custom_attributes,
  c.position_order as member_order,
  c.created_at,
  c.updated_at,
  c.model_version,
  c.dynamic_attributes,
  c.relationships,
  c.traits,
  c.experience_data,
  c.extension_data
FROM characters c
WHERE c.status = 'active';

-- ====================
-- DATA VALIDATION
-- ====================

-- Verify the migration by checking the new tables
DO $$
DECLARE
  parties_count INTEGER;
  characters_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO parties_count FROM parties;
  SELECT COUNT(*) INTO characters_count FROM characters;
  
  RAISE NOTICE 'Migration completed successfully:';
  RAISE NOTICE '- Parties table: % rows', parties_count;
  RAISE NOTICE '- Characters table: % rows', characters_count;
  RAISE NOTICE '- Helper views and functions created';
  RAISE NOTICE '- Compatibility layer established';
  
  -- Display table structure verification
  RAISE NOTICE 'Tables created with proper constraints and indexes';
END $$;

-- Display sample of what the new tables look like
SELECT 'Parties Table Structure' as info;
\d parties;

SELECT 'Characters Table Structure' as info;  
\d characters;

-- Show available helper views
SELECT 'Available Helper Views' as info;
SELECT viewname, definition 
FROM pg_views 
WHERE viewname IN ('parties_complete', 'parties_statistics', 'characters_attributes_extended')
ORDER BY viewname;