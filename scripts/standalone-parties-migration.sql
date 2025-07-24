-- Standalone Party Configurations Migration Script
-- This migration extends the party system to support saving parties independently of stories
-- Run this after the party-system-migration.sql script

-- Add party_name field and make story_id nullable to support standalone parties
ALTER TABLE party_configurations 
ADD COLUMN party_name TEXT DEFAULT NULL,
ALTER COLUMN story_id DROP NOT NULL;

-- Update the unique constraint to account for nullable story_id
-- Remove the old constraint
ALTER TABLE party_configurations 
DROP CONSTRAINT IF EXISTS party_configurations_session_id_story_id_key;

-- Add new constraint that handles nullable story_id properly
-- For adventure-specific parties: session_id + story_id must be unique
-- For standalone parties: session_id + party_name must be unique (where story_id is NULL)
CREATE UNIQUE INDEX idx_party_configurations_adventure_unique 
ON party_configurations (session_id, story_id) 
WHERE story_id IS NOT NULL;

CREATE UNIQUE INDEX idx_party_configurations_standalone_unique 
ON party_configurations (session_id, party_name) 
WHERE story_id IS NULL AND party_name IS NOT NULL;

-- Create index for better performance when querying standalone parties
CREATE INDEX idx_party_configurations_standalone ON party_configurations (session_id) 
WHERE story_id IS NULL;

-- Update the party_complete view to include party_name
DROP VIEW IF EXISTS party_complete;
CREATE VIEW party_complete AS
SELECT 
  pc.id as party_id,
  pc.session_id,
  pc.story_id,
  pc.party_name,
  pc.formation,
  pc.max_size,
  pc.created_at as party_created_at,
  pm.id as member_id,
  pm.name as member_name,
  pm.level as member_level,
  pm.custom_attributes as member_custom_attributes,
  pm.member_order,
  pmc.id as class_id,
  pmc.name as class_name,
  pmc.description as class_description,
  pmc.abilities as class_abilities,
  pmc.base_stats as class_base_stats
FROM party_configurations pc
LEFT JOIN party_members pm ON pc.id = pm.party_configuration_id
LEFT JOIN party_member_classes pmc ON pm.class_id = pmc.id
ORDER BY pc.id, pm.member_order;

-- Update the party_statistics view to include party_name and distinguish standalone parties
DROP VIEW IF EXISTS party_statistics;
CREATE VIEW party_statistics AS
SELECT 
  pc.id as party_id,
  pc.session_id,
  pc.story_id,
  pc.party_name,
  CASE 
    WHEN pc.story_id IS NULL THEN 'standalone'
    ELSE 'adventure'
  END as party_type,
  COUNT(pm.id) as member_count,
  pc.max_size,
  STRING_AGG(pmc.name, ', ' ORDER BY pm.member_order) as class_composition,
  pc.created_at
FROM party_configurations pc
LEFT JOIN party_members pm ON pc.id = pm.party_configuration_id
LEFT JOIN party_member_classes pmc ON pm.class_id = pmc.id
GROUP BY pc.id, pc.session_id, pc.story_id, pc.party_name, pc.max_size, pc.created_at;

-- Verify the migration
SELECT 'Migration completed successfully' as status;
SELECT 
  column_name, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'party_configurations' 
  AND column_name IN ('story_id', 'party_name');