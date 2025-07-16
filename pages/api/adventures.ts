import { NextApiRequest, NextApiResponse } from 'next'
import { supabase, isSupabaseConfigured, Adventure, GameState, Story } from '@/lib/supabase'
import { GameStateManager } from '@/lib/game-state-manager'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === 'GET') {
		return listAdventures(req, res)
	} else if (req.method === 'POST') {
		return createAdventure(req, res)
	} else if (req.method === 'PUT') {
		return updateAdventure(req, res)
	} else {
		res.setHeader('Allow', ['GET', 'POST', 'PUT'])
		return res.status(405).json({ error: 'Method not allowed' })
	}
}

async function listAdventures(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { userId, sessionPrefix } = req.query

		// If Supabase is not configured, return empty list (fallback mode)
		if (!isSupabaseConfigured || !supabase) {
			return res.status(200).json({ adventures: [], fallback: true })
		}

		if (!userId && !sessionPrefix) {
			return res.status(400).json({ error: 'User ID or session prefix is required' })
		}

		// Get all game states for this user/session
		let gameStatesQuery = supabase
			.from('game_states')
			.select(`
				*,
				stories:story_id(id, title, description)
			`)
			.order('updated_at', { ascending: false })

		if (userId) {
			// For authenticated users, get all their adventures via sessions
			const { data: userSessions } = await supabase
				.from('user_sessions')
				.select('id')
				.eq('user_id', userId)

			if (userSessions && userSessions.length > 0) {
				const sessionIds = userSessions.map(s => s.id)
				gameStatesQuery = gameStatesQuery.in('session_id', sessionIds)
			} else {
				// No sessions found for user
				return res.status(200).json({ adventures: [] })
			}
		} else if (sessionPrefix) {
			// For anonymous users, get adventures with matching session prefix
			gameStatesQuery = gameStatesQuery.like('session_id', `${sessionPrefix}%`)
		}

		const { data: gameStates, error } = await gameStatesQuery

		if (error) {
			console.error('Error fetching adventures:', error)
			return res.status(500).json({ error: 'Failed to fetch adventures' })
		}

		// Convert game states to adventures
		const adventures: Adventure[] = (gameStates || []).map(gameState => {
			const story = gameState.stories as Story
			const progressData = GameStateManager.validateProgressData(gameState.progress_data) 
				? gameState.progress_data 
				: GameStateManager.migrateProgressData(gameState.progress_data)

			// Determine adventure status
			let status: 'active' | 'completed' | 'abandoned' = 'active'
			const daysSinceLastUpdate = Math.floor((new Date().getTime() - new Date(gameState.updated_at || gameState.created_at).getTime()) / (1000 * 60 * 60 * 24))
			
			if (daysSinceLastUpdate > 7) {
				status = 'abandoned'
			}
			// Note: We'll need to check if current_node_id is an ending node to mark as completed
			// For now, keeping it simple

			return {
				id: gameState.id,
				user_id: userId as string || null,
				session_id: gameState.session_id,
				story_id: gameState.story_id,
				title: story ? `${story.title}` : `Adventure ${gameState.id.slice(-8)}`,
				status,
				started_at: gameState.created_at || new Date().toISOString(),
				last_played_at: gameState.updated_at || gameState.created_at || new Date().toISOString(),
				current_node_id: gameState.current_node_id,
				progress_summary: {
					totalChoices: GameStateManager.getTotalChoicesMade(progressData),
					scenesExplored: progressData.visitedScenarios.length,
					playTime: GameStateManager.getGameplayDuration(progressData)
				}
			}
		})

		return res.status(200).json({ adventures })
	} catch (error) {
		console.error('Unexpected error listing adventures:', error)
		return res.status(500).json({ error: 'Internal server error' })
	}
}

async function createAdventure(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { userId, storyId, title, party } = req.body

		if (!storyId) {
			return res.status(400).json({ error: 'Story ID is required' })
		}

		// Generate new session ID for this adventure
		const adventureSessionId = `adventure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
		
		// Create session first
		const sessionResponse = await fetch(`${req.headers.origin}/api/sessions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ 
				sessionId: adventureSessionId, 
				userId 
			})
		})

		if (!sessionResponse.ok) {
			return res.status(500).json({ error: 'Failed to create session for adventure' })
		}

		// Create initial progress data with party configuration
		let initialProgressData = GameStateManager.createInitialProgressData(adventureSessionId)
		
		// If party configuration is provided, validate and add it
		if (party) {
			try {
				const validation = GameStateManager.validatePartyConfiguration(party)
				if (!validation.isValid) {
					return res.status(400).json({ 
						error: 'Invalid party configuration', 
						details: validation.errors 
					})
				}
				
				initialProgressData = GameStateManager.setPartyConfiguration(initialProgressData, party)
			} catch (error) {
				console.error('Error setting party configuration:', error)
				return res.status(400).json({ 
					error: 'Failed to set party configuration' 
				})
			}
		}

		// Create initial game state with party data
		const gameStateResponse = await fetch(`${req.headers.origin}/api/game-state`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sessionId: adventureSessionId,
				storyId,
				currentNodeId: 'start',
				progressData: initialProgressData
			})
		})

		if (!gameStateResponse.ok) {
			return res.status(500).json({ error: 'Failed to create initial game state' })
		}

		const { gameState } = await gameStateResponse.json()

		// Build adventure response
		const adventure: Adventure = {
			id: gameState.id,
			user_id: userId || null,
			session_id: adventureSessionId,
			story_id: storyId,
			title: title || `New Adventure`,
			status: 'active',
			started_at: gameState.created_at,
			last_played_at: gameState.updated_at || gameState.created_at,
			current_node_id: 'start',
			progress_summary: {
				totalChoices: 0,
				scenesExplored: 1,
				playTime: 0
			}
		}

		return res.status(201).json({ adventure })
	} catch (error) {
		console.error('Unexpected error creating adventure:', error)
		return res.status(500).json({ error: 'Internal server error' })
	}
}

async function updateAdventure(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { adventureId } = req.query
		const { status, completedAt } = req.body

		if (!adventureId || typeof adventureId !== 'string') {
			return res.status(400).json({ error: 'Adventure ID is required' })
		}

		// If Supabase is not configured, return success (fallback mode)
		if (!isSupabaseConfigured || !supabase) {
			return res.status(200).json({ 
				adventure: { 
					id: adventureId,
					status: status || 'active',
					completed_at: completedAt
				},
				fallback: true 
			})
		}

		// For now, we'll just update via the game_states table
		// In a full implementation, we might have a separate adventures table
		const updateData: any = {}
		
		if (status === 'completed' && completedAt) {
			// We could add a completed_at field to game_states table
			// For now, we'll track this in progress_data
		}

		return res.status(200).json({ 
			adventure: { id: adventureId, status: status || 'active' } 
		})
	} catch (error) {
		console.error('Unexpected error updating adventure:', error)
		return res.status(500).json({ error: 'Internal server error' })
	}
}