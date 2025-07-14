import { supabase, isSupabaseConfigured, StoryNode, Choice, StoryNodeWithChoices } from './supabase'
import { fallbackStoryNodes } from './fallback-story-data'

export class StoryService {
	/**
	 * Get a story node by ID with its choices
	 */
	static async getStoryNode(nodeId: string): Promise<StoryNodeWithChoices | null> {
		// If Supabase is not configured, use fallback data
		if (!isSupabaseConfigured || !supabase) {
			const fallbackNode = fallbackStoryNodes[nodeId]
			if (!fallbackNode) {
				return null
			}

			// Convert fallback format to Supabase format
			return {
				id: fallbackNode.id,
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
			// First get the story node
			const { data: node, error: nodeError } = await supabase
				.from('story_nodes')
				.select('*')
				.eq('id', nodeId)
				.single()

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
	 * Get all story nodes (for admin/debugging purposes)
	 */
	static async getAllStoryNodes(): Promise<StoryNode[]> {
		// If Supabase is not configured, use fallback data
		if (!isSupabaseConfigured || !supabase) {
			return Object.values(fallbackStoryNodes).map(node => ({
				id: node.id,
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