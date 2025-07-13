// AI service for Azure OpenAI integration

export interface Choice {
	id: string
	text: string
}

export interface AIStoryResponse {
	title: string
	text: string
	choices: Choice[]
	isEnding?: boolean
}

export interface AIServiceConfig {
	apiKey: string
	endpoint: string
	deploymentName: string
	apiVersion: string
}

class AIService {
	private config: AIServiceConfig

	constructor(config: AIServiceConfig) {
		this.config = config
	}

	async generateStoryContent(prompt: string): Promise<AIStoryResponse> {
		try {
			const url = `${this.config.endpoint}openai/deployments/${this.config.deploymentName}/chat/completions?api-version=${this.config.apiVersion}`

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'api-key': this.config.apiKey,
				},
				body: JSON.stringify({
					messages: [
						{
							role: 'user',
							content: prompt,
						},
					],
					max_tokens: 500,
					temperature: 0.8,
					top_p: 0.9,
					frequency_penalty: 0.1,
					presence_penalty: 0.1,
				}),
			})

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`)
			}

			const data = await response.json()
			const content = data.choices?.[0]?.message?.content

			if (!content) {
				throw new Error('No content received from Azure OpenAI API')
			}

			// Parse the JSON response from the AI
			try {
				const parsedContent = JSON.parse(content)
				
				// Validate the response structure
				if (!parsedContent.title || !parsedContent.text || !Array.isArray(parsedContent.choices)) {
					throw new Error('Invalid response structure from AI')
				}

				// Ensure choices have the correct structure
				const validatedChoices = parsedContent.choices.map((choice: any, index: number) => ({
					id: choice.id || `choice_${index + 1}`,
					text: choice.text || `Choice ${index + 1}`
				}))

				return {
					title: parsedContent.title,
					text: parsedContent.text,
					choices: validatedChoices,
					isEnding: parsedContent.isEnding || false
				}
			} catch (parseError) {
				console.error('Failed to parse AI response:', content)
				throw new Error('Failed to parse AI response as JSON')
			}
		} catch (error) {
			console.error('AI Service Error:', error)
			throw error
		}
	}
}

// Create and export a configured AI service instance
export function createAIService(): AIService {
	const config: AIServiceConfig = {
		apiKey: process.env.AZURE_OPENAI_API_KEY || '',
		endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
		deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini',
		apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
	}

	// Validate configuration
	if (!config.apiKey || !config.endpoint) {
		throw new Error('Azure OpenAI configuration is missing. Please check your environment variables.')
	}

	return new AIService(config)
}

// Default export for easy importing
export default createAIService