-- Parties & Characters Demo Script
-- This script demonstrates the usage of the new parties and characters tables
-- Run this after executing parties-characters-migration.sql

-- ====================
-- DEMO DATA SETUP
-- ====================

-- Create some demo parties
INSERT INTO parties (id, name, description, max_members, formation, party_traits, dynamics) VALUES
  ('demo-party-1', 'The Brave Adventurers', 'A group of seasoned heroes', 4, 'balanced', 
   '{"morale": "high", "reputation": 85}',
   '{"cohesion": 75, "specializations": {"combat": 80, "magic": 60, "stealth": 40}}'),
  
  ('demo-party-2', 'Shadow Walkers', 'Stealthy operatives with mysterious goals', 3, 'stealth',
   '{"secrecy": "maximum", "code_of_honor": true}',
   '{"cohesion": 90, "specializations": {"stealth": 95, "infiltration": 85, "combat": 50}}'),
   
  ('demo-party-3', 'Arcane Scholars', 'Magic researchers and spell casters', 4, 'magical',
   '{"research_focus": "elemental", "library_access": true}',
   '{"cohesion": 60, "specializations": {"magic": 95, "research": 90, "combat": 30}}');

-- Create demo characters with extensible attributes
INSERT INTO characters (
  id, party_id, name, class_id, level, position_order, 
  base_stats, dynamic_attributes, traits, relationships, experience_data, equipment
) VALUES
  -- The Brave Adventurers
  ('char-1', 'demo-party-1', 'Thorin Ironforge', 'barbarian', 5, 0,
   '{"strength": 17, "dexterity": 13, "constitution": 16, "intelligence": 8, "wisdom": 12, "charisma": 10}',
   '{"magicResistance": 25, "intimidation": 18, "battleFury": 12}',
   '{"brave": {"value": true, "source": "background"}, "loyal": {"value": "extreme", "source": "personality"}}',
   '{"char-2": {"type": "friendship", "strength": 85, "data": {"bond": "shield_brothers"}}}',
   '{"totalXP": 6500, "skillXP": {"combat": 3000, "leadership": 1500}, "milestones": ["First Kill", "Saved Village"]}',
   '{"weapon": "Greataxe +1", "armor": "Chain Mail", "shield": "Iron Shield"}'),
   
  ('char-2', 'demo-party-1', 'Elara Moonweaver', 'mage', 4, 1,
   '{"strength": 8, "dexterity": 11, "constitution": 10, "intelligence": 17, "wisdom": 14, "charisma": 12}',
   '{"spellPower": 22, "manaPool": 45, "elementalAffinity": 15}',
   '{"studious": {"value": true, "source": "background"}, "curious": {"value": "high", "source": "personality"}}',
   '{"char-1": {"type": "friendship", "strength": 85, "data": {"bond": "mutual_respect"}}}',
   '{"totalXP": 4800, "skillXP": {"magic": 2800, "research": 1200}, "milestones": ["First Spell", "Arcane Discovery"]}',
   '{"weapon": "Staff of Fire", "armor": "Robes of Protection", "accessory": "Ring of Mana"}'),
   
  -- Shadow Walkers
  ('char-3', 'demo-party-2', 'Kira Shadowstep', 'rogue', 6, 0,
   '{"strength": 12, "dexterity": 17, "constitution": 11, "intelligence": 13, "wisdom": 12, "charisma": 14}',
   '{"stealth": 25, "lockpicking": 20, "poisonResistance": 10}',
   '{"sneaky": {"value": true, "source": "class"}, "distrustful": {"value": "moderate", "source": "background"}}',
   '{}',
   '{"totalXP": 8200, "skillXP": {"stealth": 4000, "thievery": 2500}, "milestones": ["Perfect Heist", "Master Thief"]}',
   '{"weapon": "Poisoned Daggers", "armor": "Shadow Cloak", "tools": "Master Lockpicks"}'),
   
  -- Arcane Scholars
  ('char-4', 'demo-party-3', 'Aldric Spellweaver', 'mage', 7, 0,
   '{"strength": 8, "dexterity": 11, "constitution": 10, "intelligence": 17, "wisdom": 14, "charisma": 12}',
   '{"spellPower": 28, "researchSkill": 25, "magicTheory": 30}',
   '{"intellectual": {"value": "genius", "source": "background"}, "patient": {"value": true, "source": "personality"}}',
   '{"char-5": {"type": "mentorship", "strength": 70, "data": {"role": "mentor"}}}',
   '{"totalXP": 12000, "skillXP": {"magic": 6000, "research": 4000}, "milestones": ["Master Degree", "Arcane Breakthrough"]}',
   '{"weapon": "Ancient Staff", "armor": "Robes of the Archmage", "books": "Spell Tome Collection"}'),
   
  ('char-5', 'demo-party-3', 'Luna Stargazer', 'priest', 3, 1,
   '{"strength": 12, "dexterity": 10, "constitution": 14, "intelligence": 13, "wisdom": 16, "charisma": 15}',
   '{"healingPower": 20, "divineConnection": 18, "holyResistance": 12}',
   '{"compassionate": {"value": true, "source": "class"}, "devoted": {"value": "absolute", "source": "background"}}',
   '{"char-4": {"type": "mentorship", "strength": 70, "data": {"role": "student"}}}',
   '{"totalXP": 2800, "skillXP": {"healing": 1500, "divine": 800}, "milestones": ["First Healing", "Divine Calling"]}',
   '{"weapon": "Blessed Mace", "armor": "Holy Vestments", "symbol": "Sacred Amulet"}}');

