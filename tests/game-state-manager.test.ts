/**
 * Basic tests for the enhanced game state management system
 * These tests verify the key functionality without requiring external dependencies
 */

import { GameStateManager } from '../lib/game-state-manager'
import { ProgressData } from '../lib/supabase'

// Mock console methods for cleaner test output
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn
console.log = () => {}
console.warn = () => {}

function runTests() {
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

    console.log('🧪 Running Enhanced Game State Management Tests...\n')

    // Test 1: Initial progress data creation
    test('Creates initial progress data correctly', () => {
        const sessionId = 'test-session-123'
        const progressData = GameStateManager.createInitialProgressData(sessionId)
        
        return progressData.visitedScenarios.length === 0 &&
               progressData.choiceHistory.length === 0 &&
               Object.keys(progressData.inventory).length === 0 &&
               progressData.gameplayStats.currentPlaySession === sessionId &&
               progressData.version === 1
    })

    // Test 2: Choice recording
    test('Records player choices correctly', () => {
        const initialData = GameStateManager.createInitialProgressData('test')
        const updatedData = GameStateManager.recordChoice(
            initialData,
            'start',
            'choice1',
            'Push open the door',
            'door_opened'
        )

        return updatedData.choiceHistory.length === 1 &&
               updatedData.choiceHistory[0].nodeId === 'start' &&
               updatedData.choiceHistory[0].choiceId === 'choice1' &&
               updatedData.choiceHistory[0].nextNodeId === 'door_opened' &&
               updatedData.gameplayStats.totalChoicesMade === 1
    })

    // Test 3: Visited scenario tracking
    test('Tracks visited scenarios correctly', () => {
        const initialData = GameStateManager.createInitialProgressData('test')
        let updatedData = GameStateManager.recordVisitedScenario(initialData, 'start')
        updatedData = GameStateManager.recordVisitedScenario(updatedData, 'door_opened')
        
        // Test avoiding duplicates
        updatedData = GameStateManager.recordVisitedScenario(updatedData, 'start')

        return updatedData.visitedScenarios.length === 2 &&
               updatedData.visitedScenarios.includes('start') &&
               updatedData.visitedScenarios.includes('door_opened')
    })

    // Test 4: Inventory management
    test('Manages inventory correctly', () => {
        const initialData = GameStateManager.createInitialProgressData('test')
        let updatedData = GameStateManager.addInventoryItem(
            initialData,
            'magic_key',
            'Ancient Key',
            1,
            'A mystical key that glows faintly'
        )

        // Add same item again to test quantity increase
        updatedData = GameStateManager.addInventoryItem(updatedData, 'magic_key', 'Ancient Key', 2)

        return updatedData.inventory['magic_key'].quantity === 3 &&
               updatedData.inventory['magic_key'].name === 'Ancient Key'
    })

    // Test 5: Inventory removal
    test('Removes inventory items correctly', () => {
        const initialData = GameStateManager.createInitialProgressData('test')
        let updatedData = GameStateManager.addInventoryItem(initialData, 'potion', 'Health Potion', 5)
        
        // Remove some quantity
        updatedData = GameStateManager.removeInventoryItem(updatedData, 'potion', 2)
        const partialRemoval = updatedData.inventory['potion'].quantity === 3

        // Remove all remaining
        updatedData = GameStateManager.removeInventoryItem(updatedData, 'potion', 5)
        const completeRemoval = !updatedData.inventory['potion']

        return partialRemoval && completeRemoval
    })

    // Test 6: Player stats
    test('Manages player stats correctly', () => {
        const initialData = GameStateManager.createInitialProgressData('test')
        let updatedData = GameStateManager.updatePlayerStat(initialData, 'health', 100)
        updatedData = GameStateManager.updatePlayerStat(updatedData, 'mana', 50)
        updatedData = GameStateManager.updatePlayerStat(updatedData, 'hasKey', true)

        return GameStateManager.getPlayerStat(updatedData, 'health') === 100 &&
               GameStateManager.getPlayerStat(updatedData, 'mana') === 50 &&
               GameStateManager.getPlayerStat(updatedData, 'hasKey') === true
    })

    // Test 7: Progress data validation
    test('Validates progress data structure correctly', () => {
        const validData = GameStateManager.createInitialProgressData('test')
        const invalidData = { incomplete: 'data' }

        return GameStateManager.validateProgressData(validData) &&
               !GameStateManager.validateProgressData(invalidData)
    })

    // Test 8: Legacy data migration
    test('Migrates legacy data correctly', () => {
        const legacyData = { someOldField: 'value', anotherField: 123 }
        const migratedData = GameStateManager.migrateProgressData(legacyData)

        return GameStateManager.validateProgressData(migratedData) &&
               migratedData.version === 1 &&
               migratedData.playerStats.someOldField?.value === 'value' &&
               migratedData.playerStats.anotherField?.value === 123
    })

    // Test 9: Serialization and deserialization
    test('Serializes and deserializes game state correctly', () => {
        const gameState = {
            id: 'test-state',
            session_id: 'test-session',
            story_id: 'test-story',
            current_node_id: 'start',
            progress_data: GameStateManager.createInitialProgressData('test'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        const serialized = GameStateManager.serializeGameState(gameState)
        const deserialized = GameStateManager.deserializeGameState(serialized)

        return deserialized.id === gameState.id &&
               deserialized.session_id === gameState.session_id &&
               GameStateManager.validateProgressData(deserialized.progress_data)
    })

    // Test 10: Utility functions
    test('Utility functions work correctly', () => {
        const progressData = GameStateManager.createInitialProgressData('test')
        let updatedData = GameStateManager.recordVisitedScenario(progressData, 'start')
        updatedData = GameStateManager.addInventoryItem(updatedData, 'sword', 'Magic Sword', 1)
        updatedData = GameStateManager.recordChoice(updatedData, 'start', 'choice1', 'Go north', 'forest')

        const hasVisited = GameStateManager.hasVisitedScenario(updatedData, 'start')
        const hasItem = GameStateManager.hasInventoryItem(updatedData, 'sword')
        const choiceCount = GameStateManager.getTotalChoicesMade(updatedData)
        const duration = GameStateManager.getGameplayDuration(updatedData)

        return hasVisited && hasItem && choiceCount === 1 && duration >= 0
    })

    // Restore console methods
    console.log = originalConsoleLog
    console.warn = originalConsoleWarn

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`)
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Enhanced game state management is working correctly.')
    } else {
        console.log('⚠️  Some tests failed. Please review the implementation.')
    }

    return failed === 0
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests()
}

export { runTests }