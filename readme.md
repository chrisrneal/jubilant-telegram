# 🎭 Story Rider

**An Interactive Text Adventure Game**

<p align="center">
	<img alt="Story Rider" src="public/images/icon-512.png" width="90">
</p>

Story Rider is a modern interactive text adventure game built with Next.js. Choose your own path through immersive narratives where every decision shapes your unique journey through mystical worlds and thrilling adventures.

## 🎮 Game Concept

**How to Play:**
- Read the story scenario presented to you
- Choose from multiple decision paths that interest you
- Watch your choices shape the narrative and lead to different outcomes
- Explore branching storylines with multiple possible endings
- Collect items and track your progress as you adventure

**Key Features:**
- 📖 **Interactive Storytelling**: Rich narratives with meaningful choices
- 🎲 **Multiple Story Paths**: Random story selection for variety and replayability  
- 💾 **Progress Persistence**: Your game state automatically saves as you play
- 🎒 **Inventory System**: Collect and manage items throughout your adventure
- 👥 **Party Creation System**: Build custom adventuring parties with unique characters
- ⚔️ **Extensible Character Model**: Rich character attributes, relationships, and traits
- 📊 **Progress Tracking**: Monitor choices made, scenes explored, and gameplay stats
- 🌓 **Dark/Light Themes**: Comfortable reading in any lighting condition
- 📱 **Mobile Optimized**: Native-like mobile experience with PWA support

## 🚀 Quick Start

**The game works immediately with no setup required!**

```bash
# 1. Clone the repository
git clone <repository-url>
cd jubilant-telegram

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open http://localhost:3000 and start playing!
```

