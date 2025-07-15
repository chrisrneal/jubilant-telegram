import { NextApiRequest, NextApiResponse } from 'next'
import { supabase, isSupabaseConfigured, UserSession } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === 'POST') {
		return createSession(req, res)
	} else if (req.method === 'GET') {
		return getSession(req, res)
	} else if (req.method === 'PUT') {
		return updateSession(req, res)
	} else {
		res.setHeader('Allow', ['POST', 'GET', 'PUT'])
		return res.status(405).json({ error: 'Method not allowed' })
	}
}

async function createSession(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { sessionId, userId = null } = req.body

		if (!sessionId) {
			return res.status(400).json({ error: 'Session ID is required' })
		}

		// If Supabase is not configured, return success (fallback mode)
		if (!isSupabaseConfigured || !supabase) {
			return res.status(200).json({ 
				session: { 
					id: sessionId, 
					user_id: userId,
					created_at: new Date().toISOString(),
					last_accessed: new Date().toISOString(),
					expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
				},
				fallback: true 
			})
		}

		const { data, error } = await supabase
			.from('user_sessions')
			.insert([
				{
					id: sessionId,
					user_id: userId,
					last_accessed: new Date().toISOString()
				}
			])
			.select()
			.single()

		if (error) {
			console.error('Error creating session:', error)
			return res.status(500).json({ error: 'Failed to create session' })
		}

		return res.status(201).json({ session: data })
	} catch (error) {
		console.error('Unexpected error creating session:', error)
		return res.status(500).json({ error: 'Internal server error' })
	}
}

async function getSession(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { sessionId } = req.query

		if (!sessionId || typeof sessionId !== 'string') {
			return res.status(400).json({ error: 'Session ID is required' })
		}

		// If Supabase is not configured, return mock session (fallback mode)
		if (!isSupabaseConfigured || !supabase) {
			return res.status(200).json({ 
				session: { 
					id: sessionId, 
					user_id: null,
					created_at: new Date().toISOString(),
					last_accessed: new Date().toISOString(),
					expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
				},
				fallback: true 
			})
		}

		try {
			const { data, error } = await supabase
				.from('user_sessions')
				.select('*')
				.eq('id', sessionId)
				.single()

			if (error) {
				if (error.code === 'PGRST116') { // Not found
					console.warn('Session not found, falling back')
					return res.status(200).json({ 
						session: { 
							id: sessionId, 
							user_id: null,
							created_at: new Date().toISOString(),
							last_accessed: new Date().toISOString(),
							expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
						},
						fallback: true 
					})
				}
				console.warn('Supabase error fetching session, falling back:', error)
				return res.status(200).json({ 
					session: { 
						id: sessionId, 
						user_id: null,
						created_at: new Date().toISOString(),
						last_accessed: new Date().toISOString(),
						expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
					},
					fallback: true 
				})
			}

			return res.status(200).json({ session: data })
		} catch (networkError) {
			console.warn('Network error fetching session, falling back:', networkError)
			return res.status(200).json({ 
				session: { 
					id: sessionId, 
					user_id: null,
					created_at: new Date().toISOString(),
					last_accessed: new Date().toISOString(),
					expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
				},
				fallback: true 
			})
		}
	} catch (error) {
		console.error('Unexpected error fetching session:', error)
		return res.status(500).json({ error: 'Internal server error' })
	}
}

async function updateSession(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { sessionId } = req.query
		const { last_accessed } = req.body

		if (!sessionId || typeof sessionId !== 'string') {
			return res.status(400).json({ error: 'Session ID is required' })
		}

		// If Supabase is not configured, return success (fallback mode)
		if (!isSupabaseConfigured || !supabase) {
			return res.status(200).json({ 
				session: { 
					id: sessionId, 
					user_id: null,
					created_at: new Date().toISOString(),
					last_accessed: last_accessed || new Date().toISOString(),
					expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
				},
				fallback: true 
			})
		}

		const { data, error } = await supabase
			.from('user_sessions')
			.update({ 
				last_accessed: last_accessed || new Date().toISOString() 
			})
			.eq('id', sessionId)
			.select()
			.single()

		if (error) {
			console.error('Error updating session:', error)
			return res.status(500).json({ error: 'Failed to update session' })
		}

		return res.status(200).json({ session: data })
	} catch (error) {
		console.error('Unexpected error updating session:', error)
		return res.status(500).json({ error: 'Internal server error' })
	}
}