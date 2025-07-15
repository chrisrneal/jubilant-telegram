import { NextApiRequest, NextApiResponse } from 'next'
import { supabase, isSupabaseConfigured, GameState, ProgressData } from '@/lib/supabase'
import { GameStateManager } from '@/lib/game-state-manager'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === 'POST') {
		return createGameState(req, res)
	} else if (req.method === 'GET') {
		return getGameState(req, res)
	} else if (req.method === 'PUT') {
		return updateGameState(req, res)
	} else {
		res.setHeader('Allow', ['POST', 'GET', 'PUT'])
		return res.status(405).json({ error: 'Method not allowed' })
	}
}

async function createGameState(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { sessionId, storyId, currentNodeId, progressData } = req.body

		if (!sessionId || !storyId || !currentNodeId) {
			return res.status(400).json({ 
				error: 'Session ID, story ID, and current node ID are required' 
			})
		}

		// Validate and create proper progress data
		let validProgressData: ProgressData
		if (progressData) {
			if (GameStateManager.validateProgressData(progressData)) {
				validProgressData = progressData
			} else {
				console.warn('Invalid progress data provided, migrating...')
				validProgressData = GameStateManager.migrateProgressData(progressData)
			}
		} else {
			validProgressData = GameStateManager.createInitialProgressData(sessionId)
		}

		// If Supabase is not configured, return success (fallback mode)
		if (!isSupabaseConfigured || !supabase) {
			console.log('Using fallback mode - Supabase not configured')
			return res.status(200).json({ 
				gameState: { 
					id: `fallback-${sessionId}-${storyId}`,
					session_id: sessionId,
					story_id: storyId,
					current_node_id: currentNodeId,
					progress_data: validProgressData,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				},
				fallback: true 
			})
		}

		// Try to use Supabase database, but fall back on any error
		try {
			const { data, error } = await supabase
				.from('game_states')
				.insert([
					{
						session_id: sessionId,
						story_id: storyId,
						current_node_id: currentNodeId,
						progress_data: validProgressData
					}
				])
				.select()
				.single()

			if (error) {
				console.warn('Supabase error, falling back to local mode:', error)
				// Fall back to local mode
				return res.status(200).json({ 
					gameState: { 
						id: `fallback-${sessionId}-${storyId}`,
						session_id: sessionId,
						story_id: storyId,
						current_node_id: currentNodeId,
						progress_data: validProgressData,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString()
					},
					fallback: true 
				})
			}

			return res.status(201).json({ gameState: data })
		} catch (networkError) {
			console.warn('Network error connecting to Supabase, falling back to local mode:', networkError)
			// Fall back to local mode on network errors
			return res.status(200).json({ 
				gameState: { 
					id: `fallback-${sessionId}-${storyId}`,
					session_id: sessionId,
					story_id: storyId,
					current_node_id: currentNodeId,
					progress_data: validProgressData,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				},
				fallback: true 
			})
		}

		if (error) {
			console.error('Error creating game state:', error)
			return res.status(500).json({ error: 'Failed to create game state' })
		}

		return res.status(201).json({ gameState: data })
	} catch (error) {
		console.error('Unexpected error creating game state:', error)
		return res.status(500).json({ error: 'Internal server error' })
	}
}

