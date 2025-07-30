# Story Node Encounter Types - Usage Examples

This document demonstrates how to use the new encounter type system for creating different types of story nodes.

## Narrative Encounters (Default)

Traditional story nodes work exactly as before:

```typescript
const narrativeNode: StoryNode = {
  id: 'forest_clearing',
  storyId: 'mystical-forest',
  title: 'A Peaceful Clearing',
  text: 'You find yourself in a beautiful forest clearing bathed in golden sunlight.',
  // type defaults to 'narrative' if not specified
  choices: [
    { id: 'rest', text: 'Rest here for a while', nextNodeId: 'rested' },
    { id: 'continue', text: 'Continue deeper into forest', nextNodeId: 'deeper_forest' }
  ]
}
```

## NPC Encounters

For character interactions:

```typescript
const npcNode: StoryNode = {
  id: 'village_elder',
  storyId: 'mystical-forest', 
  title: 'Meeting the Village Elder',
  text: 'An old man with wise eyes approaches you, carrying an ancient staff.',
  type: 'npc',
  npc: {
    npc_name: 'Elder Theron',
    npc_description: 'A keeper of ancient forest lore and village wisdom',
    dialogue_options: [
      'Ask about the mysterious door',
      'Inquire about local dangers',
      'Request guidance on your quest'
    ],
    relationship_changes: {
      'elder_trust': 1,
      'village_reputation': 1
    }
  },
  choices: [
    { id: 'ask_door', text: 'Ask about the mysterious door', nextNodeId: 'door_lore' },
    { id: 'ask_dangers', text: 'What dangers lurk here?', nextNodeId: 'danger_warning' },
    { id: 'ask_guidance', text: 'Can you guide me?', nextNodeId: 'elder_guidance' }
  ]
}
```

## Battle Encounters

For combat scenarios:

```typescript
const battleNode: StoryNode = {
  id: 'goblin_ambush',
  storyId: 'mystical-forest',
  title: 'Goblin Ambush!',
  text: 'Three forest goblins leap from the undergrowth, brandishing crude weapons!',
  type: 'battle',
  battle: {
    enemies: ['Forest Goblin Scout', 'Forest Goblin Warrior', 'Forest Goblin Shaman'],
    battle_type: 'turn_based',
    difficulty: 'medium',
    rewards: {
      experience: 200,
      gold: 75,
      items: ['goblin_dagger', 'forest_herbs']
    }
  },
  choices: [
    { id: 'fight', text: 'Stand and fight!', nextNodeId: 'battle_outcome' },
    { id: 'flee', text: 'Try to escape', nextNodeId: 'escape_attempt' },
    { id: 'negotiate', text: 'Attempt to negotiate', nextNodeId: 'goblin_parley' }
  ]
}
```

## Backward Compatibility

All existing story nodes continue to work without modification:

- Nodes without a `type` field automatically default to `'narrative'`
- All existing choice functionality is preserved
- No changes required to existing data structures

## Future Extensions

The encounter system is designed to be extensible:

- Additional encounter types can be added to the union type
- New encounter-specific data interfaces can be defined
- The system supports rich, structured data for complex encounters

This provides a foundation for implementing full NPC dialogue systems, turn-based combat, and other advanced gameplay features while maintaining backward compatibility with existing narrative content.