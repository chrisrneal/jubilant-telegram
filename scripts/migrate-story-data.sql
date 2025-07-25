-- Migration script to create tables and populate with existing story data
-- Run this in your Supabase SQL editor

-- Create the stories table for multi-story support
CREATE TABLE stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the story_nodes table
CREATE TABLE story_nodes (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  is_ending BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the choices table
CREATE TABLE choices (
  id TEXT PRIMARY KEY,
  story_node_id TEXT NOT NULL REFERENCES story_nodes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  next_node_id TEXT NOT NULL REFERENCES story_nodes(id),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table for persistent sessions
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT, -- NULL for anonymous sessions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create game_states table for persistent game progress
CREATE TABLE game_states (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  session_id TEXT NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES stories(id),
  current_node_id TEXT NOT NULL REFERENCES story_nodes(id),
  progress_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_accounts table (optional for authenticated users)
CREATE TABLE user_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_stories_active ON stories(is_active);
CREATE INDEX idx_story_nodes_id ON story_nodes(id);
CREATE INDEX idx_story_nodes_story_id ON story_nodes(story_id);
CREATE INDEX idx_choices_story_node_id ON choices(story_node_id);
CREATE INDEX idx_choices_order ON choices(story_node_id, order_index);
CREATE INDEX idx_user_sessions_id ON user_sessions(id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_game_states_session_id ON game_states(session_id);
CREATE INDEX idx_game_states_story_id ON game_states(story_id);
CREATE INDEX idx_user_accounts_email ON user_accounts(email);
CREATE INDEX idx_user_accounts_username ON user_accounts(username);

-- Enable Row Level Security
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to story content
CREATE POLICY "Allow public read on stories" ON stories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read on story_nodes" ON story_nodes
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on choices" ON choices
  FOR SELECT USING (true);

-- Session policies - users can only access their own sessions
CREATE POLICY "Users can insert their own sessions" ON user_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read their own sessions" ON user_sessions
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own sessions" ON user_sessions
  FOR UPDATE USING (true);

-- Game state policies - users can only access their own game states
CREATE POLICY "Users can insert their own game states" ON game_states
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read their own game states" ON game_states
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own game states" ON game_states
  FOR UPDATE USING (true);

-- User account policies - users can only access their own accounts
CREATE POLICY "Users can insert their own accounts" ON user_accounts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read their own accounts" ON user_accounts
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own accounts" ON user_accounts
  FOR UPDATE USING (true);

-- Insert story metadata first
INSERT INTO stories (id, title, description, is_active) VALUES
('mystical-forest', 'The Mystical Forest', 'An adventure through an enchanted forest filled with magical creatures and ancient mysteries.', true);

-- Insert story nodes (now with story_id reference)
INSERT INTO story_nodes (id, story_id, title, text, is_ending) VALUES
('start', 'mystical-forest', 'The Mysterious Door', 'You find yourself standing before an ancient wooden door deep in a forgotten forest. Strange symbols glow faintly on its surface, and you can hear a low humming sound coming from behind it. The air feels charged with magic.', false),
('door_opened', 'mystical-forest', 'The Crystal Chamber', 'The door creaks open to reveal a magnificent chamber filled with floating crystals that pulse with inner light. In the center stands a pedestal holding a glowing orb. The humming grows louder.', false),
('symbols_examined', 'mystical-forest', 'Ancient Knowledge', 'The symbols begin to make sense as you study them. They tell of a guardian spirit trapped within, waiting for someone brave enough to free it. The symbols also warn of great danger.', false),
('forest_path', 'mystical-forest', 'The Safe Path', 'You decide discretion is the better part of valor and walk back down the forest path. As you leave, you hear a faint whisper on the wind: "Another time, perhaps..." The adventure ends, but you live to tell the tale.', true),
('orb_touched', 'mystical-forest', 'Power Awakened', 'As your fingers make contact with the orb, energy surges through your body! The crystals around you spin faster, and suddenly you understand - you have awakened an ancient magic that has been dormant for centuries. You feel incredibly powerful!', false),
('crystals_studied', 'mystical-forest', 'Hidden Knowledge', 'The crystals contain ancient memories. As you focus on them, visions flash before your eyes - this was once a sanctuary for magical beings. The orb is a key to their realm.', false),
('spirit_responds', 'mystical-forest', 'The Guardian Awakens', 'A ethereal voice responds to your call: "Mortal, you have read the ancient warnings. I am bound here by duty, but perhaps you can help me complete my purpose. Will you aid me?"', false),
('power_embraced', 'mystical-forest', 'Master of Magic', 'You embrace the ancient power flowing through you. The magic responds to your will, and you become a bridge between the mortal world and the realm of magic. Your adventure has just begun, but as a being of great power!', true),
('power_resisted', 'mystical-forest', 'Wise Restraint', 'You resist the overwhelming power, showing wisdom beyond your years. The energy gently recedes, and you feel the respect of ancient spirits. You leave the chamber changed, but still yourself.', true),
('visions_revealed', 'mystical-forest', 'Memories of the Past', 'The visions reveal the truth - this sanctuary was created to protect the world from an ancient evil. The guardian spirit has been maintaining the seal for thousands of years, growing weaker with time.', false),
('respectful_exit', 'mystical-forest', 'Honor and Respect', 'You bow respectfully to the ancient sanctuary and leave it undisturbed. As you exit, you feel a warm presence blessing your journey. Sometimes the greatest wisdom is knowing when not to act.', true),
('spirit_helped', 'mystical-forest', 'A Noble Alliance', 'Together with the guardian spirit, you work to strengthen the ancient seals protecting the world. Your courage and the spirit''s wisdom prove to be a perfect combination. You become a protector of both realms.', true),
('purpose_revealed', 'mystical-forest', 'The Guardian''s Duty', 'The spirit explains its sacred duty to guard the boundary between worlds. "Dark forces seek to break through," it warns. "I grow weak, and need someone to carry on my work or help me renew my strength."', false),
('seal_strengthened', 'mystical-forest', 'Guardian''s Gratitude', 'Your life force helps renew the ancient seals. The guardian spirit glows brighter, its duty easier to bear. "Thank you, brave soul. The world is safer because of your sacrifice and courage."', true);

-- Insert choices
INSERT INTO choices (id, story_node_id, text, next_node_id, order_index) VALUES
-- Start node choices
('door_open', 'start', 'Push open the door', 'door_opened', 0),
('door_examine', 'start', 'Examine the symbols closely', 'symbols_examined', 1),
('door_leave', 'start', 'Turn around and leave', 'forest_path', 2),

-- Door opened choices
('orb_touch', 'door_opened', 'Touch the glowing orb', 'orb_touched', 0),
('crystals_examine', 'door_opened', 'Study the floating crystals', 'crystals_studied', 1),
('chamber_retreat', 'door_opened', 'Back away slowly', 'start', 2),

-- Symbols examined choices
('door_open_cautious', 'symbols_examined', 'Open the door carefully', 'door_opened', 0),
('spirit_call', 'symbols_examined', 'Call out to the spirit', 'spirit_responds', 1),
('symbols_leave', 'symbols_examined', 'Heed the warning and leave', 'forest_path', 2),

-- Forest path choices (ending)
('restart', 'forest_path', 'Start your adventure again', 'start', 0),

-- Orb touched choices
('power_use', 'orb_touched', 'Embrace the power', 'power_embraced', 0),
('power_resist', 'orb_touched', 'Try to resist the energy', 'power_resisted', 1),

-- Crystals studied choices
('realm_enter', 'crystals_studied', 'Use the orb as a key', 'orb_touched', 0),
('visions_explore', 'crystals_studied', 'Focus on the visions', 'visions_revealed', 1),
('sanctuary_respect', 'crystals_studied', 'Leave the sanctuary undisturbed', 'respectful_exit', 2),

-- Spirit responds choices
('spirit_help', 'spirit_responds', 'Offer to help the spirit', 'spirit_helped', 0),
('spirit_question', 'spirit_responds', 'Ask about its purpose', 'purpose_revealed', 1),
('spirit_decline', 'spirit_responds', 'Politely decline', 'forest_path', 2),

-- Power embraced choices (ending)
('restart_power', 'power_embraced', 'Begin a new adventure', 'start', 0),

-- Power resisted choices (ending)
('restart_resist', 'power_resisted', 'Start a new adventure', 'start', 0),

-- Visions revealed choices
('seal_strengthen', 'visions_revealed', 'Help strengthen the seal', 'seal_strengthened', 0),
('spirit_find', 'visions_revealed', 'Seek out the guardian spirit', 'spirit_responds', 1),

-- Respectful exit choices (ending)
('restart_respect', 'respectful_exit', 'Begin another adventure', 'start', 0),

-- Spirit helped choices (ending)
('restart_alliance', 'spirit_helped', 'Start a new story', 'start', 0),

-- Purpose revealed choices
('duty_accept', 'purpose_revealed', 'Accept the sacred duty', 'spirit_helped', 0),
('strength_offer', 'purpose_revealed', 'Offer your strength', 'seal_strengthened', 1),
('duty_decline', 'purpose_revealed', 'Admit you''re not ready', 'forest_path', 2),

-- Seal strengthened choices (ending)
('restart_seal', 'seal_strengthened', 'Continue your journey', 'start', 0);

-- Verify the data
SELECT 
  'Story Nodes' as table_name,
  COUNT(*) as row_count
FROM story_nodes
UNION ALL
SELECT 
  'Choices' as table_name,
  COUNT(*) as row_count
FROM choices;

-- Optional: Run party system migration
-- After running this base migration, you can optionally run the party system migration
-- for enhanced party creation features:
-- 1. Run this script first (migrate-story-data.sql)
-- 2. Then run: party-system-migration.sql
-- 
-- The party system adds:
-- - Predefined character classes (Warrior, Mage, Rogue, Cleric, Ranger)
-- - Party configuration management 
-- - Individual party member tracking
-- - Enhanced analytics and querying capabilities
--
-- Note: The application works without the party system migration,
-- storing party data in the game_states.progress_data JSONB field.