The application includes fallback story data, so you can start playing immediately. For enhanced features and persistent data across devices, see the [Database Setup](#-database-setup-optional) section below.

## ✨ Features

### 🎯 Immediate Play
- **No Configuration Required**: Start playing right away with built-in stories
- **Anonymous Sessions**: Progress saves locally without requiring accounts
- **Offline Support**: PWA capabilities for uninterrupted gameplay

### 🗄️ Database Integration (Optional)
- **Supabase Backend**: Robust data persistence and multi-device sync
- **Dynamic Content**: Add new stories and paths without code changes  
- **Analytics Tracking**: Monitor player choices and story engagement

### 🎨 User Experience
- **Smooth Animations**: Configurable transitions and visual effects
- **Responsive Design**: Beautiful experience on desktop and mobile
- **Accessibility**: Built with inclusive design principles
- **Loading States**: Clear feedback during story transitions

## 👥 Party Creation System

Create custom adventuring parties to enhance your storytelling experience with unique characters, each bringing their own abilities and attributes to your journey.

### Character Classes

Choose from **5 distinct character classes**, each with unique abilities and balanced stats:

| Class | Description | Key Abilities | Primary Stats |
|-------|-------------|---------------|---------------|
| **🗡️ Barbarian** | Fierce warrior driven by primal rage | Rage, Reckless Attack, Danger Sense | Strength (17), Constitution (16) |
| **🔮 Mage** | Wielder of arcane magic and powerful spells | Fireball, Magic Shield, Teleport | Intelligence (17), Wisdom (14) |
| **✨ Priest** | Divine spellcaster focused on healing | Heal, Bless, Divine Protection | Wisdom (16), Charisma (15) |
| **🗡️ Rogue** | Stealthy character skilled in precision | Sneak Attack, Lockpicking, Poison Strike | Dexterity (17), Intelligence (13) |
| **🎵 Bard** | Charismatic performer weaving magic through music | Inspiration, Charm Person, Healing Song | Charisma (17), Dexterity (14) |

### Party Configuration

- **Party Size**: Create parties of 1-4 members
- **Unique Names**: Each party member must have a distinct name
- **Custom Attributes**: Enhance characters with additional traits and abilities
- **Formation Preferences**: Organize your party for optimal gameplay

### Extensible Character Model

The character system supports rich customization and extensibility:

#### Core Features
- **Dynamic Attributes**: Add custom attributes beyond base stats (magic resistance, reputation, etc.)
- **Character Relationships**: Build relationships between party members with friendship, rivalry, and trust levels
- **Personality Traits**: Define character personalities, quirks, and behavioral patterns
- **Experience Tracking**: Monitor character growth and skill development
- **Backward Compatibility**: All existing character data continues to work seamlessly

#### Attribute Categories
- **`core`**: Basic character stats (strength, dexterity, intelligence, wisdom, charisma, constitution)
- **`derived`**: Calculated attributes (spell power from intelligence, health from constitution)
- **`custom`**: Game-specific attributes (magic resistance, reputation, luck)
- **`relationship`**: Attributes affecting character interactions

#### Usage Example
```typescript
// Create a character with custom attributes
const hero = GameStateManager.createPartyMember('Lyra the Bold', 'barbarian')
const enhancedHero = GameStateManager.setCharacterAttribute(hero, 'magicResistance', 35, {
  category: 'custom',
  displayName: 'Magic Resistance',
  description: 'Resistance to magical attacks',
  constraints: { min: 0, max: 100 }
})

// Add character traits and relationships
const socialHero = GameStateManager.setCharacterTrait(enhancedHero, 'brave', true, 'personality')
const friendlyHero = GameStateManager.setCharacterRelationship(
  socialHero, wizardId, 'friendship', 75
)
```

### Party Creation Workflow

1. **Start Adventure**: Begin a new story adventure
2. **Choose Party Size**: Decide how many characters to include (1-4)
3. **Select Classes**: Choose character classes based on your preferred playstyle
4. **Customize Characters**: Name your characters and optionally add custom attributes
5. **Set Formation**: Arrange your party for the adventure
6. **Begin Journey**: Start your adventure with your custom party

## 🔧 Database Setup (Optional)

While the game works perfectly without any setup, connecting to Supabase unlocks additional features:

### 1. Create Supabase Project
- Visit [supabase.com](https://supabase.com) and create a new project
- Note your **Project URL** and **Anon Key** from Settings → API

### 2. Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set Up Database Schema
- Open your Supabase project dashboard
- Go to SQL Editor
- Run the complete migration script from `scripts/migrate-story-data.sql`

### 4. Optional: Enable Enhanced Party System
For optimized party management and analytics:
- Run the party system migration: `scripts/party-system-migration.sql`
- See [Party Migration Guide](scripts/PARTY_MIGRATION_README.md) for detailed instructions
- This adds dedicated tables for better performance and data integrity

### 5. Restart Application
```bash
npm run dev
```

The application will automatically detect your Supabase configuration and enable enhanced features.

### Benefits of Database Setup
- 🔄 **Cross-Device Sync**: Access your progress from any device
- 📈 **Enhanced Analytics**: Track detailed gameplay statistics  
- 🎯 **Content Management**: Add new stories through database interface
- 👥 **Party Analytics**: Monitor party compositions and character usage
- 🚀 **Scalability**: Support for unlimited stories and complex branching

## 💻 Development

### Project Structure

```
├── 📁 components/           # React components
│   ├── story-content.tsx    # Main story display component
│   ├── story-choices.tsx    # Interactive choice buttons
│   ├── party-creation.tsx   # Party creation interface
│   ├── animation-controls.tsx # Animation toggle controls
│   └── ...                  # Other UI components
├── 📁 lib/                  # Core game logic
│   ├── story-service.ts     # Story data management
│   ├── game-state-manager.ts # Progress tracking & party management
│   ├── supabase.ts          # Database integration with party support
│   └── fallback-story-data.ts # Built-in story content
├── 📁 pages/                # Next.js pages
│   ├── index.tsx            # Game homepage
│   ├── story.tsx            # Main story gameplay page
│   ├── adventures.tsx       # Adventure management
│   └── api/                 # Backend API routes
│       ├── party-classes.ts # Character class API
│       └── party-configurations.ts # Party management API
├── 📁 docs/                 # Technical documentation
│   ├── extensible-character-model.md # Character system documentation
│   ├── supabase-integration.md
│   ├── supabase-schema.md
│   └── enhanced-game-state-management.md
├── 📁 scripts/             # Database migration scripts
│   ├── migrate-story-data.sql
│   ├── party-system-migration.sql
│   ├── extensible-character-migration.sql
│   └── PARTY_MIGRATION_README.md
├── 📁 demos/               # Usage examples
│   └── extensible-character-demo.ts
└── 📁 tests/               # Test files
    ├── party-creation.test.ts
    └── character-extensibility.test.ts
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint code analysis

# Testing
# Note: Add your own testing framework as needed
```

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4+ with dark/light theme support  
- **Database**: Supabase (PostgreSQL) with optional fallback mode
- **PWA**: next-pwa for offline functionality and mobile app experience
- **State Management**: Custom game state manager with localStorage fallback

## 🤖 AI Integration Architecture

The game is designed with smart content management:

### Current Implementation
- **Static Content**: Curated story paths with consistent quality
- **Database Driven**: Stories stored in Supabase for easy content management
- **Fallback Mode**: Built-in stories ensure the game always works

### AI-Ready Architecture
The system is designed to easily integrate AI-generated content:
- **Modular Story Service**: Pluggable content sources (database, API, AI)
- **Flexible Schema**: Support for dynamic content and AI-generated branches  
- **Choice Validation**: Robust handling of AI-generated decision paths
- **Content Caching**: Efficient storage and retrieval of generated content

*Future Enhancement Opportunity*: The architecture supports adding AI-powered story generation while maintaining the current reliable experience.

## 📚 How Supabase Integration Works

### Database Schema
The game uses a simple but powerful database structure:

- **`stories`**: Story metadata (title, description, active status)
- **`story_nodes`**: Individual story scenes with text and titles
- **`choices`**: Player decision options linking story nodes
- **`user_sessions`**: Anonymous session management  
- **`game_states`**: Player progress and save data

### Data Flow
1. **Session Creation**: Anonymous session generated on first visit
2. **Story Selection**: Random story chosen from available options
3. **Progress Tracking**: Each choice automatically saved to database
4. **State Recovery**: Previous progress restored on return visits

### Security & Privacy
- **Anonymous Sessions**: No personal data required to play
- **Row Level Security**: Supabase RLS protects user data
- **Graceful Fallback**: Game works even if database is unavailable
- **Local Storage**: Fallback session management for offline play

For detailed technical documentation, see:
- [Extensible Character Model Guide](docs/extensible-character-model.md)
- [Supabase Integration Guide](docs/supabase-integration.md)
- [Database Schema Documentation](docs/supabase-schema.md)  
- [Game State Management](docs/enhanced-game-state-management.md)
- [Party Migration Guide](scripts/PARTY_MIGRATION_README.md)

## 🎯 Adding New Stories

### With Supabase (Recommended)
1. **Add Story Record**:
   ```sql
   INSERT INTO stories (id, title, description, is_active) 
   VALUES ('new-adventure', 'Epic Quest', 'A thrilling adventure...', true);
   ```

2. **Add Story Nodes**:
   ```sql
   INSERT INTO story_nodes (id, story_id, title, text, is_ending) 
   VALUES ('start', 'new-adventure', 'The Beginning', 'Your story starts...', false);
   ```

3. **Add Choices**:
   ```sql
   INSERT INTO choices (id, story_node_id, text, next_node_id, order_index)
   VALUES ('choice1', 'start', 'Go left', 'left_path', 0);
   ```

### Without Supabase (Fallback Mode)
Edit `lib/fallback-story-data.ts` to add new stories and story nodes following the existing data structure.

## 🛠️ API Documentation

The game provides RESTful APIs for managing party configurations and character data:

### Party Classes API

**GET** `/api/party-classes`
- Returns all available character classes with their abilities and stats
- Supports fallback mode when database is unavailable
- Response includes class details, abilities, and base statistics

```typescript
// Example response
{
  "success": true,
  "data": [
    {
      "id": "barbarian",
      "name": "Barbarian",
      "description": "A fierce warrior driven by primal rage and brute strength.",
      "abilities": ["Rage", "Reckless Attack", "Danger Sense"],
      "baseStats": {
        "strength": 17,
        "dexterity": 13,
        "intelligence": 8,
        "wisdom": 12,
        "charisma": 10,
        "constitution": 16
      }
    }
  ],
  "source": "database" // or "fallback"
}
```

### Party Configurations API

**GET** `/api/party-configurations?sessionId={id}&storyId={id}`
- Retrieve party configuration for a session and story
- Returns party members with full character details

**POST** `/api/party-configurations`
- Create new party configuration
- Body: `{ sessionId, storyId, partyConfig }`

**PUT** `/api/party-configurations/{id}`
- Update existing party configuration
- Supports adding/removing party members

**DELETE** `/api/party-configurations/{id}`
- Remove party configuration

### Character Management Functions

The `GameStateManager` class provides programmatic access to character features:

```typescript
// Create party member
const character = GameStateManager.createPartyMember(name, classId, customAttributes?)

// Add custom attributes
const enhanced = GameStateManager.setCharacterAttribute(character, attributeId, value, options?)

// Add character traits
const trait = GameStateManager.setCharacterTrait(character, trait, value, category)

// Manage relationships
const relationship = GameStateManager.setCharacterRelationship(character, targetId, type, strength, metadata?)

// Retrieve attributes
const value = GameStateManager.getCharacterAttribute(character, attributeId)
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Setting up the development environment
- Code style and conventions  
- Submitting pull requests
- Adding new features and story content
- Reporting bugs and feature requests

## 🔧 Environment Variables

```bash
# Required for Supabase integration (optional)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Set to 'true' to disable telemetry
NEXT_TELEMETRY_DISABLED=1
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on each push

### Other Platforms
The application is a standard Next.js app and can be deployed to any platform supporting Node.js:
- Netlify
- Railway  
- AWS Amplify
- Google Cloud Run
- Self-hosted with Docker

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [React](https://reactjs.org/)
- Database powered by [Supabase](https://supabase.com)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- PWA functionality via [next-pwa](https://github.com/shadowwalker/next-pwa)

---

**Ready to begin your adventure?** 🎭

Start by running `npm install && npm run dev`, then visit http://localhost:3000 to begin your journey!
