# Contributing to Story Rider

Thank you for your interest in contributing to Story Rider! This guide will help you get started with contributing to our interactive text adventure game.

## 🎯 Ways to Contribute

### 🐛 Bug Reports
- Use the GitHub issue tracker to report bugs
- Include detailed steps to reproduce the issue
- Mention your operating system, browser, and Node.js version
- Include screenshots if applicable

### 💡 Feature Requests
- Open an issue with the "enhancement" label
- Describe the feature and its benefits clearly
- Consider how it fits with the game's vision and architecture

### 📖 Story Content
- Add new interactive stories and branching narratives
- Improve existing story paths and choices
- Fix typos and improve story text quality

### 👥 Party & Character System
- Create new character classes with unique abilities
- Add custom character attributes and traits
- Enhance party creation and management features
- Contribute to the extensible character model

### 💻 Code Contributions
- Bug fixes and performance improvements
- New game features and mechanics
- UI/UX enhancements
- Documentation improvements

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18+ 
- **npm**: Version 8+ (comes with Node.js)
- **Git**: For version control
- **Code Editor**: VS Code recommended with TypeScript support

### Development Setup

1. **Fork and Clone**
   ```bash
   # Fork the repository on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/jubilant-telegram.git
   cd jubilant-telegram
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment** (Optional)
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit .env.local with your Supabase credentials if testing database features
   # The game works without this setup using fallback data
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Open Browser**
   Visit http://localhost:3000 to see the application running

### Development Workflow

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make Changes**
   - Write your code following our style guidelines
   - Test your changes thoroughly
   - Add tests if applicable

3. **Test Your Changes**
   ```bash
   # Build the application
   npm run build
   
   # Run linting
   npm run lint
   
   # Test in development mode
   npm run dev
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new story branching feature"
   
   # Or for bug fixes:
   git commit -m "fix: resolve choice selection bug"
   ```

5. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a pull request on GitHub.

## 📝 Code Style Guidelines

### TypeScript & JavaScript
- Use TypeScript for all new code
- Follow existing code patterns and conventions
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Prefer functional components and hooks

### React Components
- Use TypeScript interfaces for props
- Keep components focused and single-responsibility
- Use meaningful component names
- Extract reusable logic into custom hooks

### Styling
- Use Tailwind CSS utility classes
- Follow existing design patterns
- Ensure dark/light theme compatibility
- Test responsive design on mobile and desktop

### Code Formatting
- The project uses Prettier for code formatting
- ESLint enforces code quality rules
- Run `npm run lint` before committing

### Example Code Style

```typescript
// ✅ Good: Clear interface and well-documented function
interface StoryChoice {
  id: string
  text: string
  nextNodeId: string
}

/**
 * Handles player choice selection and updates game state
 * @param choice - The selected choice object
 * @param gameState - Current game state
 * @returns Updated game state with choice recorded
 */
const handleChoiceSelection = (
  choice: StoryChoice,
  gameState: GameState
): GameState => {
  // Implementation here
}

// ✅ Good: Functional component with TypeScript
interface StoryContentProps {
  title: string
  text: string
  enableAnimations?: boolean
}

const StoryContent: React.FC<StoryContentProps> = ({ 
  title, 
  text, 
  enableAnimations = true 
}) => {
  return (
    <div className="story-content">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-4 text-zinc-700 dark:text-zinc-300">{text}</p>
    </div>
  )
}
```

## 🎨 Adding New Stories

### Using Supabase (Database)

1. **Create Story Record**
   ```sql
   INSERT INTO stories (id, title, description, is_active) 
   VALUES ('adventure-id', 'Story Title', 'Brief description', true);
   ```

2. **Add Story Nodes**
   ```sql
   INSERT INTO story_nodes (id, story_id, title, text, is_ending) 
   VALUES ('node-id', 'adventure-id', 'Scene Title', 'Scene text...', false);
   ```

3. **Add Choices**
   ```sql
   INSERT INTO choices (id, story_node_id, text, next_node_id, order_index)
   VALUES ('choice-id', 'node-id', 'Choice text', 'next-node-id', 0);
   ```

### Using Fallback Data (Code)

Edit `lib/fallback-story-data.ts`:

```typescript
// Add to fallbackStories object
'new-story': {
  id: 'new-story',
  title: 'The New Adventure',
  description: 'An exciting new journey awaits...',
  isActive: true
}

