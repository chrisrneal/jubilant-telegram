import { useState, useEffect } from 'react'
import Page from '@/components/page'
import Section from '@/components/section'
import { StoryService } from '@/lib/story-service'
import { StoryNodeWithChoices } from '@/lib/supabase'

export default function StoryPage() {
	const [currentNodeId, setCurrentNodeId] = useState('start')
	const [currentNode, setCurrentNode] = useState<StoryNodeWithChoices | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isUsingSupabase, setIsUsingSupabase] = useState(false)

	// Load story node
	useEffect(() => {
		const loadStoryNode = async () => {
			setLoading(true)
			setError(null)
			
			try {
				const node = await StoryService.getStoryNode(currentNodeId)
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
	}, [currentNodeId])

	// Check if using Supabase on component mount
	useEffect(() => {
		setIsUsingSupabase(StoryService.isUsingSupabase())
	}, [])

	const handleChoice = (nextNodeId: string) => {
		setCurrentNodeId(nextNodeId)
	}

	if (loading) {
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
						<button
							onClick={() => setCurrentNodeId('start')}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							Return to Start
						</button>
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
						<button
							onClick={() => setCurrentNodeId('start')}
							className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							Return to Start
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
					{/* Data source indicator */}
					{!isUsingSupabase && (
						<div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
							<p className="text-sm text-amber-800 dark:text-amber-200">
								📊 Using fallback story data. Configure Supabase environment variables to use database.
							</p>
						</div>
					)}

					{/* Story Title */}
					<h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 mb-6">
						{currentNode.title}
					</h2>

					{/* Story Text */}
					<div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg mb-8 border border-zinc-200 dark:border-zinc-700">
						<p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
							{currentNode.text}
						</p>
					</div>

					{/* Choices */}
					<div className="space-y-3">
						<h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
							What do you do?
						</h3>
						{currentNode.choices.map((choice) => (
							<button
								key={choice.id}
								onClick={() => handleChoice(choice.next_node_id)}
								className="w-full text-left p-4 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors duration-200 border border-zinc-300 dark:border-zinc-600"
							>
								<span className="text-zinc-800 dark:text-zinc-200 font-medium">
									→ {choice.text}
								</span>
							</button>
						))}
					</div>

					{/* Ending indicator */}
					{currentNode.is_ending && (
						<div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
							<p className="text-amber-800 dark:text-amber-200 text-center font-medium">
								✨ Chapter Complete ✨
							</p>
						</div>
					)}

					{/* Game instructions */}
					<div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700">
						<p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
							Click on the choices above to continue your adventure
						</p>
						{isUsingSupabase && (
							<p className="text-xs text-green-600 dark:text-green-400 text-center mt-2">
								🗄️ Powered by Supabase
							</p>
						)}
					</div>
				</div>
			</Section>
		</Page>
	)
}
