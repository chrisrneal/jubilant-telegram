import { NextApiRequest, NextApiResponse } from 'next'
import { supabase, isSupabaseConfigured, Story } from '@/lib/supabase'
import { fallbackStories } from '@/lib/fallback-story-data'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === 'GET') {
		const { random } = req.query
		
		if (random === 'true') {
			return getRandomStory(req, res)
		} else {
			return getAllStories(req, res)
		}
	} else {
		res.setHeader('Allow', ['GET'])
		return res.status(405).json({ error: 'Method not allowed' })
	}
}

async function getAllStories(req: NextApiRequest, res: NextApiResponse) {
	try {
		// If Supabase is not configured, return fallback stories
		if (!isSupabaseConfigured || !supabase) {
			const stories = Object.values(fallbackStories).filter(story => story.isActive)
			return res.status(200).json({ stories, fallback: true })
		}

		const { data, error } = await supabase
			.from('stories')
			.select('*')
			.eq('is_active', true)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('Error fetching stories:', error)
			return res.status(500).json({ error: 'Failed to fetch stories' })
		}

		return res.status(200).json({ stories: data || [] })
	} catch (error) {
		console.error('Unexpected error fetching stories:', error)
		return res.status(500).json({ error: 'Internal server error' })
	}
}

async function getRandomStory(req: NextApiRequest, res: NextApiResponse) {
	try {
		// If Supabase is not configured, return random fallback story
		if (!isSupabaseConfigured || !supabase) {
			const activeStories = Object.values(fallbackStories).filter(story => story.isActive)
			if (activeStories.length === 0) {
				return res.status(404).json({ error: 'No active stories found' })
			}
			
			const randomIndex = Math.floor(Math.random() * activeStories.length)
			const randomStory = activeStories[randomIndex]
			
			return res.status(200).json({ story: randomStory, fallback: true })
		}

		const { data, error } = await supabase
			.from('stories')
			.select('*')
			.eq('is_active', true)

		if (error) {
			console.error('Error fetching stories for random selection:', error)
			return res.status(500).json({ error: 'Failed to fetch stories' })
		}

		if (!data || data.length === 0) {
			return res.status(404).json({ error: 'No active stories found' })
		}

		// Select a random story
		const randomIndex = Math.floor(Math.random() * data.length)
		const randomStory = data[randomIndex]

		return res.status(200).json({ story: randomStory })
	} catch (error) {
		console.error('Unexpected error fetching random story:', error)
		return res.status(500).json({ error: 'Internal server error' })
	}
}