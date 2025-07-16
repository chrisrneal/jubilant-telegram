/**
 * Demonstration of the Extensible Character Model
 * This script shows how to use the new extensible features
 */

import { GameStateManager } from '../lib/game-state-manager'

console.log('🎭 Extensible Character Model Demonstration\n')

// 1. Create a basic character (backward compatible)
console.log('1️⃣ Creating a basic character (old way still works):')
let hero = GameStateManager.createPartyMember('Lyra the Bold', 'barbarian')
if (hero) {
    console.log(`   ✓ Created ${hero.name} (${hero.class.name})`)
    console.log(`   ✓ Base Strength: ${GameStateManager.getCharacterAttribute(hero, 'strength')}`)
    console.log(`   ✓ Model Version: ${hero.modelVersion}`)
}

console.log('\n2️⃣ Adding custom attributes:')
if (hero) {
    // Add custom attributes
    let enhancedHero = GameStateManager.setCharacterAttribute(hero, 'magicResistance', 35, {
        category: 'custom',
        displayName: 'Magic Resistance',
        description: 'Resistance to magical attacks',
        constraints: { min: 0, max: 100 }
    })
    
    enhancedHero = GameStateManager.setCharacterAttribute(enhancedHero, 'reputation', 65, {
        category: 'relationship',
        displayName: 'Reputation',
        description: 'Standing in the community'
    })
    
    enhancedHero = GameStateManager.setCharacterAttribute(enhancedHero, 'spellPower', 20, {
        category: 'derived',
        displayName: 'Spell Power',
        description: 'Magical casting ability'
    })
    
    console.log(`   ✓ Added Magic Resistance: ${GameStateManager.getCharacterAttribute(enhancedHero, 'magicResistance')}`)
    console.log(`   ✓ Added Reputation: ${GameStateManager.getCharacterAttribute(enhancedHero, 'reputation')}`)
    console.log(`   ✓ Added Spell Power: ${GameStateManager.getCharacterAttribute(enhancedHero, 'spellPower')}`)
    console.log(`   ✓ Original Strength still available: ${GameStateManager.getCharacterAttribute(enhancedHero, 'strength')}`)
    
    // Update hero reference
    hero = enhancedHero
}

console.log('\n3️⃣ Adding character traits:')
if (hero) {
    let traitedHero = GameStateManager.setCharacterTrait(hero, 'brave', true, 'personality')
    traitedHero = GameStateManager.setCharacterTrait(traitedHero, 'scar_from_dragon', {
        description: 'Battle scar from dragon encounter',
        location: 'left arm',
        story: 'Fought ancient red dragon in the Scorching Peaks'
    }, 'background')
    traitedHero = GameStateManager.setCharacterTrait(traitedHero, 'collects_rare_weapons', {
        passion_level: 'moderate',
        collection_size: 7,
        favorite: 'Enchanted Battleaxe of Storms'
    }, 'quirks')
    
    console.log(`   ✓ Added trait 'brave': ${traitedHero.traits?.brave?.value}`)
    console.log(`   ✓ Added trait 'scar_from_dragon': ${JSON.stringify(traitedHero.traits?.scar_from_dragon?.value)}`)
    console.log(`   ✓ Added trait 'collects_rare_weapons': ${JSON.stringify(traitedHero.traits?.collects_rare_weapons?.value)}`)
    
    // Update hero reference
    hero = traitedHero
}

console.log('\n4️⃣ Creating a second character and adding relationships:')
let wizard = GameStateManager.createPartyMember('Zara the Wise', 'mage')
if (hero && wizard) {
    // Add relationship from hero to wizard
    const socialHero = GameStateManager.setCharacterRelationship(
        hero,
        wizard.id,
        'friendship',
        80,
        {
            notes: 'Saved each other during the Battle of Thornwall',
            sharedExperiences: ['Dragon Hunt', 'Ancient Ruins Exploration'],
            trustLevel: 'high',
            cooperation_bonus: 15
        }
    )
    
    // Add reciprocal relationship
    const socialWizard = GameStateManager.setCharacterRelationship(
        wizard,
        hero.id,
        'friendship',
        75,
        {
            notes: 'Reliable companion, though sometimes reckless',
            sharedExperiences: ['Dragon Hunt', 'Ancient Ruins Exploration'],
            trustLevel: 'high'
        }
    )
    
    const heroRelationship = socialHero.relationships?.[wizard.id]
    console.log(`   ✓ ${hero.name} → ${wizard.name}: ${heroRelationship?.type} (strength: ${heroRelationship?.strength})`)
    console.log(`   ✓ Shared experiences: ${JSON.stringify(heroRelationship?.data?.sharedExperiences)}`)
    
    // Update references
    hero = socialHero
    wizard = socialWizard
}