async function getGameState(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { sessionId, storyId, gameStateId } = req.query

		// If getting by game state ID (for specific adventure)
		if (gameStateId && typeof gameStateId === 'string') {
			// If Supabase is not configured, return null (fallback mode)
			if (!isSupabaseConfigured || !supabase) {
				return res.status(200).json({ gameState: null, fallback: true })
			}

			try {
				const { data, error } = await supabase
					.from('game_states')
					.select('*')
					.eq('id', gameStateId)
					.single()

				if (error) {
					if (error.code === 'PGRST116') { // Not found
						return res.status(404).json({ error: 'Game state not found' })
					}
					console.warn('Supabase error fetching game state by ID, falling back:', error)
					return res.status(200).json({ gameState: null, fallback: true })
				}

				// Validate and migrate progress data if needed
				let gameState = data
				if (gameState && gameState.progress_data) {
					if (!GameStateManager.validateProgressData(gameState.progress_data)) {
						console.warn('Invalid progress data in stored state, migrating...')
						gameState.progress_data = GameStateManager.migrateProgressData(gameState.progress_data)
					}
				}
				
				return res.status(200).json({ gameState })
			} catch (networkError) {
				console.warn('Network error fetching game state by ID, falling back:', networkError)
				return res.status(200).json({ gameState: null, fallback: true })
			}
		}

		// Original logic for session-based lookup
		if (!sessionId || typeof sessionId !== 'string') {
			return res.status(400).json({ error: 'Session ID is required' })
		}

		// If Supabase is not configured, return null (fallback mode)
		if (!isSupabaseConfigured || !supabase) {
			return res.status(200).json({ gameState: null, fallback: true })
		}

		try {
			let query = supabase
				.from('game_states')
				.select('*')
				.eq('session_id', sessionId)

			if (storyId && typeof storyId === 'string') {
				query = query.eq('story_id', storyId)
			}

			const { data, error } = await query.order('updated_at', { ascending: false })

			if (error) {
				console.warn('Supabase error fetching game state, falling back:', error)
				return res.status(200).json({ gameState: null, fallback: true })
			}

			// Return the most recent game state, or null if none found
			let gameState = data && data.length > 0 ? data[0] : null
			
			// Validate and migrate progress data if needed
			if (gameState && gameState.progress_data) {
				if (!GameStateManager.validateProgressData(gameState.progress_data)) {
					console.warn('Invalid progress data in stored state, migrating...')
					gameState.progress_data = GameStateManager.migrateProgressData(gameState.progress_data)
				}
			}
			
			return res.status(200).json({ gameState })
		} catch (networkError) {
			console.warn('Network error fetching game state, falling back:', networkError)
			return res.status(200).json({ gameState: null, fallback: true })
		}
	} catch (error) {
		console.error('Unexpected error fetching game state:', error)
		return res.status(500).json({ error: 'Internal server error' })
	}
}

async function updateGameState(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { gameStateId } = req.query
		const { currentNodeId, progressData } = req.body

		if (!gameStateId || typeof gameStateId !== 'string') {
			return res.status(400).json({ error: 'Game state ID is required' })
		}

		if (!currentNodeId) {
			return res.status(400).json({ error: 'Current node ID is required' })
		}

		// Validate progress data if provided
		let validProgressData: ProgressData | undefined
		if (progressData) {
			if (GameStateManager.validateProgressData(progressData)) {
				validProgressData = progressData
			} else {
				console.warn('Invalid progress data provided in update, migrating...')
				validProgressData = GameStateManager.migrateProgressData(progressData)
			}
		}

		// If Supabase is not configured, return success (fallback mode)
		if (!isSupabaseConfigured || !supabase) {
			return res.status(200).json({ 
				gameState: { 
					id: gameStateId,
					current_node_id: currentNodeId,
					progress_data: validProgressData || GameStateManager.createInitialProgressData('fallback'),
					updated_at: new Date().toISOString()
				},
				fallback: true 
			})
		}

		const updateData: any = {
			current_node_id: currentNodeId,
			updated_at: new Date().toISOString()
		}

		if (validProgressData !== undefined) {
			updateData.progress_data = validProgressData
		}

		const { data, error } = await supabase
			.from('game_states')
			.update(updateData)
			.eq('id', gameStateId)
			.select()
			.single()

		if (error) {
			console.error('Error updating game state:', error)
			return res.status(500).json({ error: 'Failed to update game state' })
		}

		return res.status(200).json({ gameState: data })
	} catch (error) {
		console.error('Unexpected error updating game state:', error)
		return res.status(500).json({ error: 'Internal server error' })
	}
}