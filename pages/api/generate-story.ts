// API route for generating story content using Azure OpenAI

import type { NextApiRequest, NextApiResponse } from 'next'
import createAIService, { type AIStoryResponse } from '@/services/aiService'
import { 
	generateInitialStoryPrompt, 
	generateContinuationPrompt, 
	generateEndingPrompt,
	type StoryContext 
} from '@/lib/promptTemplates'

export interface GenerateStoryRequest {
	type: 'initial' | 'continuation' | 'ending'
	context?: StoryContext
}

export interface GenerateStoryResponse {
	success: boolean
	data?: AIStoryResponse
	error?: string
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<GenerateStoryResponse>
) {
	if (req.method !== 'POST') {
		return res.status(405).json({
			success: false,
			error: 'Method not allowed'
		})
	}

	try {
		const { type, context = {} }: GenerateStoryRequest = req.body

		if (!type || !['initial', 'continuation', 'ending'].includes(type)) {
			return res.status(400).json({
				success: false,
				error: 'Invalid request type. Must be "initial", "continuation", or "ending"'
			})
		}

		// Create AI service instance
		const aiService = createAIService()

		// Generate appropriate prompt based on type
		let prompt: string
		switch (type) {
			case 'initial':
				prompt = generateInitialStoryPrompt(context)
				break
			case 'continuation':
				prompt = generateContinuationPrompt(context)
				break
			case 'ending':
				prompt = generateEndingPrompt(context)
				break
			default:
				throw new Error('Invalid story type')
		}

		// Generate story content using AI
		const storyContent = await aiService.generateStoryContent(prompt)

		res.status(200).json({
			success: true,
			data: storyContent
		})

	} catch (error) {
		console.error('Story generation error:', error)
		
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
		
		res.status(500).json({
			success: false,
			error: errorMessage
		})
	}
}