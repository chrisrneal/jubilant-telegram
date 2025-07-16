/**
 * Enhanced Game State Manager
 * Handles robust game state management with comprehensive tracking,
 * serialization/deserialization, and validation
 */

import { GameState, ProgressData, ChoiceRecord, PlayerInventory, PlayerStats, PartyConfiguration, PartyMember, PartyMemberClass } from './supabase'

// Default party member classes available in the game
export const DEFAULT_PARTY_CLASSES: PartyMemberClass[] = [
	{
		id: 'barbarian',
		name: 'Barbarian',
		description: 'A fierce warrior driven by primal rage and brute strength.',
		abilities: ['Rage', 'Reckless Attack', 'Danger Sense'],
		baseStats: {
			strength: 17,
			dexterity: 13,
			intelligence: 8,
			wisdom: 12,
			charisma: 10,
			constitution: 16
		}
	},
	{
		id: 'mage',
		name: 'Mage',
		description: 'A wielder of arcane magic with powerful spells.',
		abilities: ['Fireball', 'Magic Shield', 'Teleport'],
		baseStats: {
			strength: 8,
			dexterity: 11,
			intelligence: 17,
			wisdom: 14,
			charisma: 12,
			constitution: 10
		}
	},
	{
		id: 'priest',
		name: 'Priest',
		description: 'A divine spellcaster focused on healing and divine magic.',
		abilities: ['Heal', 'Bless', 'Divine Protection'],
		baseStats: {
			strength: 12,
			dexterity: 10,
			intelligence: 13,
			wisdom: 16,
			charisma: 15,
			constitution: 14
		}
	},
	{
		id: 'rogue',
		name: 'Rogue',
		description: 'A stealthy character skilled in stealth and precision.',
		abilities: ['Sneak Attack', 'Lockpicking', 'Poison Strike'],
		baseStats: {
			strength: 12,
			dexterity: 17,
			intelligence: 13,
			wisdom: 12,
			charisma: 14,
			constitution: 11
		}
	},
	{
		id: 'bard',
		name: 'Bard',
		description: 'A charismatic performer who weaves magic through music and words.',
		abilities: ['Inspiration', 'Charm Person', 'Healing Song'],
		baseStats: {
			strength: 10,
			dexterity: 14,
			intelligence: 13,
			wisdom: 12,
			charisma: 17,
			constitution: 12
		}
	}
]

export class GameStateManager {
	private static readonly CURRENT_VERSION = 1
	private static readonly DEFAULT_PARTY_SIZE_LIMIT = 4
	private static readonly MIN_PARTY_SIZE = 1
	
	/**
	 * Create initial progress data for a new game
	 */
	static createInitialProgressData(sessionId: string): ProgressData {
		return {
			visitedScenarios: [],
			choiceHistory: [],
			inventory: {},
			playerStats: {},
			party: undefined, // Party will be set during party creation
			gameplayStats: {
				startTime: new Date().toISOString(),
				totalChoicesMade: 0,
				currentPlaySession: sessionId
			},
			version: this.CURRENT_VERSION
		}
	}

	/**
	 * Record a choice made by the player
	 */
	static recordChoice(
		progressData: ProgressData,
		nodeId: string,
		choiceId: string,
		choiceText: string,
		nextNodeId: string
	): ProgressData {
		const choice: ChoiceRecord = {
			nodeId,
			choiceId,
			choiceText,
			nextNodeId,
			timestamp: new Date().toISOString()
		}

		const updatedData = { ...progressData }
		updatedData.choiceHistory = [...progressData.choiceHistory, choice]
		updatedData.gameplayStats = {
			...progressData.gameplayStats,
			totalChoicesMade: progressData.gameplayStats.totalChoicesMade + 1
		}

		return updatedData
	}

	/**
	 * Record visiting a new scenario
	 */
	static recordVisitedScenario(progressData: ProgressData, nodeId: string): ProgressData {
		if (progressData.visitedScenarios.includes(nodeId)) {
			return progressData // Already visited
		}

		return {
			...progressData,
			visitedScenarios: [...progressData.visitedScenarios, nodeId]
		}
	}

	/**
	 * Add item to player inventory
	 */
	static addInventoryItem(
		progressData: ProgressData,
		itemId: string,
		name: string,
		quantity: number = 1,
		description?: string
	): ProgressData {
		const updatedInventory = { ...progressData.inventory }
		
		if (updatedInventory[itemId]) {
			// Item already exists, increase quantity
			updatedInventory[itemId] = {
				...updatedInventory[itemId],
				quantity: updatedInventory[itemId].quantity + quantity
			}
		} else {
			// New item
			updatedInventory[itemId] = {
				name,
				quantity,
				acquiredAt: new Date().toISOString(),
				description
			}
		}

		return {
			...progressData,
			inventory: updatedInventory
		}
	}

