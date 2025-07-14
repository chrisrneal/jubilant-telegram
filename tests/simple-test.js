/**
 * Simple test runner for the enhanced game state management system
 */

const { GameStateManager } = require('../lib/game-state-manager')

function runTests() {
    let passed = 0
    let failed = 0

    function test(name, testFn) {
        try {
            if (testFn()) {
                console.log(`✅ ${name}`)
                passed++
            } else {
                console.error(`❌ ${name}`)
                failed++
            }
        } catch (error) {
            console.error(`❌ ${name} - Error: ${error.message}`)
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

    // Test 5: Progress data validation
    test('Validates progress data structure correctly', () => {
        const validData = GameStateManager.createInitialProgressData('test')
        const invalidData = { incomplete: 'data' }

        return GameStateManager.validateProgressData(validData) &&
               !GameStateManager.validateProgressData(invalidData)
    })

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`)
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Enhanced game state management is working correctly.')
    } else {
        console.log('⚠️  Some tests failed. Please review the implementation.')
    }

    return failed === 0
}

runTests()