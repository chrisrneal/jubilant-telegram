import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Create client only if configured, otherwise export null
export const supabase = isSupabaseConfigured 
	? createClient(supabaseUrl, supabaseAnonKey)
	: null

// Database types
export interface Story {
	id: string
	title: string
	description?: string
	is_active: boolean
	created_at?: string
	updated_at?: string
}

export interface StoryNode {
	id: string
	story_id: string
	title: string
	text: string
	is_ending?: boolean
	created_at?: string
	updated_at?: string
}

export interface Choice {
	id: string
	story_node_id: string
	text: string
	next_node_id: string
	order_index: number
	created_at?: string
}

export interface UserSession {
	id: string
	user_id?: string | null
	created_at?: string
	last_accessed?: string
	expires_at?: string
}

export interface Adventure {
	id: string
	user_id?: string | null
	session_id: string
	story_id: string
	title: string
	status: 'active' | 'completed' | 'abandoned'
	started_at: string
	completed_at?: string
	last_played_at: string
	current_node_id: string
	progress_summary?: {
		totalChoices: number
		scenesExplored: number
		playTime: number
		completion_percentage?: number
	}
}

// Enhanced progress data structure for comprehensive game state tracking
export interface PlayerInventory {
	[itemId: string]: {
		name: string
		quantity: number
		acquiredAt: string
		description?: string
	}
}

export interface ChoiceRecord {
	nodeId: string
	choiceId: string
	choiceText: string
	nextNodeId: string
	timestamp: string
}

export interface PlayerStats {
	[statName: string]: {
		value: number | string | boolean
		lastUpdated: string
	}
}

// Extensible character attribute system
export interface CharacterAttribute {
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

export interface CharacterAttributes {
	[attributeId: string]: CharacterAttribute
}

// Core stats that are backward compatible
export interface CoreStats {
	strength: number
	dexterity: number
	intelligence: number
	wisdom: number
	charisma: number
	constitution: number
}

// Party system types
export interface PartyMemberClass {
	id: string
	name: string
	description: string
	abilities: string[]
	baseStats: CoreStats
	// Extensible attributes system
	modelVersion?: number
	extendedAttributes?: CharacterAttributes
	attributeSchema?: {
		[attributeId: string]: {
			type: 'number' | 'string' | 'boolean' | 'object'
			required?: boolean
			defaultValue?: any
			category?: string
		}
	}
	// Future extension points
	relationshipTypes?: string[]
	traitCategories?: string[]
	extensionData?: { [key: string]: any }
}

export interface PartyMember {
	id: string
	name: string
	class: PartyMemberClass
	level: number
	customAttributes?: {
		[key: string]: string | number
	}
	createdAt: string
	// Extensible character system
	modelVersion?: number
	dynamicAttributes?: CharacterAttributes
	relationships?: {
		[targetId: string]: {
			type: string
			strength: number
			data?: any
		}
	}
	traits?: {
		[traitId: string]: {
			value: any
			source?: string
			acquiredAt?: string
		}
	}
	experienceData?: {
		totalXP?: number
		skillXP?: { [skillId: string]: number }
		milestones?: string[]
	}
	// Future extension point
	extensionData?: { [key: string]: any }
}

export interface PartyConfiguration {
	members: PartyMember[]
	formation?: string // Optional formation preference
	createdAt: string
	maxSize: number
	// Extensible party system
	modelVersion?: number
	partyTraits?: {
		[traitId: string]: {
			value: any
			source?: string
			effects?: any
		}
	}
	dynamics?: {
		cohesion?: number
		leadership?: string // member ID
		specializations?: { [role: string]: string } // role -> member ID
	}
	// Future extension point
	extensionData?: { [key: string]: any }
}

export interface ProgressData {
	visitedScenarios: string[]
	choiceHistory: ChoiceRecord[]
	inventory: PlayerInventory
	playerStats: PlayerStats
	party?: PartyConfiguration // Optional party configuration
	gameplayStats: {
		startTime: string
		totalChoicesMade: number
		currentPlaySession: string
	}
	version: number // For schema versioning
}

export interface GameState {
	id: string
	session_id: string
	story_id: string
	current_node_id: string
	progress_data: ProgressData
	created_at?: string
	updated_at?: string
}

export interface UserAccount {
	id: string
	email?: string
	username?: string
	display_name?: string
	created_at?: string
	updated_at?: string
}

export interface StoryNodeWithChoices extends StoryNode {
	choices: Choice[]
}

// Auth-related types
export interface AuthUser {
	id: string
	email?: string
	user_metadata?: {
		display_name?: string
		avatar_url?: string
	}
}

export interface AuthSession {
	access_token: string
	refresh_token: string
	expires_in: number
	user: AuthUser
}