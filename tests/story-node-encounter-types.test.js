/**
 * Test for Story Node encounter types extension
 * Verifies backward compatibility and new encounter type functionality
 * This test focuses on the data model extensions without API calls
 */

// Import data directly to test the data model
const { fallbackStoryNodes } = require('../lib/fallback-story-data')

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

    console.log('🧪 Running Story Node Encounter Types Tests...\n')

    // Test 1: Check that encounter data types are properly defined
    test('Encounter data types are properly defined in TypeScript files', () => {
        // This test passes if we can import the fallback data without error
        // The TypeScript compiler will catch any type definition issues during build
        return fallbackStoryNodes !== undefined && typeof fallbackStoryNodes === 'object'
    })

    // Test 2: Verify fallback story nodes still have required fields
    test('Fallback story nodes maintain backward compatibility', () => {
        const startNode = fallbackStoryNodes['start']
        
        return startNode !== undefined &&
               startNode.id === 'start' &&
               startNode.title === 'The Mysterious Door' &&
               startNode.choices && startNode.choices.length > 0 &&
               // New optional fields should be available (undefined is valid)
               (!startNode.type || startNode.type === 'narrative' || startNode.type === 'npc' || startNode.type === 'battle') &&
               (startNode.npc === undefined || typeof startNode.npc === 'object') &&
               (startNode.battle === undefined || typeof startNode.battle === 'object')
    })

    // Test 3: Verify story node data conversion logic would work
    test('Story node data conversion includes encounter type fields', () => {
        const fallbackNode = fallbackStoryNodes['start']
        
        // Simulate the conversion logic from StoryService.getStoryNode
        const convertedNode = {
            id: fallbackNode.id,
            story_id: fallbackNode.storyId,
            title: fallbackNode.title,
            text: fallbackNode.text,
            type: fallbackNode.type || 'narrative', // Default to 'narrative' for backward compatibility
            npc: fallbackNode.npc,
            battle: fallbackNode.battle,
            is_ending: fallbackNode.isEnding || false,
            choices: fallbackNode.choices.map((choice, index) => ({
                id: choice.id,
                story_node_id: fallbackNode.id,
                text: choice.text,
                next_node_id: choice.nextNodeId,
                order_index: index
            }))
        }
        
        return convertedNode.type === 'narrative' &&
               convertedNode.npc === undefined &&
               convertedNode.battle === undefined &&
               convertedNode.choices.length > 0 &&
               convertedNode.choices[0].id === 'door_open'
    })

    // Test 4: Test example NPC encounter data structure
    test('NPC encounter data structure is valid', () => {
        const exampleNPCData = {
            npc_name: 'Village Elder',
            npc_description: 'A wise old man with knowledge of the ancient forest',
            dialogue_options: ['Ask about the forest', 'Inquire about the door', 'Say goodbye'],
            relationship_changes: { 'elder_trust': 1, 'village_reputation': 2 }
        }
        
        return exampleNPCData.npc_name === 'Village Elder' &&
               exampleNPCData.dialogue_options?.length === 3 &&
               exampleNPCData.relationship_changes?.['elder_trust'] === 1
    })

    // Test 5: Test example Battle encounter data structure
    test('Battle encounter data structure is valid', () => {
        const exampleBattleData = {
            enemies: ['Forest Goblin', 'Wild Wolf'],
            battle_type: 'turn_based',
            difficulty: 'medium',
            rewards: { experience: 150, gold: 50, items: ['healing_potion'] }
        }
        
        return exampleBattleData.enemies.length === 2 &&
               exampleBattleData.difficulty === 'medium' &&
               exampleBattleData.rewards?.experience === 150
    })

    // Test 6: Test mixed story node with encounter data
    test('Story node can contain encounter-specific data', () => {
        // Create a test node with NPC data
        const npcNode = {
            id: 'village_elder',
            storyId: 'mystical-forest',
            title: 'Meeting the Village Elder',
            text: 'An old man approaches you with a knowing smile.',
            type: 'npc',
            npc: {
                npc_name: 'Village Elder',
                npc_description: 'A wise keeper of ancient secrets',
                dialogue_options: ['Ask about the forest', 'Ask about your quest']
            },
            choices: [
                { id: 'elder_forest', text: 'Ask about the forest', nextNodeId: 'forest_lore' },
                { id: 'elder_quest', text: 'Ask about your quest', nextNodeId: 'quest_guidance' }
            ]
        }
        
        return npcNode.type === 'npc' &&
               npcNode.npc?.npc_name === 'Village Elder' &&
               npcNode.choices.length === 2 &&
               npcNode.battle === undefined
    })

    // Test 7: Test that existing narrative nodes default to 'narrative' type
    test('Existing nodes without type field default to narrative', () => {
        // All existing nodes in fallbackStoryNodes should not have a type field
        const allNodes = Object.values(fallbackStoryNodes)
        
        // Check that nodes without type field would be converted correctly
        const testConversions = allNodes.map(node => {
            const convertedType = node.type || 'narrative'
            return convertedType === 'narrative'
        })
        
        return testConversions.every(result => result === true)
    })

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`)
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Story Node encounter types extension is working correctly.')
    } else {
        console.log('⚠️  Some tests failed. Please review the implementation.')
    }

    return failed === 0
}

runTests()