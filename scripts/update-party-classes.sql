-- Database Update Script: Migrate to Required Party Classes
-- This script updates the party_member_classes table to match the new requirements:
-- Barbarian, Mage, Priest, Rogue, Bard
--
-- Run this script in your Supabase SQL Editor after the initial party-system-migration.sql
-- This safely migrates existing data and updates class definitions

-- Create a backup of existing party configurations before migration
CREATE TABLE IF NOT EXISTS party_migration_backup AS
SELECT 
    pm.id as member_id,
    pm.name as member_name,
    pm.class_id as old_class_id,
    pmc.name as old_class_name,
    pm.party_configuration_id,
    pm.level,
    pm.custom_attributes,
    pm.member_order,
    pm.created_at
FROM party_members pm
JOIN party_member_classes pmc ON pm.class_id = pmc.id;

-- Step 1: Update existing party members to use new class IDs
-- Map old classes to new classes where appropriate

-- Update Warrior -> Barbarian
UPDATE party_members 
SET class_id = 'barbarian' 
WHERE class_id = 'warrior';

-- Update Cleric -> Priest  
UPDATE party_members 
SET class_id = 'priest' 
WHERE class_id = 'cleric';

-- Note: Ranger members will be updated to Rogue (closest equivalent)
-- This preserves existing party data
UPDATE party_members 
SET class_id = 'rogue',
    custom_attributes = COALESCE(custom_attributes, '{}'::jsonb) || '{"migrated_from": "ranger"}'::jsonb
WHERE class_id = 'ranger';

-- Step 2: Remove old class definitions
DELETE FROM party_member_classes WHERE id IN ('warrior', 'cleric', 'ranger');

-- Step 3: Insert/Update the required party member classes with exact specifications

-- Barbarian (updated from Warrior)
INSERT INTO party_member_classes (id, name, description, abilities, base_stats, is_active) VALUES
(
  'barbarian',
  'Barbarian',
  'A fierce warrior driven by primal rage and brute strength.',
  '["Rage", "Reckless Attack", "Danger Sense"]',
  '{
    "strength": 17,
    "dexterity": 13,
    "intelligence": 8,
    "wisdom": 12,
    "charisma": 10,
    "constitution": 16
  }',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  abilities = EXCLUDED.abilities,
  base_stats = EXCLUDED.base_stats,
  updated_at = NOW();

-- Mage (update existing definition to match exact specs)
INSERT INTO party_member_classes (id, name, description, abilities, base_stats, is_active) VALUES
(
  'mage',
  'Mage',
  'A wielder of arcane magic with powerful spells.',
  '["Fireball", "Magic Shield", "Teleport"]',
  '{
    "strength": 8,
    "dexterity": 11,
    "intelligence": 17,
    "wisdom": 14,
    "charisma": 12,
    "constitution": 10
  }',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  abilities = EXCLUDED.abilities,
  base_stats = EXCLUDED.base_stats,
  updated_at = NOW();

-- Priest (replaces Cleric)
INSERT INTO party_member_classes (id, name, description, abilities, base_stats, is_active) VALUES
(
  'priest',
  'Priest',
  'A divine spellcaster focused on healing and divine magic.',
  '["Heal", "Bless", "Divine Protection"]',
  '{
    "strength": 12,
    "dexterity": 10,
    "intelligence": 13,
    "wisdom": 16,
    "charisma": 15,
    "constitution": 14
  }',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  abilities = EXCLUDED.abilities,
  base_stats = EXCLUDED.base_stats,
  updated_at = NOW();

-- Rogue (update existing definition to match exact specs)
INSERT INTO party_member_classes (id, name, description, abilities, base_stats, is_active) VALUES
(
  'rogue',
  'Rogue',
  'A stealthy character skilled in stealth and precision.',
  '["Sneak Attack", "Lockpicking", "Poison Strike"]',
  '{
    "strength": 12,
    "dexterity": 17,
    "intelligence": 13,
    "wisdom": 12,
    "charisma": 14,
    "constitution": 11
  }',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  abilities = EXCLUDED.abilities,
  base_stats = EXCLUDED.base_stats,
  updated_at = NOW();

-- Bard (new class)
INSERT INTO party_member_classes (id, name, description, abilities, base_stats, is_active) VALUES
(
  'bard',
  'Bard',
  'A charismatic performer who weaves magic through music and words.',
  '["Inspiration", "Charm Person", "Healing Song"]',
  '{
    "strength": 10,
    "dexterity": 14,
    "intelligence": 13,
    "wisdom": 12,
    "charisma": 17,
    "constitution": 12
  }',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  abilities = EXCLUDED.abilities,
  base_stats = EXCLUDED.base_stats,
  updated_at = NOW();

-- Step 4: Update the migration timestamp for tracking
UPDATE party_member_classes 
SET updated_at = NOW() 
WHERE id IN ('barbarian', 'mage', 'priest', 'rogue', 'bard');

-- Step 5: Verification queries

-- Show the migration summary
SELECT 
  'Migration Summary' as info,
  'Updated party classes to required specifications' as details
UNION ALL
SELECT 
  'Classes Available',
  STRING_AGG(name, ', ' ORDER BY name) as details
FROM party_member_classes 
WHERE is_active = true
UNION ALL
SELECT 
  'Total Active Classes',
  COUNT(*)::TEXT as details
FROM party_member_classes 
WHERE is_active = true;

-- Show backup table info
SELECT 
  'Backup Records' as info,
  COUNT(*)::TEXT as details
FROM party_migration_backup;

-- Show current class definitions
SELECT 
  id,
  name,
  description,
  JSON_ARRAY_LENGTH(abilities) as ability_count,
  (base_stats->>'strength')::INTEGER as strength,
  (base_stats->>'charisma')::INTEGER as charisma,
  (base_stats->>'intelligence')::INTEGER as intelligence
FROM party_member_classes 
WHERE is_active = true
ORDER BY name;

-- Show any party members that were migrated
SELECT 
  pm.name as member_name,
  pmc.name as current_class,
  COALESCE(pm.custom_attributes->>'migrated_from', 'No migration') as migration_notes
FROM party_members pm
JOIN party_member_classes pmc ON pm.class_id = pmc.id
WHERE pm.custom_attributes ? 'migrated_from' OR pm.class_id IN ('barbarian', 'priest');

-- Cleanup note
SELECT 
  'Migration Complete' as status,
  'All party classes updated to requirements: Barbarian, Mage, Priest, Rogue, Bard' as message
UNION ALL
SELECT 
  'Data Safety',
  'Existing party members preserved with appropriate class mappings' as message
UNION ALL
SELECT 
  'Backup Available',
  'Original data backed up in party_migration_backup table' as message;