// Add story nodes to fallbackStoryNodes object
'new_start': {
  id: 'new_start',
  storyId: 'new-story',
  title: 'The Beginning',
  text: 'Your adventure starts here...',
  choices: [
    { id: 'choice1', text: 'Go left', nextNodeId: 'left_path' },
    { id: 'choice2', text: 'Go right', nextNodeId: 'right_path' }
  ]
}
```

### Story Writing Guidelines

- **Engaging Opening**: Hook the player immediately
- **Clear Choices**: Make decision options distinct and meaningful
- **Consistent Tone**: Maintain the story's voice throughout
- **Balanced Branching**: Provide 2-4 choices per scene typically
- **Multiple Endings**: Create various conclusion paths
- **Inventory Integration**: Use the inventory system for items when appropriate

## 👥 Developing Party & Character Features

### Adding New Character Classes

1. **Update GameStateManager** (`lib/game-state-manager.ts`):
   ```typescript
   // Add to DEFAULT_PARTY_CLASSES array
   {
     id: 'new-class',
     name: 'New Class',
     description: 'A unique character with special abilities.',
     abilities: ['Special Ability', 'Unique Power', 'Class Feature'],
     baseStats: {
       strength: 15,
       dexterity: 12,
       intelligence: 14,
       wisdom: 13,
       charisma: 11,
       constitution: 16
     }
   }
   ```

2. **Update Database** (if using Supabase):
   ```sql
   INSERT INTO party_member_classes (id, name, description, abilities, base_stats, is_active)
   VALUES ('new-class', 'New Class', 'Description...', 
           '["Special Ability", "Unique Power", "Class Feature"]',
           '{"strength": 15, "dexterity": 12, ...}', true);
   ```

### Extending the Character Model

1. **Adding Custom Attributes**:
   ```typescript
   // Example: Add a "luck" attribute to a character
   const enhanced = GameStateManager.setCharacterAttribute(character, 'luck', 15, {
     category: 'custom',
     displayName: 'Luck',
     description: 'Influences random events',
     constraints: { min: 1, max: 20 }
   })
   ```

2. **Adding Character Traits**:
   ```typescript
   // Add personality traits
   const social = GameStateManager.setCharacterTrait(character, 'brave', true, 'personality')
   const quirky = GameStateManager.setCharacterTrait(character, 'collects_maps', {
     level: 'obsessive',
     count: 47
   }, 'quirks')
   ```

3. **Character Relationships**:
   ```typescript
   // Create relationships between party members
   const friendly = GameStateManager.setCharacterRelationship(
     character1, character2.id, 'friendship', 75, {
       notes: 'Met during tavern brawl',
       sharedExperiences: ['Dragon Hunt']
     }
   )
   ```

### Party System Guidelines

- **Balance**: Ensure new classes are balanced with existing ones
- **Uniqueness**: Each class should have distinct abilities and playstyle
- **Extensibility**: Use the extensible model for new features
- **Backward Compatibility**: Don't break existing party configurations
- **Documentation**: Update relevant docs when adding features

### Testing Party Features

- [ ] New character classes create successfully
- [ ] Custom attributes save and load correctly
- [ ] Party configurations persist across sessions
- [ ] Character relationships work as expected
- [ ] Extensible model maintains backward compatibility
- [ ] Database migration works without data loss
- [ ] API endpoints handle party data correctly

## 🧪 Testing Guidelines

### Manual Testing Checklist

- [ ] Game loads without errors
- [ ] Story progression works correctly
- [ ] Choices lead to expected outcomes
- [ ] Game state persists correctly
- [ ] Party creation and management works
- [ ] Character classes load with correct abilities
- [ ] Custom attributes save and restore properly
- [ ] Works in both database and fallback modes
- [ ] Responsive design works on mobile and desktop
- [ ] Dark/light theme switching works
- [ ] PWA functionality works correctly

### Areas to Test

1. **Story Flow**: Ensure all choice paths work correctly
2. **State Management**: Verify progress saves and restores properly
3. **Party System**: Test character creation, party management, and extensible features
4. **Database Integration**: Test with and without Supabase
5. **Error Handling**: Test with invalid data and network issues
6. **Accessibility**: Test with keyboard navigation and screen readers
7. **Performance**: Ensure smooth animations and fast loading

### Adding Tests

While formal tests aren't currently set up, you can add them:

```typescript
// Example test structure for future implementation
describe('GameStateManager', () => {
  it('should record choices correctly', () => {
    // Test implementation
  })
  
  it('should handle inventory updates', () => {
    // Test implementation
  })
  
  it('should create party members with correct attributes', () => {
    // Test party creation
  })
  
  it('should support extensible character attributes', () => {
    // Test character model extensibility
  })
})

