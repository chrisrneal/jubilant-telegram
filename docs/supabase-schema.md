# Supabase Database Schema for Text Adventure Game

## Overview

This document describes the database schema used to store story content for the text adventure game. The schema is designed to be simple, efficient, and easily extensible.

## Tables

### `story_nodes`

Stores the main story content - individual scenes or nodes in the adventure.

```sql
CREATE TABLE story_nodes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  is_ending BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique identifier for the story node (e.g., 'start', 'door_opened')
- `title`: Display title for the story scene
- `text`: The main story text/description
- `is_ending`: Whether this node represents an ending to the story
- `created_at`: Timestamp when the node was created
- `updated_at`: Timestamp when the node was last modified

### `choices`

Stores the choices available to players at each story node.

```sql
CREATE TABLE choices (
  id TEXT PRIMARY KEY,
  story_node_id TEXT NOT NULL REFERENCES story_nodes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  next_node_id TEXT NOT NULL REFERENCES story_nodes(id),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique identifier for the choice
- `story_node_id`: Foreign key to the story node this choice belongs to
- `text`: The choice text displayed to the player
- `next_node_id`: The story node to navigate to when this choice is selected
- `order_index`: Display order for choices (lower numbers appear first)
- `created_at`: Timestamp when the choice was created

## Indexes

```sql
-- Index for faster story node lookups
CREATE INDEX idx_story_nodes_id ON story_nodes(id);

-- Index for faster choice lookups by story node
CREATE INDEX idx_choices_story_node_id ON choices(story_node_id);

-- Index for choice ordering
CREATE INDEX idx_choices_order ON choices(story_node_id, order_index);
```

## Security (Row Level Security)

For a simple read-only story game, we can enable public read access:

```sql
-- Enable RLS
ALTER TABLE story_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE choices ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read on story_nodes" ON story_nodes
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on choices" ON choices
  FOR SELECT USING (true);
```

## Environment Variables

The application requires these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key

## Usage

The application uses the `StoryService` class to interact with the database:

```typescript
import { StoryService } from '@/lib/story-service'

// Get a story node with its choices
const node = await StoryService.getStoryNode('start')

// Health check
const isHealthy = await StoryService.healthCheck()
```

## Migration from Hardcoded Data

The existing hardcoded story data can be migrated using the provided SQL script. See `scripts/migrate-story-data.sql` for the complete migration.