console.log('\n5️⃣ Creating extensible party configuration:')
if (hero && wizard) {
    const party = GameStateManager.createPartyConfiguration(
        [hero, wizard],
        'defensive',
        {
            partyTraits: {
                experienced_team: {
                    value: true,
                    source: 'shared_adventures',
                    effects: { coordination_bonus: 10, experience_bonus: 5 }
                },
                dragon_slayers: {
                    value: 'certified',
                    source: 'battle_achievement',
                    effects: { fear_resistance: 25, dragon_damage_bonus: 20 }
                }
            },
            dynamics: {
                cohesion: 85,
                leadership: hero.id,
                specializations: {
                    'front_line': hero.id,
                    'magic_support': wizard.id,
                    'strategist': wizard.id
                }
            }
        }
    )
    
    console.log(`   ✓ Created party with ${party.members.length} members`)
    console.log(`   ✓ Party cohesion: ${party.dynamics?.cohesion}`)
    console.log(`   ✓ Leader: ${party.dynamics?.leadership === hero.id ? hero.name : wizard.name}`)
    console.log(`   ✓ Party traits: ${Object.keys(party.partyTraits || {}).join(', ')}`)
    console.log(`   ✓ Model version: ${party.modelVersion}`)
}

console.log('\n6️⃣ Testing migration (backward compatibility):')
// Simulate old character data (without extensible fields)
const legacyMember = {
    id: 'legacy-hero',
    name: 'Legacy Champion',
    class: GameStateManager.getAvailablePartyClasses()[0], // barbarian
    level: 1,
    createdAt: new Date().toISOString()
    // Missing modelVersion and extensible fields
}

const migratedMember = GameStateManager.migrateCharacterModel(legacyMember as any)
console.log(`   ✓ Migrated legacy character: ${migratedMember.name}`)
console.log(`   ✓ Model version updated to: ${migratedMember.modelVersion}`)
console.log(`   ✓ Dynamic attributes initialized: ${Object.keys(migratedMember.dynamicAttributes || {}).length} attributes`)
console.log(`   ✓ Traits initialized: ${typeof migratedMember.traits}`)
console.log(`   ✓ Relationships initialized: ${typeof migratedMember.relationships}`)

console.log('\n7️⃣ Creating extensible character class:')
const paladinClass = GameStateManager.createExtensibleCharacterClass(
    'paladin',
    'Paladin',
    'A holy warrior blessed with divine power',
    ['Divine Smite', 'Lay on Hands', 'Aura of Protection', 'Divine Shield'],
    {
        strength: 15,
        dexterity: 10,
        intelligence: 11,
        wisdom: 14,
        charisma: 16,
        constitution: 13
    },
    {
        divineEnergy: GameStateManager.createCharacterAttribute(20, {
            category: 'custom',
            displayName: 'Divine Energy',
            description: 'Pool of divine power for special abilities',
            constraints: { min: 0, max: 100 }
        }),
        holyAura: GameStateManager.createCharacterAttribute(15, {
            category: 'derived',
            displayName: 'Holy Aura',
            description: 'Radius of divine protection aura',
            constraints: { min: 0, max: 30, readonly: true }
        })
    },
    {
        relationshipTypes: ['divine_bond', 'oath_keeper', 'nemesis', 'blessed_ally'],
        traitCategories: ['divine', 'personality', 'oath', 'virtue'],
        attributeSchema: {
            divineEnergy: { type: 'number', required: true, defaultValue: 20, category: 'divine' },
            holyAura: { type: 'number', required: false, defaultValue: 15, category: 'divine' },
            oathLevel: { type: 'string', required: false, defaultValue: 'novice', category: 'divine' }
        }
    }
)

console.log(`   ✓ Created extensible class: ${paladinClass.name}`)
console.log(`   ✓ Extended attributes: ${Object.keys(paladinClass.extendedAttributes || {}).join(', ')}`)
console.log(`   ✓ Relationship types: ${paladinClass.relationshipTypes?.join(', ')}`)
console.log(`   ✓ Trait categories: ${paladinClass.traitCategories?.join(', ')}`)
console.log(`   ✓ Model version: ${paladinClass.modelVersion}`)

console.log('\n✨ Demonstration complete! The extensible character model supports:')
console.log('   • Backward compatibility with existing characters')
console.log('   • Dynamic addition of custom attributes')
console.log('   • Rich character traits and personality features')
console.log('   • Complex inter-character relationships')
console.log('   • Party-level dynamics and traits')
console.log('   • Extensible character classes with custom schemas')
console.log('   • Automatic migration of legacy data')
console.log('   • Future-proof extension points')
console.log('\n🎉 Ready for extensible character adventures!')

export { }