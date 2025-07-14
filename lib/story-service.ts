import { supabase, isSupabaseConfigured, StoryNode, Choice, StoryNodeWithChoices, Story, UserSession, GameState } from './supabase'
import { fallbackStoryNodes, fallbackStories } from './fallback-story-data'

export class StoryService {
	/**
	 * Get all available stories
	 */
	static async getStories(): Promise<Story[]> {
		// If Supabase is not configured, use fallback data
		if (!isSupabaseConfigured || !supabase) {
			return Object.values(fallbackStories).filter(story => story.isActive).map(story => ({
				id: story.id,
				title: story.title,
				description: story.description,
				is_active: story.isActive
			}))
		}

		try {
			const { data, error } = await supabase
				.from('stories')
				.select('*')
				.eq('is_active', true)
				.order('created_at', { ascending: false })

			if (error) {
				console.error('Error fetching stories:', error)
				return []
			}

			return data || []
		} catch (error) {
			console.error('Unexpected error fetching stories:', error)
			return []
		}
	}

	/**
	 * Get a random story
	 */
	static async getRandomStory(): Promise<Story | null> {
		const stories = await this.getStories()
		if (stories.length === 0) {
			return null
		}
		
		const randomIndex = Math.floor(Math.random() * stories.length)
		return stories[randomIndex]
	}

	/**
	 * Get a story node by ID with its choices, optionally filtering by story
	 */
	static async getStoryNode(nodeId: string, storyId?: string): Promise<StoryNodeWithChoices | null> {
		// If Supabase is not configured, use fallback data
		if (!isSupabaseConfigured || !supabase) {
			const fallbackNode = fallbackStoryNodes[nodeId]
			if (!fallbackNode) {
				return null
			}

			// If storyId is provided, check if it matches
			if (storyId && fallbackNode.storyId !== storyId) {
				return null
			}

			// Convert fallback format to Supabase format
			return {
				id: fallbackNode.id,
				story_id: fallbackNode.storyId,
				title: fallbackNode.title,
				text: fallbackNode.text,
				is_ending: fallbackNode.isEnding || false,
				choices: fallbackNode.choices.map((choice, index) => ({
					id: choice.id,
					story_node_id: fallbackNode.id,
					text: choice.text,
					next_node_id: choice.nextNodeId,
					order_index: index
				}))
			}
		}

		try {
			// Build query for story node
			let query = supabase
				.from('story_nodes')
				.select('*')
				.eq('id', nodeId)

			// Filter by story if provided
			if (storyId) {
				query = query.eq('story_id', storyId)
			}

			const { data: node, error: nodeError } = await query.single()

			if (nodeError) {
				console.error('Error fetching story node:', nodeError)
				return null
			}

			if (!node) {
				return null
			}

			// Then get the choices for this node
			const { data: choices, error: choicesError } = await supabase
				.from('choices')
				.select('*')
				.eq('story_node_id', nodeId)
				.order('order_index', { ascending: true })

			if (choicesError) {
				console.error('Error fetching choices:', choicesError)
				return { ...node, choices: [] }
			}

			return {
				...node,
				choices: choices || []
			}
		} catch (error) {
			console.error('Unexpected error fetching story node:', error)
			return null
		}
	}

