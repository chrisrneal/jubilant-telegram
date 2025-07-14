-- Migration script to create tables and populate with existing story data
-- Run this in your Supabase SQL editor

-- Create the story_nodes table
CREATE TABLE story_nodes (
  id TEXT PRIMARY KEY,
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

-- Create indexes for better performance
CREATE INDEX idx_story_nodes_id ON story_nodes(id);
CREATE INDEX idx_choices_story_node_id ON choices(story_node_id);
CREATE INDEX idx_choices_order ON choices(story_node_id, order_index);

-- Enable Row Level Security
ALTER TABLE story_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE choices ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read on story_nodes" ON story_nodes
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on choices" ON choices
  FOR SELECT USING (true);

-- Insert story nodes
INSERT INTO story_nodes (id, title, text, is_ending) VALUES
('start', 'The Mysterious Door', 'You find yourself standing before an ancient wooden door deep in a forgotten forest. Strange symbols glow faintly on its surface, and you can hear a low humming sound coming from behind it. The air feels charged with magic.', false),
('door_opened', 'The Crystal Chamber', 'The door creaks open to reveal a magnificent chamber filled with floating crystals that pulse with inner light. In the center stands a pedestal holding a glowing orb. The humming grows louder.', false),
('symbols_examined', 'Ancient Knowledge', 'The symbols begin to make sense as you study them. They tell of a guardian spirit trapped within, waiting for someone brave enough to free it. The symbols also warn of great danger.', false),
('forest_path', 'The Safe Path', 'You decide discretion is the better part of valor and walk back down the forest path. As you leave, you hear a faint whisper on the wind: "Another time, perhaps..." The adventure ends, but you live to tell the tale.', true),
('orb_touched', 'Power Awakened', 'As your fingers make contact with the orb, energy surges through your body! The crystals around you spin faster, and suddenly you understand - you have awakened an ancient magic that has been dormant for centuries. You feel incredibly powerful!', false),
('crystals_studied', 'Hidden Knowledge', 'The crystals contain ancient memories. As you focus on them, visions flash before your eyes - this was once a sanctuary for magical beings. The orb is a key to their realm.', false),
('spirit_responds', 'The Guardian Awakens', 'A ethereal voice responds to your call: "Mortal, you have read the ancient warnings. I am bound here by duty, but perhaps you can help me complete my purpose. Will you aid me?"', false),
('power_embraced', 'Master of Magic', 'You embrace the ancient power flowing through you. The magic responds to your will, and you become a bridge between the mortal world and the realm of magic. Your adventure has just begun, but as a being of great power!', true),
('power_resisted', 'Wise Restraint', 'You resist the overwhelming power, showing wisdom beyond your years. The energy gently recedes, and you feel the respect of ancient spirits. You leave the chamber changed, but still yourself.', true),
('visions_revealed', 'Memories of the Past', 'The visions reveal the truth - this sanctuary was created to protect the world from an ancient evil. The guardian spirit has been maintaining the seal for thousands of years, growing weaker with time.', false),
('respectful_exit', 'Honor and Respect', 'You bow respectfully to the ancient sanctuary and leave it undisturbed. As you exit, you feel a warm presence blessing your journey. Sometimes the greatest wisdom is knowing when not to act.', true),
('spirit_helped', 'A Noble Alliance', 'Together with the guardian spirit, you work to strengthen the ancient seals protecting the world. Your courage and the spirit''s wisdom prove to be a perfect combination. You become a protector of both realms.', true),
('purpose_revealed', 'The Guardian''s Duty', 'The spirit explains its sacred duty to guard the boundary between worlds. "Dark forces seek to break through," it warns. "I grow weak, and need someone to carry on my work or help me renew my strength."', false),
('seal_strengthened', 'Guardian''s Gratitude', 'Your life force helps renew the ancient seals. The guardian spirit glows brighter, its duty easier to bear. "Thank you, brave soul. The world is safer because of your sacrifice and courage."', true);

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