	/**
	 * Remove item from player inventory
	 */
	static removeInventoryItem(
		progressData: ProgressData,
		itemId: string,
		quantity: number = 1
	): ProgressData {
		const updatedInventory = { ...progressData.inventory }
		
		if (!updatedInventory[itemId]) {
			return progressData // Item doesn't exist
		}

		if (updatedInventory[itemId].quantity <= quantity) {
			// Remove item completely
			delete updatedInventory[itemId]
		} else {
			// Reduce quantity
			updatedInventory[itemId] = {
				...updatedInventory[itemId],
				quantity: updatedInventory[itemId].quantity - quantity
			}
		}

		return {
			...progressData,
			inventory: updatedInventory
		}
	}

	/**
	 * Update player stat
	 */
	static updatePlayerStat(
		progressData: ProgressData,
		statName: string,
		value: number | string | boolean
	): ProgressData {
		const updatedStats = { ...progressData.playerStats }
		updatedStats[statName] = {
			value,
			lastUpdated: new Date().toISOString()
		}

		return {
			...progressData,
			playerStats: updatedStats
		}
	}

	/**
	 * Validate progress data structure
	 */
	static validateProgressData(data: any): data is ProgressData {
		if (!data || typeof data !== 'object') {
			return false
		}

		// Check required fields
		const requiredFields = ['visitedScenarios', 'choiceHistory', 'inventory', 'playerStats', 'gameplayStats', 'version']
		for (const field of requiredFields) {
			if (!(field in data)) {
				return false
			}
		}

		// Party is optional - it may be undefined for adventures without party creation

		// Validate array fields
		if (!Array.isArray(data.visitedScenarios) || !Array.isArray(data.choiceHistory)) {
			return false
		}

		// Validate object fields
		if (typeof data.inventory !== 'object' || typeof data.playerStats !== 'object' || typeof data.gameplayStats !== 'object') {
			return false
		}

		// Validate version
		if (typeof data.version !== 'number' || data.version <= 0) {
			return false
		}

		return true
	}

	/**
	 * Migrate progress data to current version
	 */
	static migrateProgressData(data: any): ProgressData {
		// Handle legacy data (simple Record<string, any>)
		if (!data || typeof data !== 'object' || !('version' in data)) {
			console.log('Migrating legacy progress data to current version')
			return {
				...this.createInitialProgressData('legacy-migration'),
				// Preserve any legacy data that might be useful
				playerStats: typeof data === 'object' ? data : {}
			}
		}

		// Handle version upgrades (future use)
		if (data.version < this.CURRENT_VERSION) {
			console.log(`Migrating progress data from version ${data.version} to ${this.CURRENT_VERSION}`)
			// Add migration logic here as needed
		}

		// Ensure all required fields exist
		const migrated = { ...data }
		if (!migrated.visitedScenarios) migrated.visitedScenarios = []
		if (!migrated.choiceHistory) migrated.choiceHistory = []
		if (!migrated.inventory) migrated.inventory = {}
		if (!migrated.playerStats) migrated.playerStats = {}
		if (!migrated.party) migrated.party = undefined // Party is optional
		if (!migrated.gameplayStats) {
			migrated.gameplayStats = {
				startTime: new Date().toISOString(),
				totalChoicesMade: 0,
				currentPlaySession: 'migrated'
			}
		}
		migrated.version = this.CURRENT_VERSION

		return migrated as ProgressData
	}

	/**
	 * Serialize game state for storage
	 */
	static serializeGameState(gameState: GameState): string {
		try {
			// Validate progress data before serialization
			if (!this.validateProgressData(gameState.progress_data)) {
				console.warn('Invalid progress data detected, migrating...')
				gameState.progress_data = this.migrateProgressData(gameState.progress_data)
			}

			return JSON.stringify(gameState)
		} catch (error) {
			console.error('Error serializing game state:', error)
			throw new Error('Failed to serialize game state')
		}
	}

