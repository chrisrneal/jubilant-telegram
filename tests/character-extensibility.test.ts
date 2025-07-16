/**
 * Comprehensive tests for the extensible character model system
 * These tests verify that the character system can be extended without breaking existing functionality
 */

import { GameStateManager } from '../lib/game-state-manager'
import { PartyMember, PartyConfiguration, CharacterAttribute } from '../lib/supabase'

// Mock console methods for cleaner test output
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn
const originalConsoleError = console.error
console.log = () => {}
console.warn = () => {}
console.error = () => {}

function runExtensibilityTests() {
    let passed = 0
    let failed = 0

    function test(name: string, testFn: () => boolean) {
        try {
            if (testFn()) {
                console.log(`✅ ${name}`)
                passed++
            } else {
                console.error(`❌ ${name}`)
                failed++
            }
        } catch (error) {
            console.error(`❌ ${name} - Error: ${error}`)
            failed++
        }
    }

    console.log('🧪 Running Character Extensibility Tests...\n')

    // Test 1: Create character attribute
    test('Can create character attributes with proper metadata', () => {
        const attribute = GameStateManager.createCharacterAttribute(15, {
            category: 'custom',
            displayName: 'Magic Resistance',
            description: 'Resistance to magical effects',
            constraints: { min: 0, max: 100 }
        })

        return attribute.value === 15 &&
               attribute.category === 'custom' &&
               attribute.displayName === 'Magic Resistance' &&
               attribute.constraints?.min === 0 &&
               attribute.constraints?.max === 100
    })

    // Test 2: Convert core stats to extensible attributes
    test('Can convert core stats to extensible character attributes', () => {
        const coreStats = {
            strength: 16,
            dexterity: 14,
            intelligence: 12,
            wisdom: 13,
            charisma: 10,
            constitution: 15
        }

        const attributes = GameStateManager.convertCoreStatsToAttributes(coreStats)
        
        return Object.keys(attributes).length === 6 &&
               attributes.strength.value === 16 &&
               attributes.strength.category === 'core' &&
               attributes.dexterity.value === 14 &&
               attributes.intelligence.displayName === 'Intelligence'
    })

    // Test 3: Add custom attributes to party member
    test('Can add custom attributes to party members', () => {
        const member = GameStateManager.createPartyMember('Test Hero', 'barbarian')
        if (!member) return false

        const updatedMember = GameStateManager.setCharacterAttribute(member, 'magicResistance', 25, {
            category: 'custom',
            displayName: 'Magic Resistance',
            description: 'Resistance to magical attacks'
        })

        return updatedMember.dynamicAttributes?.magicResistance?.value === 25 &&
               updatedMember.dynamicAttributes?.magicResistance?.category === 'custom' &&
               updatedMember.modelVersion === 1
    })

    // Test 4: Retrieve attributes with fallback to core stats
    test('Can retrieve attributes with fallback to core stats', () => {
        const member = GameStateManager.createPartyMember('Test Hero', 'barbarian')
        if (!member) return false

        // Should get from core stats
        const strengthFromCore = GameStateManager.getCharacterAttribute(member, 'strength')
        
        // Add custom attribute
        const updatedMember = GameStateManager.setCharacterAttribute(member, 'luck', 12)
        const luckFromDynamic = GameStateManager.getCharacterAttribute(updatedMember, 'luck')

        return strengthFromCore === 17 && // Barbarian base strength
               luckFromDynamic === 12
    })

    // Test 5: Add character traits
    test('Can add character traits', () => {
        const member = GameStateManager.createPartyMember('Test Hero', 'barbarian')
        if (!member) return false

        const updatedMember = GameStateManager.setCharacterTrait(member, 'brave', true, 'background')
        
        return updatedMember.traits?.brave?.value === true &&
               updatedMember.traits?.brave?.source === 'background' &&
               typeof updatedMember.traits?.brave?.acquiredAt === 'string'
    })

    // Test 6: Add character relationships
    test('Can add character relationships', () => {
        const member1 = GameStateManager.createPartyMember('Hero', 'barbarian')
        const member2 = GameStateManager.createPartyMember('Wizard', 'mage')
        if (!member1 || !member2) return false

        const updatedMember = GameStateManager.setCharacterRelationship(
            member1, 
            member2.id, 
            'friendship', 
            75,
            { notes: 'Met during tavern brawl' }
        )

        const relationship = updatedMember.relationships?.[member2.id]
        return relationship?.type === 'friendship' &&
               relationship?.strength === 75 &&
               relationship?.data?.notes === 'Met during tavern brawl'
    })

    // Test 7: Character model migration
    test('Can migrate character models to current version', () => {
        // Create an "old" character model (without extensible fields)
        const oldMember: PartyMember = {
            id: 'old-member',
            name: 'Legacy Hero',
            class: GameStateManager.getAvailablePartyClasses()[0],
            level: 1,
            createdAt: new Date().toISOString()
            // Missing modelVersion and extensible fields
        }

        const migratedMember = GameStateManager.migrateCharacterModel(oldMember)

        return migratedMember.modelVersion === 1 &&
               migratedMember.dynamicAttributes !== undefined &&
               migratedMember.traits !== undefined &&
               migratedMember.relationships !== undefined &&
               migratedMember.experienceData !== undefined &&
               Object.keys(migratedMember.dynamicAttributes!).length === 6 // All core stats converted
    })

    // Test 8: Party configuration migration
    test('Can migrate party configurations to current version', () => {
        const member1 = GameStateManager.createPartyMember('Hero1', 'barbarian')
        const member2 = GameStateManager.createPartyMember('Hero2', 'mage')
        if (!member1 || !member2) return false

        // Create "old" party configuration
        const oldParty: PartyConfiguration = {
            members: [member1, member2],
            createdAt: new Date().toISOString(),
            maxSize: 4
            // Missing modelVersion and extensible fields
        }

        const migratedParty = GameStateManager.migratePartyConfiguration(oldParty)

        return migratedParty.modelVersion === 1 &&
               migratedParty.partyTraits !== undefined &&
               migratedParty.dynamics !== undefined &&
               migratedParty.dynamics?.cohesion === 50 &&
               migratedParty.members.every(m => m.modelVersion === 1)
    })

    // Test 9: Backward compatibility with existing party creation
    test('Existing party creation methods still work (backward compatibility)', () => {
        // Test that old-style party creation still works
        const member = GameStateManager.createPartyMember('Compatible Hero', 'barbarian', { customStat: 42 })
        if (!member) return false

        const party = GameStateManager.createPartyConfiguration([member], 'line')
        const validation = GameStateManager.validatePartyConfiguration(party)

        return validation.isValid &&
               member.customAttributes?.customStat === 42 &&
               member.modelVersion === 1 &&
               party.modelVersion === 1
    })

    // Test 10: Create extensible character class
    test('Can create extensible character classes', () => {
        const extendedClass = GameStateManager.createExtensibleCharacterClass(
            'paladin',
            'Paladin',
            'A holy warrior with divine powers',
            ['Divine Smite', 'Lay on Hands', 'Aura of Protection'],
            {
                strength: 15,
                dexterity: 10,
                intelligence: 11,
                wisdom: 14,
                charisma: 16,
                constitution: 13
            },
            {
                divineEnergy: GameStateManager.createCharacterAttribute(10, {
                    category: 'custom',
                    displayName: 'Divine Energy',
                    description: 'Pool of divine power'
                })
            },
            {
                relationshipTypes: ['divine_bond', 'oath_keeper', 'nemesis'],
                traitCategories: ['divine', 'personality', 'oath']
            }
        )

        return extendedClass.id === 'paladin' &&
               extendedClass.modelVersion === 1 &&
               extendedClass.extendedAttributes?.divineEnergy?.value === 10 &&
               extendedClass.relationshipTypes?.includes('divine_bond') &&
               extendedClass.traitCategories?.includes('divine')
    })

    // Test 11: Future extensibility - extension data
    test('Extension data field allows for future features', () => {
        const member = GameStateManager.createPartyMember('Future Hero', 'barbarian')
        if (!member) return false

        // Simulate adding future data without breaking current structure
        member.extensionData = {
            futureFeature: 'some value',
            anotherFeature: { complex: 'data' },
            numericFeature: 123
        }

        // Should still validate and work normally
        const party = GameStateManager.createPartyConfiguration([member])
        const validation = GameStateManager.validatePartyConfiguration(party)

        return validation.isValid &&
               member.extensionData?.futureFeature === 'some value' &&
               member.extensionData?.anotherFeature?.complex === 'data'
    })

    // Test 12: Non-breaking addition of new attributes
    test('Adding new attributes does not break existing functionality', () => {
        // Create member with original functionality
        const member = GameStateManager.createPartyMember('Flexible Hero', 'mage')
        if (!member) return false

        // Add various new attributes in different categories
        let updatedMember = GameStateManager.setCharacterAttribute(member, 'spellPower', 50, { category: 'derived' })
        updatedMember = GameStateManager.setCharacterAttribute(updatedMember, 'reputation', 75, { category: 'relationship' })
        updatedMember = GameStateManager.setCharacterTrait(updatedMember, 'scholarly', true)
        updatedMember = GameStateManager.setCharacterTrait(updatedMember, 'bookworm', { level: 'moderate' })

        // Original functionality should still work
        const originalStr = GameStateManager.getCharacterAttribute(updatedMember, 'strength')
        const newSpellPower = GameStateManager.getCharacterAttribute(updatedMember, 'spellPower')

        const party = GameStateManager.createPartyConfiguration([updatedMember])
        const validation = GameStateManager.validatePartyConfiguration(party)

        return validation.isValid &&
               originalStr === 8 && // Mage base strength
               newSpellPower === 50 &&
               updatedMember.traits?.scholarly?.value === true &&
               typeof updatedMember.traits?.bookworm?.value === 'object'
    })

    // Restore console methods
    console.log = originalConsoleLog
    console.warn = originalConsoleWarn
    console.error = originalConsoleError

    console.log(`\n📊 Character Extensibility Test Results: ${passed} passed, ${failed} failed`)
    
    if (failed === 0) {
        console.log('🎉 All extensibility tests passed! Character model is properly extensible.')
    } else {
        console.log('⚠️  Some extensibility tests failed. Please review the implementation.')
    }

    return failed === 0
}

// Run tests if this file is executed directly
if (require.main === module) {
    runExtensibilityTests()
}

export { runExtensibilityTests }