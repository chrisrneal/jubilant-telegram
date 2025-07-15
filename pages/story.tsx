import { useState, useEffect } from 'react'
import Page from '@/components/page'
import Section from '@/components/section'
import StoryContent from '@/components/story-content'
import StoryChoices from '@/components/story-choices'
import AnimationControls from '@/components/animation-controls'
import { StoryService } from '@/lib/story-service'
import { StoryNodeWithChoices, Story, UserSession, GameState } from '@/lib/supabase'
import { GameStateManager } from '@/lib/game-state-manager'
import { useAuth } from '@/lib/auth-context'

export default function StoryPage() {
	const [currentStory, setCurrentStory] = useState<Story | null>(null)
	const [currentNodeId, setCurrentNodeId] = useState('start')
	const [currentNode, setCurrentNode] = useState<StoryNodeWithChoices | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isUsingSupabase, setIsUsingSupabase] = useState(false)
	const [sessionId, setSessionId] = useState<string>('')
	const [gameState, setGameState] = useState<GameState | null>(null)
	const [animationsEnabled, setAnimationsEnabled] = useState(true)
	const [storyKey, setStoryKey] = useState(0) // Key to force re-render for animations
	
	const { user, isAuthenticated, loading: authLoading } = useAuth()

	// Initialize session and story on component mount
	useEffect(() => {
		const initializeSession = async () => {
			setLoading(true)
			setError(null)
			
			try {
				let newSessionId: string

				// Handle authenticated vs anonymous users
				if (isAuthenticated && user) {
					// For authenticated users, create a user-specific session
					newSessionId = await StoryService.getOrCreateUserSession(user.id)
				} else {
					// For anonymous users, use the existing localStorage approach
					newSessionId = StoryService.getOrCreateSessionId()
				}

				setSessionId(newSessionId)

				// Try to get existing session or create new one
				let session = await StoryService.getSession(newSessionId)
				if (!session) {
					session = await StoryService.createSession(newSessionId, user?.id)
				}

				if (session) {
					// Update session last accessed time
					await StoryService.updateSession(newSessionId)
				}

				// Try to get existing game state first
				const existingGameState = await StoryService.getGameState(newSessionId)
				
				if (existingGameState) {
					// Resume existing game
					setGameState(existingGameState)
					setCurrentNodeId(existingGameState.current_node_id)
					
					// Load the story for the existing game state
					const stories = await StoryService.getStories()
					const story = stories.find(s => s.id === existingGameState.story_id)
					setCurrentStory(story || null)
				} else {
					// Start new game with random story
					const randomStory = await StoryService.getRandomStory()
					if (randomStory) {
						setCurrentStory(randomStory)
						setCurrentNodeId('start')
						
						// Create initial game state
						const newGameState = await StoryService.saveGameState(
							newSessionId, 
							randomStory.id, 
							'start'
						)
						setGameState(newGameState)
					} else {
						setError('No stories available')
						return
					}
				}

			} catch (err) {
				console.error('Error initializing session:', err)
				setError('Failed to initialize game session')
			} finally {
				setLoading(false)
			}
		}

		// Only initialize if auth is not loading
		if (!authLoading) {
			initializeSession()
		}
	}, [isAuthenticated, user, authLoading])

	// Load story node when current node changes
	useEffect(() => {
		const loadStoryNode = async () => {
			if (!currentStory || !currentNodeId) return

			setLoading(true)
			setError(null)
			
			try {
				const node = await StoryService.getStoryNode(currentNodeId, currentStory.id)
				if (node) {
					setCurrentNode(node)
				} else {
					setError('Story node not found')
				}
			} catch (err) {
				console.error('Error loading story node:', err)
				setError('Failed to load story content')
			} finally {
				setLoading(false)
			}
		}

		loadStoryNode()
	}, [currentNodeId, currentStory])

	// Check if using Supabase on component mount
	useEffect(() => {
		setIsUsingSupabase(StoryService.isUsingSupabase())
	}, [])

	const handleChoice = async (nextNodeId: string, choiceId: string, choiceText: string) => {
		if (!currentStory || !gameState || !currentNodeId) return

		// Update game state with enhanced choice tracking
		const updatedGameState = await StoryService.saveGameState(
			sessionId,
			currentStory.id,
			nextNodeId,
			undefined, // Let the service handle progress data updates
			{
				choiceId,
				choiceText,
				previousNodeId: currentNodeId
			}
		)

		if (updatedGameState) {
			setGameState(updatedGameState)
		}

		// Force re-render with animations by updating the story key
		setStoryKey(prev => prev + 1)
		setCurrentNodeId(nextNodeId)
	}

	const handleRestartGame = async () => {
		if (!sessionId) return

		try {
			// Get a new random story
			const randomStory = await StoryService.getRandomStory()
			if (randomStory) {
				setCurrentStory(randomStory)
				setCurrentNodeId('start')
				
				// Create new game state
				const newGameState = await StoryService.saveGameState(
					sessionId, 
					randomStory.id, 
					'start'
				)
				setGameState(newGameState)
				
				// Force re-render with animations
				setStoryKey(prev => prev + 1)
			}
		} catch (err) {
			console.error('Error restarting game:', err)
			setError('Failed to restart game')
		}
	}

	// Show loading while auth is loading
	if (authLoading || loading) {
		return (
			<Page title="Adventure">
				<Section>
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading your adventure...</p>
					</div>
				</Section>
			</Page>
		)
	}

	if (error) {
		return (
			<Page title="Adventure">
				<Section>
					<div className="text-center">
						<h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
							{error}
						</h2>
						<div className="space-x-4">
							<button
								onClick={() => setCurrentNodeId('start')}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								Return to Start
							</button>
							<button
								onClick={handleRestartGame}
								className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
							>
								New Adventure
							</button>
						</div>
					</div>
				</Section>
			</Page>
		)
	}

	if (!currentNode) {
		return (
			<Page title="Adventure">
				<Section>
					<div className="text-center">
						<h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
							Story node not found
						</h2>
						<div className="mt-4 space-x-4">
							<button
								onClick={() => setCurrentNodeId('start')}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								Return to Start
							</button>
							<button
								onClick={handleRestartGame}
								className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
							>
								New Adventure
							</button>
						</div>
					</div>
				</Section>
			</Page>
		)
	}

	return (
		<Page title="Adventure">
			<Section>
				<div className="max-w-4xl mx-auto">
					{/* Data source and session info */}
					<div className="mb-4 space-y-2">
						{!isUsingSupabase && (
							<div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
								<p className="text-sm text-amber-800 dark:text-amber-200">
									📊 Using fallback story data. Configure Supabase environment variables to use database.
								</p>
							</div>
						)}
						
						{/* Authentication status */}
						{isUsingSupabase && (
							<div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
								<p className="text-sm text-green-800 dark:text-green-200">
									{isAuthenticated && user ? (
										<>
											🔐 Signed in as <strong>{user.user_metadata?.display_name || user.email}</strong> - 
											Your progress is saved to your account
										</>
									) : (
										<>
											👤 Playing as guest - Sign in to save progress across devices
										</>
									)}
								</p>
							</div>
						)}
						
						{currentStory && gameState && (
							<div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
								<p className="text-sm text-blue-800 dark:text-blue-200">
									📖 Playing: <strong>{currentStory.title}</strong> 
									{gameState && !isUsingSupabase && (
										<span className="ml-2">(Session: {sessionId.slice(-8)})</span>
									)}
								</p>
								{currentStory.description && (
									<p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
										{currentStory.description}
									</p>
								)}
							</div>
						)}
					</div>

					{/* Animation Controls */}
					<div className="mb-6">
						<AnimationControls
							onAnimationToggle={setAnimationsEnabled}
							className="justify-end"
						/>
					</div>

					{/* Story Content */}
					<StoryContent
						key={storyKey}
						title={currentNode.title}
						text={currentNode.text}
						enableAnimations={animationsEnabled}
						className="fade-in"
					/>

					{/* Choices */}
					<StoryChoices
						key={`choices-${storyKey}`}
						choices={currentNode.choices}
						onChoiceSelect={handleChoice}
						enableAnimations={animationsEnabled}
					/>

					{/* Ending indicator and restart option */}
					{currentNode.is_ending && (
						<div className="mt-8 space-y-4">
							<div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
								<p className="text-amber-800 dark:text-amber-200 text-center font-medium">
									✨ Chapter Complete ✨
								</p>
							</div>
							<div className="text-center">
								<button
									onClick={handleRestartGame}
									className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
								>
									Start New Adventure
								</button>
							</div>
						</div>
					)}

					{/* Game progress indicators */}
					{gameState && gameState.progress_data && GameStateManager.validateProgressData(gameState.progress_data) && (
						<div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
								<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
									<p className="text-sm text-blue-800 dark:text-blue-200">
										<strong>{GameStateManager.getTotalChoicesMade(gameState.progress_data)}</strong> choices made
									</p>
								</div>
								<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
									<p className="text-sm text-green-800 dark:text-green-200">
										<strong>{gameState.progress_data.visitedScenarios.length}</strong> scenes explored
									</p>
								</div>
								<div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
									<p className="text-sm text-purple-800 dark:text-purple-200">
										<strong>{GameStateManager.getGameplayDuration(gameState.progress_data)}min</strong> play time
									</p>
								</div>
							</div>
							
							{/* Show inventory if player has items */}
							{Object.keys(gameState.progress_data.inventory).length > 0 && (
								<div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
									<p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
										<strong>🎒 Inventory:</strong>
									</p>
									<div className="flex flex-wrap gap-2">
										{Object.entries(gameState.progress_data.inventory).map(([itemId, item]) => (
											<span key={itemId} className="text-xs bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-1 rounded">
												{item.name} ({item.quantity})
											</span>
										))}
									</div>
								</div>
							)}
						</div>
					)}

					{/* Game instructions */}
					<div className="mt-4">
						<p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
							{currentNode.is_ending ? 
								'Your adventure is complete! Click above to start a new one.' :
								'Click on the choices above to continue your adventure'
							}
						</p>
						<div className="flex justify-center space-x-4 mt-2">
							{isUsingSupabase && (
								<p className="text-xs text-green-600 dark:text-green-400">
									🗄️ Powered by Supabase
								</p>
							)}
							{gameState && (
								<p className="text-xs text-purple-600 dark:text-purple-400">
									💾 Progress auto-saved
								</p>
							)}
							{isAuthenticated && (
								<p className="text-xs text-blue-600 dark:text-blue-400">
									🔐 Account linked
								</p>
							)}
						</div>
					</div>
				</div>
			</Section>
		</Page>
	)
}