describe('Party System', () => {
  it('should create valid party configurations', () => {
    // Test party creation
  })
  
  it('should enforce party size limits', () => {
    // Test validation
  })
})
```

## 🔍 Project Architecture

Understanding the codebase structure will help you contribute effectively:

### Key Components

- **`pages/story.tsx`**: Main gameplay interface
- **`lib/story-service.ts`**: Data access layer
- **`lib/game-state-manager.ts`**: Progress tracking logic
- **`components/story-content.tsx`**: Story display component
- **`components/story-choices.tsx`**: Choice interaction component

### Data Flow

1. **Session Creation**: `StoryService.getOrCreateSessionId()`
2. **Story Loading**: `StoryService.getRandomStory()`
3. **Node Fetching**: `StoryService.getStoryNode()`
4. **Choice Handling**: `StoryService.saveGameState()` with choice data
5. **State Persistence**: Automatic save to localStorage or Supabase

### Database Schema

- **stories**: Story metadata
- **story_nodes**: Individual scenes
- **choices**: Player decision options  
- **user_sessions**: Anonymous session tracking
- **game_states**: Progress and save data

## 📋 Pull Request Guidelines

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All new code has appropriate TypeScript types
- [ ] Changes are tested manually
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventional format

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Story content
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Tested manually in development mode
- [ ] Tested with database mode (if applicable)
- [ ] Tested with fallback mode
- [ ] Tested on mobile device
- [ ] Tested accessibility features

## Screenshots
Include screenshots for UI changes

## Notes
Any additional context or considerations
```

### Review Process

1. **Automated Checks**: Ensure build and lint checks pass
2. **Code Review**: Maintainer will review code quality and design
3. **Testing**: Verify functionality works as expected
4. **Documentation**: Check if documentation needs updates
5. **Merge**: PR will be merged after approval

## 🆘 Getting Help

### Documentation Resources

- **Technical Docs**: See `/docs` directory for detailed technical information
- **README**: Project overview and setup instructions
- **Code Comments**: Inline documentation throughout the codebase

### Community Support

- **GitHub Issues**: Ask questions or report problems
- **Discussions**: Share ideas and get feedback
- **Pull Requests**: Collaborate on improvements

### Common Questions

**Q: How do I test Supabase integration?**
A: Set up a free Supabase project and add the environment variables. The app works in fallback mode without this setup.

**Q: Can I contribute without database knowledge?**
A: Yes! You can contribute code improvements, UI enhancements, and story content using the fallback data system.

**Q: How do I add a new game feature?**
A: Start by opening an issue to discuss the feature, then follow the development workflow to implement it.

**Q: What's the best way to learn the codebase?**
A: Start by running the application locally, then explore the `/lib` directory and main components.

## 🙏 Thank You

Your contributions help make Story Rider a better experience for everyone. Whether you're fixing a bug, adding a feature, or creating new story content, every contribution is valuable!

Ready to contribute? Check out the [open issues](https://github.com/chrisrneal/jubilant-telegram/issues) or start by exploring the codebase and playing the game to get familiar with how it works.