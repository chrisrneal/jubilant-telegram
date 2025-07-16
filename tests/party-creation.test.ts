/**
 * Comprehensive tests for the party creation feature
 * These tests verify all the requirements specified in the issue
 */

import { GameStateManager } from '../lib/game-state-manager'
import { PartyConfiguration, PartyMember } from '../lib/supabase'

// Mock console methods for cleaner test output
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn
const originalConsoleError = console.error
console.log = () => {}
console.warn = () => {}
console.error = () => {}

function runPartyCreationTests() {
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

    console.log('🧪 Running Party Creation Feature Tests...\n')

    // Test 1: Available classes match requirements
    test('Available classes match requirements (Barbarian, Mage, Priest, Rogue, Bard)', () => {
        const classes = GameStateManager.getAvailablePartyClasses()
        const expectedClassIds = ['barbarian', 'mage', 'priest', 'rogue', 'bard']
        const actualClassIds = classes.map(c => c.id).sort()
        
        return JSON.stringify(actualClassIds) === JSON.stringify(expectedClassIds.sort()) &&
               classes.length === 5
    })

    // Test 2: Create party member with each required class
    test('Can create party members with all required classes', () => {
        const classes = GameStateManager.getAvailablePartyClasses()
        let allMembersCreated = true
        
        for (const cls of classes) {
            const member = GameStateManager.createPartyMember(`Test ${cls.name}`, cls.id)
            if (!member || member.class.id !== cls.id) {
                allMembersCreated = false
                break
            }
        }
        
        return allMembersCreated
    })

    // Test 3: Party configuration validation - all slots must have classes
    test('Party validation requires all members to have valid classes', () => {
        const validMembers = [
            GameStateManager.createPartyMember('Fighter', 'barbarian'),
            GameStateManager.createPartyMember('Wizard', 'mage')
        ].filter(Boolean) as PartyMember[]
        
        const validParty = GameStateManager.createPartyConfiguration(validMembers)
        const validation = GameStateManager.validatePartyConfiguration(validParty)
        
        return validation.isValid && validation.errors.length === 0
    })

    // Test 4: Party validation fails for invalid class
    test('Party validation fails for members with invalid classes', () => {
        // Create a party member manually with invalid class
        const invalidMember: PartyMember = {
            id: 'test-id',
            name: 'Invalid',
            class: {
                id: 'invalid-class',
                name: 'Invalid Class',
                description: 'This should not exist',
                abilities: [],
                baseStats: {
                    strength: 10,
                    dexterity: 10,
                    intelligence: 10,
                    wisdom: 10,
                    charisma: 10,
                    constitution: 10
                }
            },
            level: 1,
            createdAt: new Date().toISOString()
        }
        
        const invalidParty = GameStateManager.createPartyConfiguration([invalidMember])
        const validation = GameStateManager.validatePartyConfiguration(invalidParty)
        
        return !validation.isValid && 
               validation.errors.some(error => error.includes('valid classes'))
    })

    // Test 5: Party validation requires at least one member
    test('Party validation requires at least one member', () => {
        const emptyParty = GameStateManager.createPartyConfiguration([])
        const validation = GameStateManager.validatePartyConfiguration(emptyParty)
        
        return !validation.isValid && 
               validation.errors.some(error => error.includes('at least'))
    })

    // Test 6: Party validation enforces name requirements
    test('Party validation requires all members to have names', () => {
        const memberWithoutName = GameStateManager.createPartyMember('', 'barbarian')
        if (!memberWithoutName) return false
        
        const party = GameStateManager.createPartyConfiguration([memberWithoutName])
        const validation = GameStateManager.validatePartyConfiguration(party)
        
        return !validation.isValid && 
               validation.errors.some(error => error.includes('names'))
    })

    // Test 7: Party validation enforces unique names
    test('Party validation requires unique member names', () => {
        const member1 = GameStateManager.createPartyMember('Duplicate', 'barbarian')
        const member2 = GameStateManager.createPartyMember('Duplicate', 'mage')
        
        if (!member1 || !member2) return false
        
        const party = GameStateManager.createPartyConfiguration([member1, member2])
        const validation = GameStateManager.validatePartyConfiguration(party)
        
        return !validation.isValid && 
               validation.errors.some(error => error.includes('unique'))
    })

    // Test 8: Party configuration can be stored in progress data
    test('Party configuration can be stored and retrieved from progress data', () => {
        const progressData = GameStateManager.createInitialProgressData('test-session')
        const member = GameStateManager.createPartyMember('Hero', 'barbarian')
        
        if (!member) return false
        
        const party = GameStateManager.createPartyConfiguration([member])
        const updatedProgress = GameStateManager.setPartyConfiguration(progressData, party)
        const retrievedParty = GameStateManager.getPartyConfiguration(updatedProgress)
        
        return retrievedParty !== null && 
               retrievedParty.members.length === 1 &&
               retrievedParty.members[0].name === 'Hero' &&
               retrievedParty.members[0].class.id === 'barbarian'
    })

    // Test 9: Support for flexible party sizes
    test('Supports flexible party sizes (1-4 members by default)', () => {
        const createPartyWithSize = (size: number): boolean => {
            const members: PartyMember[] = []
            const classes = GameStateManager.getAvailablePartyClasses()
            
            for (let i = 0; i < size; i++) {
                const classId = classes[i % classes.length].id
                const member = GameStateManager.createPartyMember(`Member ${i + 1}`, classId)
                if (!member) return false
                members.push(member)
            }
            
            const party = GameStateManager.createPartyConfiguration(members)
            const validation = GameStateManager.validatePartyConfiguration(party)
            return validation.isValid
        }
        
        return createPartyWithSize(1) && // minimum
               createPartyWithSize(2) && // typical
               createPartyWithSize(3) && // larger
               createPartyWithSize(4)    // maximum default
    })

    // Test 10: Party creation performance (should complete quickly)
    test('Party creation completes within reasonable time (< 100ms)', () => {
        const startTime = Date.now()
        
        // Create a full party
        const members: PartyMember[] = []
        const classes = GameStateManager.getAvailablePartyClasses()
        
        for (let i = 0; i < 4; i++) {
            const member = GameStateManager.createPartyMember(`Speed Test ${i + 1}`, classes[i].id)
            if (!member) return false
            members.push(member)
        }
        
        const party = GameStateManager.createPartyConfiguration(members)
        const validation = GameStateManager.validatePartyConfiguration(party)
        
        const endTime = Date.now()
        const duration = endTime - startTime
        
        return validation.isValid && duration < 100 // Should be much faster than 2 seconds
    })

    // Test 11: Duplicate classes are allowed
    test('Duplicate classes are allowed in party configuration', () => {
        const member1 = GameStateManager.createPartyMember('Warrior1', 'barbarian')
        const member2 = GameStateManager.createPartyMember('Warrior2', 'barbarian')
        
        if (!member1 || !member2) return false
        
        const party = GameStateManager.createPartyConfiguration([member1, member2])
        const validation = GameStateManager.validatePartyConfiguration(party)
        
        return validation.isValid
    })

    // Test 12: Each class has proper abilities and stats
    test('Each class has proper abilities and base stats', () => {
        const classes = GameStateManager.getAvailablePartyClasses()
        
        for (const cls of classes) {
            if (!cls.abilities || cls.abilities.length === 0) return false
            if (!cls.baseStats) return false
            
            // Check that all base stats are present and positive
            const stats = cls.baseStats
            if (stats.strength <= 0 || stats.dexterity <= 0 || stats.intelligence <= 0 ||
                stats.wisdom <= 0 || stats.charisma <= 0 || stats.constitution <= 0) {
                return false
            }
        }
        
        return true
    })

    // Restore console methods
    console.log = originalConsoleLog
    console.warn = originalConsoleWarn
    console.error = originalConsoleError

    console.log(`\n📊 Party Creation Test Results: ${passed} passed, ${failed} failed`)
    
    if (failed === 0) {
        console.log('🎉 All party creation tests passed! Feature is working correctly.')
    } else {
        console.log('⚠️  Some party creation tests failed. Please review the implementation.')
    }

    return failed === 0
}

// Run tests if this file is executed directly
if (require.main === module) {
    runPartyCreationTests()
}

export { runPartyCreationTests }