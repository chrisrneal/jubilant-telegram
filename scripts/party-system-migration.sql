-- Party System Migration Script for Supabase
-- Run this migration after the main migrate-story-data.sql script
-- This adds comprehensive party creation system support

-- Create party_member_classes table for predefined character classes
CREATE TABLE party_member_classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  abilities JSONB NOT NULL DEFAULT '[]', -- Array of ability names
  base_stats JSONB NOT NULL DEFAULT '{}', -- Stats object with strength, dexterity, etc.
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create party_configurations table for storing party setups
CREATE TABLE party_configurations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  session_id TEXT REFERENCES user_sessions(id) ON DELETE CASCADE,
  story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
  formation TEXT, -- Optional formation preference
  max_size INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create party_members table for individual party members
CREATE TABLE party_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  party_configuration_id TEXT NOT NULL REFERENCES party_configurations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class_id TEXT NOT NULL REFERENCES party_member_classes(id),
  level INTEGER NOT NULL DEFAULT 1,
  custom_attributes JSONB DEFAULT '{}', -- Custom attributes/modifications
  member_order INTEGER NOT NULL DEFAULT 0, -- Order in party formation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique names within a party configuration
  UNIQUE(party_configuration_id, name)
);

-- Create indexes for better performance
CREATE INDEX idx_party_member_classes_active ON party_member_classes(is_active);
CREATE INDEX idx_party_configurations_session_id ON party_configurations(session_id);
CREATE INDEX idx_party_configurations_story_id ON party_configurations(story_id);
CREATE INDEX idx_party_members_party_id ON party_members(party_configuration_id);
CREATE INDEX idx_party_members_class_id ON party_members(class_id);
CREATE INDEX idx_party_members_order ON party_members(party_configuration_id, member_order);

-- Enable Row Level Security
ALTER TABLE party_member_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for party_member_classes (public read access for game classes)
CREATE POLICY "Allow public read on party_member_classes" ON party_member_classes
  FOR SELECT USING (is_active = true);

-- RLS Policies for party_configurations (users can only access their own configurations)
CREATE POLICY "Users can insert their own party configurations" ON party_configurations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read their own party configurations" ON party_configurations
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own party configurations" ON party_configurations
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own party configurations" ON party_configurations
  FOR DELETE USING (true);

-- RLS Policies for party_members (users can only access members of their own party configurations)
CREATE POLICY "Users can insert party members for their configurations" ON party_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM party_configurations 
      WHERE id = party_members.party_configuration_id
    )
  );

CREATE POLICY "Users can read party members for their configurations" ON party_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM party_configurations 
      WHERE id = party_members.party_configuration_id
    )
  );

CREATE POLICY "Users can update party members for their configurations" ON party_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM party_configurations 
      WHERE id = party_members.party_configuration_id
    )
  );

CREATE POLICY "Users can delete party members for their configurations" ON party_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM party_configurations 
      WHERE id = party_members.party_configuration_id
    )
  );

-- Insert default party member classes
INSERT INTO party_member_classes (id, name, description, abilities, base_stats, is_active) VALUES
(
  'warrior',
  'Warrior',
  'A strong fighter skilled in melee combat and defense.',
  '["Shield Bash", "Berserker Rage", "Taunt"]',
  '{
    "strength": 16,
    "dexterity": 12,
    "intelligence": 10,
    "wisdom": 12,
    "charisma": 11,
    "constitution": 15
  }',
  true
),
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
),
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
),
(
  'cleric',
  'Cleric',
  'A divine spellcaster focused on healing and support.',
  '["Heal", "Bless", "Turn Undead"]',
  '{
    "strength": 13,
    "dexterity": 10,
    "intelligence": 12,
    "wisdom": 16,
    "charisma": 14,
    "constitution": 13
  }',
  true
),
(
  'ranger',
  'Ranger',
  'A wilderness expert skilled with bow and nature magic.',
  '["Track", "Animal Companion", "Hunter''s Mark"]',
  '{
    "strength": 14,
    "dexterity": 15,
    "intelligence": 12,
    "wisdom": 15,
    "charisma": 11,
    "constitution": 12
  }',
  true
);

-- Add helpful views for common queries

-- View to get complete party information with member details
CREATE VIEW party_complete AS
SELECT 
  pc.id as party_id,
  pc.session_id,
  pc.story_id,
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

-- View to get party statistics
CREATE VIEW party_statistics AS
SELECT 
  pc.id as party_id,
  pc.session_id,
  pc.story_id,
  COUNT(pm.id) as member_count,
  pc.max_size,
  STRING_AGG(pmc.name, ', ' ORDER BY pm.member_order) as class_composition,
  pc.created_at
FROM party_configurations pc
LEFT JOIN party_members pm ON pc.id = pm.party_configuration_id
LEFT JOIN party_member_classes pmc ON pm.class_id = pmc.id
GROUP BY pc.id, pc.session_id, pc.story_id, pc.max_size, pc.created_at;

-- Verify the migration by checking inserted data
SELECT 'Party Member Classes' as table_name, COUNT(*) as row_count FROM party_member_classes
UNION ALL
SELECT 'Party Configurations' as table_name, COUNT(*) as row_count FROM party_configurations
UNION ALL  
SELECT 'Party Members' as table_name, COUNT(*) as row_count FROM party_members;

-- Display the inserted party classes for verification
SELECT 
  id,
  name,
  description,
  JSON_ARRAY_LENGTH(abilities) as ability_count,
  (base_stats->>'strength')::INTEGER as strength,
  (base_stats->>'intelligence')::INTEGER as intelligence
FROM party_member_classes 
WHERE is_active = true
ORDER BY name;