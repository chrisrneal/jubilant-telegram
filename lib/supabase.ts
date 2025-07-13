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
export interface StoryNode {
	id: string
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

export interface StoryNodeWithChoices extends StoryNode {
	choices: Choice[]
}