-- ====================
-- DEMO QUERIES
-- ====================

-- Show all parties with their statistics
SELECT 'All Parties with Statistics' as demo_section;
SELECT * FROM parties_statistics ORDER BY party_name;

-- Show complete party information for one party
SELECT 'Complete Party Information - The Brave Adventurers' as demo_section;
SELECT * FROM parties_complete WHERE party_name = 'The Brave Adventurers' ORDER BY position_order;

-- Show character attributes with computed totals
SELECT 'Character Attributes with Computed Totals' as demo_section;
SELECT 
  character_name,
  class_id,
  level,
  total_strength,
  total_intelligence,
  total_dexterity
FROM characters_attributes_extended 
WHERE character_name IN ('Thorin Ironforge', 'Elara Moonweaver')
ORDER BY character_name;

-- Demonstrate helper functions
SELECT 'Helper Functions Demo' as demo_section;

-- Get specific character attributes
SELECT 
  'Thorin Strength' as attribute,
  get_character_attribute_value('char-1', 'strength') as value
UNION ALL
SELECT 
  'Thorin Magic Resistance' as attribute,
  get_character_attribute_value('char-1', 'magicResistance') as value
UNION ALL
SELECT 
  'Elara Spell Power' as attribute,
  get_character_attribute_value('char-2', 'spellPower') as value;

-- Get character traits
SELECT 'Character Traits - Thorin Ironforge' as demo_section;
SELECT * FROM get_character_traits_list('char-1');

-- Validate party configurations
SELECT 'Party Validation Results' as demo_section;
SELECT 
  p.name as party_name,
  v.is_valid,
  v.error_message
FROM parties p
CROSS JOIN LATERAL validate_party_configuration(p.id) v
ORDER BY p.name;

-- ====================
-- EXTENSIBILITY DEMOS
-- ====================

-- Add custom attributes to a character
UPDATE characters 
SET dynamic_attributes = dynamic_attributes || '{"luckBonus": 5, "criticalHitChance": 15}'
WHERE id = 'char-1';

-- Add party-wide trait
UPDATE parties 
SET party_traits = party_traits || '{"fame": 75, "notoriety": "heroic"}'
WHERE id = 'demo-party-1';

-- Add relationship between characters
UPDATE characters 
SET relationships = relationships || '{"char-3": {"type": "rivalry", "strength": 30, "data": {"reason": "different_methods"}}}'
WHERE id = 'char-2';

-- Show updated extensible data
SELECT 'Updated Extensible Data' as demo_section;
SELECT 
  name,
  jsonb_pretty(dynamic_attributes) as custom_attributes,
  jsonb_pretty(traits) as character_traits
FROM characters 
WHERE id = 'char-1';

-- ====================
-- COMPATIBILITY DEMO
-- ====================

-- Show compatibility views work
SELECT 'Compatibility Layer Demo' as demo_section;
SELECT 'party_configurations_compat view' as view_name, COUNT(*) as record_count FROM party_configurations_compat
UNION ALL
SELECT 'party_members_compat view' as view_name, COUNT(*) as record_count FROM party_members_compat;

-- ====================
-- CLEANUP
-- ====================

-- Note: In a real environment, you might want to keep this demo data
-- Uncomment the following lines to clean up demo data:

-- DELETE FROM characters WHERE id IN ('char-1', 'char-2', 'char-3', 'char-4', 'char-5');
-- DELETE FROM parties WHERE id IN ('demo-party-1', 'demo-party-2', 'demo-party-3');

SELECT 'Demo completed successfully!' as result;
SELECT 'Demo data created:' as info;
SELECT '- 3 parties with different configurations' as detail
UNION ALL SELECT '- 5 characters with extensible attributes' as detail
UNION ALL SELECT '- Relationships between characters' as detail
UNION ALL SELECT '- Custom traits and equipment' as detail
UNION ALL SELECT '- Experience and progression data' as detail;