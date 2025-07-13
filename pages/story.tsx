import { useState, useEffect } from 'react'
import Page from '@/components/page'
import Section from '@/components/section'
import type { GenerateStoryRequest, GenerateStoryResponse } from './api/generate-story'
import type { StoryContext } from '@/lib/promptTemplates'

// Game state interfaces
interface Choice {
	id: string
	text: string
}

interface StoryNode {
	id: string
	title: string
	text: string
	choices: Choice[]
	isEnding?: boolean
}

// Game state
interface GameState {
	currentNode: StoryNode | null
	storyHistory: string[]
	isLoading: boolean
	error: string | null
}

// Fallback story for when AI is unavailable
const fallbackStoryNode: StoryNode = {
	id: 'fallback',
	title: 'The Mysterious Door',
	text: 'You find yourself standing before an ancient wooden door deep in a forgotten forest. Strange symbols glow faintly on its surface, and you can hear a low humming sound coming from behind it. The air feels charged with magic.',
	choices: [
		{ id: 'door_open', text: 'Push open the door' },
		{ id: 'door_examine', text: 'Examine the symbols closely' },
		{ id: 'door_leave', text: 'Turn around and leave' },
	],
}

export default function StoryPage() {
	const [gameState, setGameState] = useState<GameState>({
		currentNode: null,
		storyHistory: [],
		isLoading: true,
		error: null
	})

	// Generate story content using AI
	const generateStoryContent = async (
		type: 'initial' | 'continuation' | 'ending',
		context: StoryContext = {}
	): Promise<StoryNode | null> => {
		try {
			const request: GenerateStoryRequest = { type, context }
			
			const response = await fetch('/api/generate-story', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(request),
			})

			const result: GenerateStoryResponse = await response.json()

			if (!result.success || !result.data) {
				throw new Error(result.error || 'Failed to generate story content')
			}

			return {
				id: Date.now().toString(),
				title: result.data.title,
				text: result.data.text,
				choices: result.data.choices,
				isEnding: result.data.isEnding
			}
		} catch (error) {
			console.error('Failed to generate story:', error)
			return null
		}
	}

	// Initialize the story
	useEffect(() => {
		const initializeStory = async () => {
			setGameState(prev => ({ ...prev, isLoading: true, error: null }))
			
			const initialNode = await generateStoryContent('initial', {
				characterName: 'the adventurer',
				genre: 'fantasy'
			})

			if (initialNode) {
				setGameState(prev => ({
					...prev,
					currentNode: initialNode,
					isLoading: false
				}))
			} else {
				// Fallback to static content if AI fails
				setGameState(prev => ({
					...prev,
					currentNode: fallbackStoryNode,
					isLoading: false,
					error: 'AI story generation unavailable. Using fallback content.'
				}))
			}
		}

		initializeStory()
	}, [])

	// Handle choice selection
	const handleChoice = async (choice: Choice) => {
		if (!gameState.currentNode) return

		setGameState(prev => ({ ...prev, isLoading: true, error: null }))

		// Add current scene to history
		const newHistory = [
			...gameState.storyHistory,
			`${gameState.currentNode!.title}: ${gameState.currentNode!.text}`,
			`Choice: ${choice.text}`
		]

		// Determine if this should be an ending (random chance or after many choices)
		const shouldEnd = newHistory.length > 10 && Math.random() < 0.3

		const context: StoryContext = {
			currentScene: gameState.currentNode.text,
			playerChoice: choice.text,
			storyHistory: newHistory.slice(-6), // Keep last 6 entries for context
			characterName: 'the adventurer',
			genre: 'fantasy'
		}

		const nextNode = await generateStoryContent(
			shouldEnd ? 'ending' : 'continuation',
			context
		)

		if (nextNode) {
			setGameState(prev => ({
				...prev,
				currentNode: nextNode,
				storyHistory: newHistory,
				isLoading: false
			}))
		} else {
			setGameState(prev => ({
				...prev,
				isLoading: false,
				error: 'Failed to generate next story scene. Please try again.'
			}))
		}
	}

	// Restart the story
	const restartStory = async () => {
		setGameState({
			currentNode: null,
			storyHistory: [],
			isLoading: true,
			error: null
		})

		const initialNode = await generateStoryContent('initial', {
			characterName: 'the adventurer',
			genre: 'fantasy'
		})

		if (initialNode) {
			setGameState(prev => ({
				...prev,
				currentNode: initialNode,
				isLoading: false
			}))
		} else {
			setGameState(prev => ({
				...prev,
				currentNode: fallbackStoryNode,
				isLoading: false,
				error: 'AI story generation unavailable. Using fallback content.'
			}))
		}
	}

	// Loading state
	if (gameState.isLoading) {
		return (
			<Page title="Adventure">
				<Section>
					<div className="max-w-4xl mx-auto text-center">
						<h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 mb-6">
							Generating Your Adventure...
						</h2>
						<div className="bg-white dark:bg-zinc-800 rounded-lg p-8 shadow-lg border border-zinc-200 dark:border-zinc-700">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
							<p className="text-zinc-600 dark:text-zinc-400">
								Our AI storyteller is crafting a unique adventure just for you...
							</p>
						</div>
					</div>
				</Section>
			</Page>
		)
	}

	// Error state (but still show current content if available)
	if (!gameState.currentNode) {
		return (
			<Page title="Adventure">
				<Section>
					<div className="text-center">
						<h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
							Error: Could not load story
						</h2>
						<p className="text-zinc-600 dark:text-zinc-400 mt-2">
							{gameState.error || 'An unexpected error occurred'}
						</p>
						<button
							onClick={restartStory}
							disabled={gameState.isLoading}
							className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
						>
							Try Again
						</button>
					</div>
				</Section>
			</Page>
		)
	}

	return (
		<Page title="Adventure">
			<Section>
				<div className="max-w-4xl mx-auto">
					{/* Error message */}
					{gameState.error && (
						<div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
							<p className="text-amber-800 dark:text-amber-200 text-sm">
								⚠️ {gameState.error}
							</p>
						</div>
					)}

					{/* Story Title */}
					<h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 mb-6">
						{gameState.currentNode.title}
					</h2>

					{/* Story Text */}
					<div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg mb-8 border border-zinc-200 dark:border-zinc-700">
						<p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
							{gameState.currentNode.text}
						</p>
					</div>

					{/* Choices */}
					<div className="space-y-3">
						<h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
							What do you do?
						</h3>
						{gameState.currentNode.choices.map((choice) => (
							<button
								key={choice.id}
								onClick={() => {
									if (choice.id === 'restart') {
										restartStory()
									} else {
										handleChoice(choice)
									}
								}}
								disabled={gameState.isLoading}
								className="w-full text-left p-4 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors duration-200 border border-zinc-300 dark:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<span className="text-zinc-800 dark:text-zinc-200 font-medium">
									→ {choice.text}
								</span>
								{gameState.isLoading && choice.id !== 'restart' && (
									<span className="ml-2 text-zinc-500 dark:text-zinc-400">
										(generating...)
									</span>
								)}
							</button>
						))}
					</div>

					{/* Ending indicator */}
					{gameState.currentNode.isEnding && (
						<div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
							<p className="text-amber-800 dark:text-amber-200 text-center font-medium">
								✨ Chapter Complete ✨
							</p>
						</div>
					)}

					{/* Game instructions */}
					<div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700">
						<p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
							{gameState.isLoading 
								? 'Generating your next adventure moment...'
								: 'Click on the choices above to continue your AI-generated adventure'
							}
						</p>
						{gameState.storyHistory.length > 0 && (
							<p className="text-xs text-zinc-500 dark:text-zinc-500 text-center mt-2">
								Story depth: {Math.floor(gameState.storyHistory.length / 2)} choices made
							</p>
						)}
					</div>
				</div>
			</Section>
		</Page>
	)
}