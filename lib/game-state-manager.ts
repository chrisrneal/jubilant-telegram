/**
 * Enhanced Game State Manager
 * Handles robust game state management with comprehensive tracking,
 * serialization/deserialization, and validation
 */

import { GameState, ProgressData, ChoiceRecord, PlayerInventory, PlayerStats, PartyConfiguration, PartyMember, PartyMemberClass, CharacterAttribute, CharacterAttributes, CoreStats } from './supabase'

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
	private static readonly CURRENT_CHARACTER_MODEL_VERSION = 1
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
			const initialData = this.createInitialProgressData('legacy-migration')
			
			// Convert legacy data to proper PlayerStats format
			const playerStats: PlayerStats = {}
			if (data && typeof data === 'object') {
				Object.entries(data).forEach(([key, value]) => {
					playerStats[key] = {
						value: value as string | number | boolean,
						lastUpdated: new Date().toISOString()
					}
				})
			}
			
			return {
				...initialData,
				playerStats
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
	 * Create a character attribute with proper defaults
	 */
	static createCharacterAttribute(
		value: number,
		options?: {
			category?: 'core' | 'derived' | 'custom' | 'relationship'
			displayName?: string
			description?: string
			constraints?: {
				min?: number
				max?: number
				readonly?: boolean
			}
		}
	): CharacterAttribute {
		return {
			value,
			category: options?.category || 'custom',
			displayName: options?.displayName,
			description: options?.description,
			constraints: options?.constraints
		}
	}

	/**
	 * Convert core stats to extensible character attributes
	 */
	static convertCoreStatsToAttributes(coreStats: CoreStats): CharacterAttributes {
		const attributes: CharacterAttributes = {}
		
		Object.entries(coreStats).forEach(([statName, value]) => {
			attributes[statName] = this.createCharacterAttribute(value, {
				category: 'core',
				displayName: statName.charAt(0).toUpperCase() + statName.slice(1),
				description: `Core ${statName} attribute`,
				constraints: { min: 1, max: 20 }
			})
		})
		
		return attributes
	}

	/**
	 * Add or update a character attribute
	 */
	static setCharacterAttribute(
		member: PartyMember,
		attributeId: string,
		value: number,
		options?: {
			category?: 'core' | 'derived' | 'custom' | 'relationship'
			displayName?: string
			description?: string
			constraints?: any
		}
	): PartyMember {
		const updatedMember = { ...member }
		
		if (!updatedMember.dynamicAttributes) {
			updatedMember.dynamicAttributes = {}
		}
		
		updatedMember.dynamicAttributes[attributeId] = this.createCharacterAttribute(value, options)
		updatedMember.modelVersion = this.CURRENT_CHARACTER_MODEL_VERSION
		
		return updatedMember
	}

	/**
	 * Get character attribute value with fallback to core stats
	 */
	static getCharacterAttribute(member: PartyMember, attributeId: string): number | undefined {
		// Check dynamic attributes first
		if (member.dynamicAttributes?.[attributeId]) {
			return member.dynamicAttributes[attributeId].value
		}
		
		// Fallback to core stats for backward compatibility
		if ((member.class.baseStats as any)[attributeId] !== undefined) {
			return (member.class.baseStats as any)[attributeId]
		}
		
		return undefined
	}

	/**
	 * Add a character trait
	 */
	static setCharacterTrait(
		member: PartyMember,
		traitId: string,
		value: any,
		source?: string
	): PartyMember {
		const updatedMember = { ...member }
		
		if (!updatedMember.traits) {
			updatedMember.traits = {}
		}
		
		updatedMember.traits[traitId] = {
			value,
			source,
			acquiredAt: new Date().toISOString()
		}
		updatedMember.modelVersion = this.CURRENT_CHARACTER_MODEL_VERSION
		
		return updatedMember
	}

	/**
	 * Add a relationship between characters
	 */
	static setCharacterRelationship(
		member: PartyMember,
		targetId: string,
		relationshipType: string,
		strength: number,
		data?: any
	): PartyMember {
		const updatedMember = { ...member }
		
		if (!updatedMember.relationships) {
			updatedMember.relationships = {}
		}
		
		updatedMember.relationships[targetId] = {
			type: relationshipType,
			strength,
			data
		}
		updatedMember.modelVersion = this.CURRENT_CHARACTER_MODEL_VERSION
		
		return updatedMember
	}

	/**
	 * Migrate character model to current version
	 */
	static migrateCharacterModel(member: PartyMember): PartyMember {
		const currentVersion = member.modelVersion || 0
		
		if (currentVersion >= this.CURRENT_CHARACTER_MODEL_VERSION) {
			return member // Already up to date
		}
		
		let migratedMember = { ...member }
		
		// Migration from version 0 to 1: Add extensible attributes
		if (currentVersion < 1) {
			// Convert core stats to dynamic attributes if not already done
			if (!migratedMember.dynamicAttributes) {
				migratedMember.dynamicAttributes = this.convertCoreStatsToAttributes(member.class.baseStats)
			}
			
			// Initialize other extensible fields if they don't exist
			if (!migratedMember.traits) {
				migratedMember.traits = {}
			}
			
			if (!migratedMember.relationships) {
				migratedMember.relationships = {}
			}
			
			if (!migratedMember.experienceData) {
				migratedMember.experienceData = {
					totalXP: 0,
					skillXP: {},
					milestones: []
				}
			}
		}
		
		// Future migrations would go here
		// if (currentVersion < 2) { ... }
		
		migratedMember.modelVersion = this.CURRENT_CHARACTER_MODEL_VERSION
		return migratedMember
	}

	/**
	 * Migrate party configuration to current version
	 */
	static migratePartyConfiguration(party: PartyConfiguration): PartyConfiguration {
		let migratedParty = { ...party }
		
		// Migrate each member
		migratedParty.members = party.members.map(member => this.migrateCharacterModel(member))
		
		// Add party-level extensible fields if they don't exist
		if (!migratedParty.partyTraits) {
			migratedParty.partyTraits = {}
		}
		
		if (!migratedParty.dynamics) {
			migratedParty.dynamics = {
				cohesion: 50, // Default neutral cohesion
				specializations: {}
			}
		}
		
		migratedParty.modelVersion = this.CURRENT_CHARACTER_MODEL_VERSION
		return migratedParty
	}

	/**
	 * Create an extensible character class
	 */
	static createExtensibleCharacterClass(
		id: string,
		name: string,
		description: string,
		abilities: string[],
		baseStats: CoreStats,
		extendedAttributes?: CharacterAttributes,
		options?: {
			relationshipTypes?: string[]
			traitCategories?: string[]
			attributeSchema?: any
		}
	): PartyMemberClass {
		return {
			id,
			name,
			description,
			abilities,
			baseStats,
			modelVersion: this.CURRENT_CHARACTER_MODEL_VERSION,
			extendedAttributes,
			attributeSchema: options?.attributeSchema,
			relationshipTypes: options?.relationshipTypes || ['friendship', 'rivalry', 'mentorship'],
			traitCategories: options?.traitCategories || ['personality', 'background', 'quirks'],
			extensionData: {}
		}
	}

	/**
	 * Create a party member with extensibility support
	 */
	static createPartyMember(
		name: string,
		classId: string,
		customAttributes?: { [key: string]: string | number },
		extendedOptions?: {
			dynamicAttributes?: CharacterAttributes
			traits?: any
			relationships?: any
		}
	): PartyMember | null {
		const memberClass = DEFAULT_PARTY_CLASSES.find(c => c.id === classId)
		if (!memberClass) {
			return null
		}

		const member: PartyMember = {
			id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			name: name.trim(),
			class: memberClass,
			level: 1,
			customAttributes,
			createdAt: new Date().toISOString(),
			// Initialize extensible fields
			modelVersion: this.CURRENT_CHARACTER_MODEL_VERSION,
			dynamicAttributes: extendedOptions?.dynamicAttributes || this.convertCoreStatsToAttributes(memberClass.baseStats),
			relationships: extendedOptions?.relationships || {},
			traits: extendedOptions?.traits || {},
			experienceData: {
				totalXP: 0,
				skillXP: {},
				milestones: []
			},
			extensionData: {}
		}

		return member
	}

	/**
	 * Create party configuration with extensibility support
	 */
	static createPartyConfiguration(
		members: PartyMember[], 
		formation?: string,
		extendedOptions?: {
			partyTraits?: any
			dynamics?: any
		}
	): PartyConfiguration {
		const party: PartyConfiguration = {
			members: members.map(member => this.migrateCharacterModel(member)),
			formation,
			createdAt: new Date().toISOString(),
			maxSize: this.DEFAULT_PARTY_SIZE_LIMIT,
			// Initialize extensible fields
			modelVersion: this.CURRENT_CHARACTER_MODEL_VERSION,
			partyTraits: extendedOptions?.partyTraits || {},
			dynamics: extendedOptions?.dynamics || {
				cohesion: 50,
				specializations: {}
			},
			extensionData: {}
		}
		
		return party
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
	 * Set party configuration in progress data with migration support
	 */
	static setPartyConfiguration(
		progressData: ProgressData,
		party: PartyConfiguration
	): ProgressData {
		// Migrate party configuration to current version
		const migratedParty = this.migratePartyConfiguration(party)
		
		const validation = this.validatePartyConfiguration(migratedParty)
		if (!validation.isValid) {
			throw new Error(`Invalid party configuration: ${validation.errors.join(', ')}`)
		}

		return {
			...progressData,
			party: migratedParty
		}
	}

	/**
	 * Get party configuration from progress data with migration support
	 */
	static getPartyConfiguration(progressData: ProgressData): PartyConfiguration | null {
		if (!progressData.party) {
			return null
		}
		
		// Always migrate when retrieving to ensure latest format
		return this.migratePartyConfiguration(progressData.party)
	}

	/**
	 * Check if progress data has a party configured
	 */
	static hasPartyConfiguration(progressData: ProgressData): boolean {
		return !!progressData.party && progressData.party.members.length > 0
	}
}