	/**
	 * Create a new user session
	 */
	static async createSession(sessionId: string, userId?: string): Promise<UserSession | null> {
		try {
			const response = await fetch('/api/sessions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ sessionId, userId }),
			})

			const result = await response.json()
			
			if (!response.ok) {
				console.error('Error creating session:', result.error)
				return null
			}

			return result.session
		} catch (error) {
			console.error('Unexpected error creating session:', error)
			return null
		}
	}

	/**
	 * Get user session by ID
	 */
	static async getSession(sessionId: string): Promise<UserSession | null> {
		try {
			const response = await fetch(`/api/sessions?sessionId=${encodeURIComponent(sessionId)}`)
			
			if (response.status === 404) {
				return null
			}

			const result = await response.json()
			
			if (!response.ok) {
				console.error('Error fetching session:', result.error)
				return null
			}

			return result.session
		} catch (error) {
			console.error('Unexpected error fetching session:', error)
			return null
		}
	}

	/**
	 * Update session last accessed time
	 */
	static async updateSession(sessionId: string): Promise<UserSession | null> {
		try {
			const response = await fetch(`/api/sessions?sessionId=${encodeURIComponent(sessionId)}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ last_accessed: new Date().toISOString() }),
			})

			const result = await response.json()
			
			if (!response.ok) {
				console.error('Error updating session:', result.error)
				return null
			}

			return result.session
		} catch (error) {
			console.error('Unexpected error updating session:', error)
			return null
		}
	}

	/**
	 * Create or get session for authenticated user
	 */
	static async getOrCreateUserSession(userId: string): Promise<string> {
		// For authenticated users, use their user ID as the session identifier
		const sessionId = `auth_${userId}`
		
		// Try to get existing session
		let session = await this.getSession(sessionId)
		if (!session) {
			// Create new session for authenticated user
			session = await this.createSession(sessionId, userId)
		} else {
			// Update last accessed time
			await this.updateSession(sessionId)
		}
		
		return sessionId
	}

	/**
	 * Create or update game state
	 */
	static async saveGameState(sessionId: string, storyId: string, currentNodeId: string, progressData: Record<string, any> = {}): Promise<GameState | null> {
		try {
			// First try to get existing game state
			const existingState = await this.getGameState(sessionId, storyId)
			
			if (existingState) {
				// Update existing state
				const response = await fetch(`/api/game-state?gameStateId=${encodeURIComponent(existingState.id)}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ currentNodeId, progressData }),
				})

				const result = await response.json()
				
				if (!response.ok) {
					console.error('Error updating game state:', result.error)
					return null
				}

				return result.gameState
			} else {
				// Create new state
				const response = await fetch('/api/game-state', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ sessionId, storyId, currentNodeId, progressData }),
				})

				const result = await response.json()
				
				if (!response.ok) {
					console.error('Error creating game state:', result.error)
					return null
				}

				return result.gameState
			}
		} catch (error) {
			console.error('Unexpected error saving game state:', error)
			return null
		}
	}

	/**
	 * Get game state for a session and story
	 */
	static async getGameState(sessionId: string, storyId?: string): Promise<GameState | null> {
		try {
			let url = `/api/game-state?sessionId=${encodeURIComponent(sessionId)}`
			if (storyId) {
				url += `&storyId=${encodeURIComponent(storyId)}`
			}

			const response = await fetch(url)
			const result = await response.json()
			
			if (!response.ok) {
				console.error('Error fetching game state:', result.error)
				return null
			}

			return result.gameState
		} catch (error) {
			console.error('Unexpected error fetching game state:', error)
			return null
		}
	}

	/**
	 * Generate or retrieve session ID for anonymous users
	 */
	static getOrCreateSessionId(): string {
		const sessionKey = 'story-rider-session-id'
		
		// Check for existing session ID in localStorage
		if (typeof window !== 'undefined') {
			const existingSessionId = localStorage.getItem(sessionKey)
			if (existingSessionId) {
				return existingSessionId
			}
		}
		
		// Generate new session ID
		const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
		
		// Store in localStorage
		if (typeof window !== 'undefined') {
			localStorage.setItem(sessionKey, newSessionId)
		}
		
		return newSessionId
	}

	/**
	 * Get all story nodes (for admin/debugging purposes)
	 */
	static async getAllStoryNodes(): Promise<StoryNode[]> {
		// If Supabase is not configured, use fallback data
		if (!isSupabaseConfigured || !supabase) {
			return Object.values(fallbackStoryNodes).map(node => ({
				id: node.id,
				story_id: node.storyId,
				title: node.title,
				text: node.text,
				is_ending: node.isEnding || false
			}))
		}

		try {
			const { data, error } = await supabase
				.from('story_nodes')
				.select('*')
				.order('created_at', { ascending: true })

			if (error) {
				console.error('Error fetching all story nodes:', error)
				return []
			}

			return data || []
		} catch (error) {
			console.error('Unexpected error fetching all story nodes:', error)
			return []
		}
	}

	/**
	 * Check if Supabase is properly configured and accessible
	 */
	static async healthCheck(): Promise<boolean> {
		// If Supabase is not configured, return true (fallback will work)
		if (!isSupabaseConfigured || !supabase) {
			return true
		}

		try {
			const { data, error } = await supabase
				.from('story_nodes')
				.select('count')
				.limit(1)

			return !error
		} catch (error) {
			console.error('Supabase health check failed:', error)
			return false
		}
	}

	/**
	 * Check if the application is using Supabase or fallback data
	 */
	static isUsingSupabase(): boolean {
		return isSupabaseConfigured
	}
}