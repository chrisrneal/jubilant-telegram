# Extensible Character Model Design

## Overview

The character system has been redesigned to be fully extensible, allowing for seamless addition of new attributes, relationships, and features without breaking existing data or requiring schema changes.

## Key Design Principles

### 1. **Backward Compatibility**
- All existing character data continues to work unchanged
- Core stats (strength, dexterity, etc.) remain accessible through the original API
- Existing party creation and validation logic works as before

### 2. **Progressive Enhancement** 
- New extensible fields are optional and don't break existing functionality
- Characters can be enhanced with new attributes while preserving original structure
- Migration system automatically upgrades old data to new format when accessed

### 3. **Non-Breaking Extension**
- Adding new attributes doesn't require database schema changes
- Future features can be added through extension points
- Version control ensures safe evolution of the character model

## Architecture Components

### Core Interfaces

#### `CharacterAttribute`
```typescript
interface CharacterAttribute {
  value: number
  category?: 'core' | 'derived' | 'custom' | 'relationship'
  displayName?: string
  description?: string
  constraints?: {
    min?: number
    max?: number
    readonly?: boolean
  }
}
```

#### `CharacterAttributes`
```typescript
interface CharacterAttributes {
  [attributeId: string]: CharacterAttribute
}
```

### Extended Character Model

#### `PartyMember` (Extended)
- **`modelVersion`**: Version control for safe migrations
- **`dynamicAttributes`**: Extensible attribute system
- **`relationships`**: Inter-character relationships
- **`traits`**: Character traits and personality features
- **`experienceData`**: Experience and skill progression
- **`extensionData`**: Future extension point

#### `PartyMemberClass` (Extended)
- **`extendedAttributes`**: Class-specific extensible attributes
- **`attributeSchema`**: Defines available attributes for the class
- **`relationshipTypes`**: Supported relationship types
- **`traitCategories`**: Available trait categories

#### `PartyConfiguration` (Extended)
- **`partyTraits`**: Party-wide traits and bonuses
- **`dynamics`**: Party cohesion and specialization data

## Usage Examples

### Adding Custom Attributes

```typescript
// Create character with custom magic resistance
const hero = GameStateManager.createPartyMember('Arcane Warrior', 'barbarian')
const enhancedHero = GameStateManager.setCharacterAttribute(hero, 'magicResistance', 25, {
  category: 'custom',
  displayName: 'Magic Resistance',
  description: 'Resistance to magical attacks',
  constraints: { min: 0, max: 100 }
})
```

### Adding Character Traits

```typescript
// Add personality traits
const traitsHero = GameStateManager.setCharacterTrait(hero, 'brave', true, 'personality')
const quirkyHero = GameStateManager.setCharacterTrait(traitsHero, 'collects_maps', {
  level: 'obsessive',
  items_collected: 47
}, 'quirks')
```

### Adding Relationships

```typescript
// Create relationship between characters  
const friendlyHero = GameStateManager.setCharacterRelationship(
  hero, 
  wizard.id, 
  'friendship', 
  75,
  { 
    notes: 'Met during tavern brawl',
    sharedExperiences: ['Dragon Hunt', 'Treasure Quest']
  }
)
```

### Retrieving Attributes

```typescript
// Get attributes with fallback to core stats
const strength = GameStateManager.getCharacterAttribute(hero, 'strength') // From core stats
const magicResistance = GameStateManager.getCharacterAttribute(hero, 'magicResistance') // From dynamic attributes
```

## Extension Strategies

### 1. **Attribute Categories**

- **`core`**: Basic character stats (strength, dexterity, etc.)
- **`derived`**: Calculated from other attributes (e.g., spell power from intelligence)
- **`custom`**: Game-specific attributes (magic resistance, reputation)
- **`relationship`**: Attributes that affect relationships with others

### 2. **Future Feature Support**

The system is designed to support future features:

- **Skills System**: Use `experienceData.skillXP` for individual skill progression
- **Equipment Effects**: Add equipment bonuses to `dynamicAttributes`
- **Status Effects**: Use `traits` for temporary conditions
- **Achievement System**: Use `experienceData.milestones` for achievements
- **Social Systems**: Expand `relationships` for complex social mechanics

### 3. **Database Extensibility**

The database schema uses JSONB fields for maximum flexibility:

- **`extended_attributes`**: Class-specific extensible attributes
- **`dynamic_attributes`**: Character-specific attribute overrides
- **`relationships`**: Inter-character relationship data
- **`traits`**: Character traits and conditions
- **`extension_data`**: Future feature storage

## Migration Strategy

### Automatic Migrations

The system automatically migrates old data when accessed:

```typescript
// Old character data is automatically migrated
const migratedMember = GameStateManager.migrateCharacterModel(oldMember)
const migratedParty = GameStateManager.migratePartyConfiguration(oldParty)
```

### Version Control

- **`modelVersion`** tracks the character model version
- Migrations are applied incrementally based on version differences
- Future schema changes can be handled gracefully

### Backward Compatibility

```typescript
// Old API still works
const hero = GameStateManager.createPartyMember('Hero', 'barbarian', { customStat: 42 })
const party = GameStateManager.createPartyConfiguration([hero])

// But new features are available
const enhancedHero = GameStateManager.setCharacterAttribute(hero, 'luck', 15)
```

## Database Schema Changes

### New Columns Added

**party_member_classes:**
- `model_version` (INTEGER)
- `extended_attributes` (JSONB)
- `attribute_schema` (JSONB)
- `relationship_types` (JSONB)
- `trait_categories` (JSONB)
- `extension_data` (JSONB)

**party_members:**
- `model_version` (INTEGER)
- `dynamic_attributes` (JSONB)
- `relationships` (JSONB)
- `traits` (JSONB)
- `experience_data` (JSONB)
- `extension_data` (JSONB)

**party_configurations:**
- `model_version` (INTEGER)
- `party_traits` (JSONB)
- `dynamics` (JSONB)
- `extension_data` (JSONB)

### Helpful Views and Functions

- **`character_extended_view`**: Complete character information including extensions
- **`character_attributes_view`**: All character attributes with fallbacks
- **`character_relationships_view`**: Character relationship data
- **`get_character_attribute()`**: Function to retrieve any attribute
- **`get_character_traits()`**: Function to retrieve all character traits

## Future Roadmap

### Phase 1 ✅ (Completed)
- [x] Core extensible character model
- [x] Dynamic attribute system
- [x] Character relationships and traits
- [x] Migration and backward compatibility
- [x] Database schema extensions

### Phase 2 (Next Steps)
- [ ] Skills and progression system
- [ ] Equipment and inventory effects  
- [ ] Status effects and conditions
- [ ] Party dynamics and synergies

### Phase 3 (Future)
- [ ] Social interaction systems
- [ ] Achievement and milestone tracking
- [ ] Advanced relationship mechanics
- [ ] Procedural character generation

## Benefits

### For Developers
- **Easy Feature Addition**: Add new character features without schema changes
- **Safe Migrations**: Version-controlled evolution of character data
- **Backward Compatibility**: Existing code continues to work
- **Flexible Storage**: JSONB fields adapt to any data structure

### For Game Design
- **Rich Characters**: Support for complex character builds and relationships
- **Dynamic Gameplay**: Characters can evolve in response to story events
- **Social Mechanics**: Relationship system enables rich party dynamics
- **Extensible Content**: Easy to add new classes, traits, and features

### For Data Management
- **Non-Breaking Changes**: Add features without disrupting existing players
- **Graceful Evolution**: Character data evolves safely over time
- **Efficient Storage**: Optimal use of database features
- **Query Flexibility**: Rich querying capabilities with views and functions

## Testing

The extensible character model includes comprehensive tests:

- **`character-extensibility.test.ts`**: Tests all extensibility features
- **`game-state-manager.test.ts`**: Tests backward compatibility
- **`party-creation.test.ts`**: Tests party creation functionality

All existing tests continue to pass, ensuring no regressions.

## Migration Instructions

1. **Apply Database Migration**:
   ```sql
   -- Run scripts/extensible-character-migration.sql
   ```

2. **Update Application Code**:
   ```typescript
   // Use new extensible APIs
   const hero = GameStateManager.createPartyMember('Hero', 'barbarian')
   const enhanced = GameStateManager.setCharacterAttribute(hero, 'newStat', 42)
   ```

3. **Existing Data Automatically Migrates**:
   - No manual data conversion required
   - Migration happens automatically when data is accessed
   - All existing functionality preserved

The extensible character model provides a solid foundation for rich, evolving character systems while maintaining complete backward compatibility with existing game data.