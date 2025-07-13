# Supabase Integration for Text Adventure Game

This document explains how to set up and use Supabase for the text adventure game to replace hardcoded story data with database-driven content.

## Quick Start

### Option 1: Use Fallback Data (No Setup Required)
The application works out of the box with fallback data. If no Supabase configuration is provided, it will use the original hardcoded story content.

### Option 2: Set Up Supabase Database

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project URL and anon key from the project settings

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Set Up Database Tables**
   - Open your Supabase project dashboard
   - Go to the SQL Editor
   - Run the migration script from `scripts/migrate-story-data.sql`

4. **Restart the Application**
   ```bash
   npm run dev
   ```

The application will automatically detect Supabase configuration and switch from fallback data to database queries.

## Database Schema

### Tables

- **`story_nodes`**: Main story content (scenes, text, titles)
- **`choices`**: Player choices and navigation between story nodes

See `docs/supabase-schema.md` for detailed schema documentation.

## Features

### Automatic Fallback
- **No Configuration**: Uses hardcoded story data
- **With Supabase**: Queries database for dynamic content
- **Error Handling**: Falls back gracefully if database is unavailable

### Visual Indicators
- **Fallback Mode**: Shows amber notification about using static data
- **Supabase Mode**: Shows green "Powered by Supabase" indicator
- **Loading States**: Shows spinner while fetching data

### Developer Tools
```typescript
import { StoryService } from '@/lib/story-service'

// Check if using Supabase
const usingSupabase = StoryService.isUsingSupabase()

// Health check
const isHealthy = await StoryService.healthCheck()

// Get story content
const node = await StoryService.getStoryNode('start')
```

## Migration Benefits

✅ **Cost Reduction**: No more AI API calls for story content  
✅ **Performance**: Fast database queries vs. AI generation  
✅ **Reliability**: Consistent story content without AI variability  
✅ **Scalability**: Easy to add new stories and branches  
✅ **Version Control**: Story content can be versioned in database  

## File Structure

```
├── lib/
│   ├── supabase.ts              # Supabase client configuration
│   ├── story-service.ts         # Story data service layer
│   └── fallback-story-data.ts   # Original hardcoded data
├── docs/
│   └── supabase-schema.md       # Database schema documentation
├── scripts/
│   └── migrate-story-data.sql   # Database setup script
└── .env.example                 # Environment template
```

## Development

### Adding New Story Content

1. **Using Supabase Dashboard**:
   - Add rows to `story_nodes` table
   - Add corresponding `choices` rows
   - Ensure `next_node_id` references exist

2. **Using SQL**:
   ```sql
   INSERT INTO story_nodes (id, title, text, is_ending) 
   VALUES ('new_scene', 'Scene Title', 'Scene description...', false);
   
   INSERT INTO choices (id, story_node_id, text, next_node_id, order_index)
   VALUES ('choice_1', 'new_scene', 'Choice text', 'target_scene', 0);
   ```

### Testing

The application includes comprehensive error handling:
- Invalid story node IDs
- Database connection failures  
- Missing environment variables
- Malformed data structures

## Security

- Uses Supabase Row Level Security (RLS)
- Public read-only access for story content
- Environment variables kept in `.env.local` (not committed)

## Troubleshooting

### Common Issues

1. **"Using fallback story data" message**
   - Check `.env.local` file exists
   - Verify environment variable names
   - Restart development server

2. **Database connection errors**
   - Verify Supabase URL and key
   - Check project is not paused
   - Run health check: `StoryService.healthCheck()`

3. **Missing story content**
   - Ensure migration script was run
   - Check table names match schema
   - Verify foreign key relationships

For more help, see the database schema documentation in `docs/supabase-schema.md`.