# Party System Migration Guide

This guide explains how to set up the party creation system in your Supabase database.

## Overview

The party creation system allows players to build custom adventuring parties before starting stories. This optional migration adds dedicated database tables for better performance, data integrity, and analytics.

## What's Included

### Database Tables
- **`party_member_classes`** - Predefined character classes (Warrior, Mage, Rogue, Cleric, Ranger)
- **`party_configurations`** - Party setups linked to user sessions and stories
- **`party_members`** - Individual party members within configurations

### API Endpoints
- **`/api/party-classes`** - Get available character classes
- **`/api/party-configurations`** - Manage party configurations (CRUD operations)

### Features
- 5 unique character classes with distinct abilities and stats
- Party size limits (1-4 members by default)
- Unique name validation within parties
- Formation preferences
- Custom member attributes
- Full CRUD operations via API

## Migration Steps

### 1. Prerequisites
- Complete the main Supabase setup first (`migrate-story-data.sql`)
- Ensure your Supabase project is configured and accessible

### 2. Run the Party System Migration

In your Supabase Dashboard → SQL Editor:

1. Copy and paste the entire contents of `scripts/party-system-migration.sql`
2. Click "Run" to execute the migration
3. Verify the migration completed successfully

### 3. Verify Migration

The migration script includes verification queries that will show:
- Number of tables created
- Default party classes inserted
- Sample class data

Expected output:
```
table_name              | row_count
-----------------------|-----------
Party Member Classes    |         5
Party Configurations    |         0  
Party Members          |         0
```

## Database Schema

### Party Member Classes
```sql
CREATE TABLE party_member_classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  abilities JSONB NOT NULL DEFAULT '[]',
  base_stats JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Party Configurations
```sql
CREATE TABLE party_configurations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  session_id TEXT REFERENCES user_sessions(id) ON DELETE CASCADE,
  story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
  formation TEXT,
  max_size INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Party Members
```sql
CREATE TABLE party_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  party_configuration_id TEXT NOT NULL REFERENCES party_configurations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class_id TEXT NOT NULL REFERENCES party_member_classes(id),
  level INTEGER NOT NULL DEFAULT 1,
  custom_attributes JSONB DEFAULT '{}',
  member_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(party_configuration_id, name)
);
```

## Default Character Classes

The migration includes 5 predefined character classes:

| Class   | Description | Key Abilities |
|---------|-------------|---------------|
| **Warrior** | Strong fighter skilled in melee combat | Shield Bash, Berserker Rage, Taunt |
| **Mage** | Wielder of arcane magic with powerful spells | Fireball, Magic Shield, Teleport |
| **Rogue** | Stealthy character skilled in precision | Sneak Attack, Lockpicking, Poison Strike |
| **Cleric** | Divine spellcaster focused on healing | Heal, Bless, Turn Undead |
| **Ranger** | Wilderness expert with bow and nature magic | Track, Animal Companion, Hunter's Mark |

## API Usage

### Get Available Classes
```typescript
const response = await fetch('/api/party-classes')
const { data: classes } = await response.json()
```

### Create Party Configuration
```typescript
const partyConfig = {
  members: [
    {
      name: "Sir Galahad",
      class: { id: "warrior", ... },
      level: 1
    }
  ],
  maxSize: 4
}

const response = await fetch('/api/party-configurations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'user-session-id',
    storyId: 'story-id',
    partyConfig
  })
})
```

### Get Party Configuration
```typescript
const response = await fetch(
  `/api/party-configurations?sessionId=${sessionId}&storyId=${storyId}`
)
const { data: party } = await response.json()
```

## Benefits of Database Migration

### Without Migration
- Party data stored in `game_states.progress_data` JSONB field
- Works perfectly for basic functionality
- Simpler setup

### With Migration
- ✅ **Better Performance** - Indexed queries for party data
- ✅ **Data Integrity** - Foreign key constraints and validation
- ✅ **Analytics** - Easy querying of party compositions and trends
- ✅ **Scalability** - Optimized for large numbers of parties
- ✅ **Future Features** - Foundation for advanced party systems

## Troubleshooting

### Migration Fails
1. Ensure main migration (`migrate-story-data.sql`) ran successfully first
2. Check that all referenced tables exist (`user_sessions`, `stories`)
3. Verify your Supabase user has proper permissions

### API Errors
1. The application automatically falls back to in-memory data if database is unavailable
2. Check Supabase environment variables are configured
3. Verify RLS policies allow your session to access data

### Data Inconsistencies
Use the provided views for debugging:
```sql
-- View all party information
SELECT * FROM party_complete;

-- View party statistics
SELECT * FROM party_statistics;
```

## Rollback (if needed)

To remove the party system tables:
```sql
DROP VIEW IF EXISTS party_statistics;
DROP VIEW IF EXISTS party_complete;
DROP TABLE IF EXISTS party_members;
DROP TABLE IF EXISTS party_configurations;
DROP TABLE IF EXISTS party_member_classes;
```

## Next Steps

After migration:
1. Test the party creation flow in your application
2. Customize character classes if needed (add/modify in `party_member_classes` table)
3. Implement additional party features (formations, advanced stats, etc.)
4. Set up analytics queries for party composition insights

The party system is designed to be fully backward compatible - existing adventures continue to work normally whether or not the migration is applied.