	/**
	 * Deserialize game state from storage
	 */
	static deserializeGameState(serializedState: string): GameState {
		try {
			const gameState = JSON.parse(serializedState) as GameState
			
			// Validate and migrate progress data if needed
			if (!this.validateProgressData(gameState.progress_data)) {
				console.warn('Invalid progress data in deserialized state, migrating...')
				gameState.progress_data = this.migrateProgressData(gameState.progress_data)
			}

			return gameState
		} catch (error) {
			console.error('Error deserializing game state:', error)
			throw new Error('Failed to deserialize game state')
		}
	}

	/**
	 * Check if player has visited a scenario
	 */
	static hasVisitedScenario(progressData: ProgressData, nodeId: string): boolean {
		return progressData.visitedScenarios.includes(nodeId)
	}

	/**
	 * Check if player has inventory item
	 */
	static hasInventoryItem(progressData: ProgressData, itemId: string, minQuantity: number = 1): boolean {
		const item = progressData.inventory[itemId]
		return item && item.quantity >= minQuantity
	}

	/**
	 * Get player stat value
	 */
	static getPlayerStat(progressData: ProgressData, statName: string): number | string | boolean | undefined {
		return progressData.playerStats[statName]?.value
	}

	/**
	 * Get total choices made
	 */
	static getTotalChoicesMade(progressData: ProgressData): number {
		return progressData.gameplayStats.totalChoicesMade
	}

	/**
	 * Get game start time
	 */
	static getGameStartTime(progressData: ProgressData): string {
		return progressData.gameplayStats.startTime
	}

	/**
	 * Calculate gameplay duration in minutes
	 */
	static getGameplayDuration(progressData: ProgressData): number {
		const startTime = new Date(progressData.gameplayStats.startTime)
		const now = new Date()
		return Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60))
	}

	/**
	 * Get available party member classes
	 */
	static getAvailablePartyClasses(): PartyMemberClass[] {
		return DEFAULT_PARTY_CLASSES
	}

	/**
	 * Create a party member
	 */
	static createPartyMember(
		name: string,
		classId: string,
		customAttributes?: { [key: string]: string | number }
	): PartyMember | null {
		const memberClass = DEFAULT_PARTY_CLASSES.find(c => c.id === classId)
		if (!memberClass) {
			return null
		}

		return {
			id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			name: name.trim(),
			class: memberClass,
			level: 1,
			customAttributes,
			createdAt: new Date().toISOString()
		}
	}

	/**
	 * Create party configuration
	 */
	static createPartyConfiguration(
		members: PartyMember[], 
		formation?: string
	): PartyConfiguration {
		return {
			members,
			formation,
			createdAt: new Date().toISOString(),
			maxSize: this.DEFAULT_PARTY_SIZE_LIMIT
		}
	}

	/**
	 * Validate party configuration
	 */
	static validatePartyConfiguration(party: PartyConfiguration): {
		isValid: boolean
		errors: string[]
	} {
		const errors: string[] = []

		// Check party size limits
		if (party.members.length < this.MIN_PARTY_SIZE) {
			errors.push(`Party must have at least ${this.MIN_PARTY_SIZE} member(s)`)
		}

		if (party.members.length > party.maxSize) {
			errors.push(`Party cannot exceed ${party.maxSize} members`)
		}

		// Check for duplicate member names
		const names = party.members.map(m => m.name.toLowerCase())
		const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index)
		if (duplicateNames.length > 0) {
			errors.push('Party members must have unique names')
		}

		// Check for empty names
		const emptyNames = party.members.filter(m => !m.name.trim())
		if (emptyNames.length > 0) {
			errors.push('All party members must have names')
		}

		// Check for valid classes
		const invalidClasses = party.members.filter(m => 
			!DEFAULT_PARTY_CLASSES.find(c => c.id === m.class.id)
		)
		if (invalidClasses.length > 0) {
			errors.push('All party members must have valid classes')
		}

		return {
			isValid: errors.length === 0,
			errors
		}
	}

	/**
	 * Set party configuration in progress data
	 */
	static setPartyConfiguration(
		progressData: ProgressData,
		party: PartyConfiguration
	): ProgressData {
		const validation = this.validatePartyConfiguration(party)
		if (!validation.isValid) {
			throw new Error(`Invalid party configuration: ${validation.errors.join(', ')}`)
		}

		return {
			...progressData,
			party
		}
	}

	/**
	 * Get party configuration from progress data
	 */
	static getPartyConfiguration(progressData: ProgressData): PartyConfiguration | null {
		return progressData.party || null
	}

	/**
	 * Check if progress data has a party configured
	 */
	static hasPartyConfiguration(progressData: ProgressData): boolean {
		return !!progressData.party && progressData.party.members.length > 0
	}
}