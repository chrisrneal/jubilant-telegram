import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Page from '@/components/page'
import Section from '@/components/section'
import { Adventure, Story } from '@/lib/supabase'
import { StoryService } from '@/lib/story-service'
import { useAuth } from '@/lib/auth-context'

export default function AdventuresPage() {
	const [adventures, setAdventures] = useState<Adventure[]>([])
	const [stories, setStories] = useState<Story[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isCreating, setIsCreating] = useState(false)
	
	const { user, isAuthenticated, loading: authLoading } = useAuth()

	const loadAdventures = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)

			const params = new URLSearchParams()
			if (isAuthenticated && user) {
				params.append('userId', user.id)
			} else {
				// For anonymous users, use session prefix
				const sessionId = StoryService.getOrCreateSessionId()
				params.append('sessionPrefix', sessionId.split('_')[0])
			}

			const response = await fetch(`/api/adventures?${params}`)
			const result = await response.json()

			if (!response.ok) {
				throw new Error(result.error || 'Failed to load adventures')
			}

			setAdventures(result.adventures || [])
		} catch (err) {
			console.error('Error loading adventures:', err)
			setError(err instanceof Error ? err.message : 'Failed to load adventures')
		} finally {
			setLoading(false)
		}
	}, [isAuthenticated, user])

	useEffect(() => {
		if (!authLoading) {
			loadAdventures()
			loadStories()
		}
	}, [authLoading, loadAdventures])

	const loadStories = async () => {
		try {
			const availableStories = await StoryService.getStories()
			setStories(availableStories)
		} catch (err) {
			console.error('Error loading stories:', err)
		}
	}

	const createNewAdventure = async (storyId: string) => {
		try {
			setIsCreating(true)
			setError(null)

			const story = stories.find(s => s.id === storyId)
			
			const response = await fetch('/api/adventures', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: user?.id,
					storyId,
					title: story ? `${story.title} - ${new Date().toLocaleDateString()}` : 'New Adventure'
				})
			})

			const result = await response.json()

			if (!response.ok) {
				throw new Error(result.error || 'Failed to create adventure')
			}

			// Refresh adventures list
			await loadAdventures()
		} catch (err) {
			console.error('Error creating adventure:', err)
			setError(err instanceof Error ? err.message : 'Failed to create adventure')
		} finally {
			setIsCreating(false)
		}
	}

	const getStatusBadge = (status: string) => {
		const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
		switch (status) {
			case 'active':
				return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`
			case 'completed':
				return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`
			case 'abandoned':
				return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400`
			default:
				return `${baseClasses} bg-gray-100 text-gray-800`
		}
	}

	if (authLoading || loading) {
		return (
			<Page title="My Adventures">
				<Section>
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading your adventures...</p>
					</div>
				</Section>
			</Page>
		)
	}

	return (
		<Page title="My Adventures">
			<Section>
				<div className="max-w-6xl mx-auto">
					{/* Header */}
					<div className="mb-8">
						<h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
							My Adventures
						</h1>
						<p className="text-zinc-600 dark:text-zinc-400">
							Manage your story adventures, continue where you left off, or start something new.
						</p>
					</div>

					{/* User Status */}
					<div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
						<p className="text-sm text-blue-800 dark:text-blue-200">
							{isAuthenticated && user ? (
								<>
									🔐 Signed in as <strong>{user.user_metadata?.display_name || user.email}</strong> - 
									Your adventures are saved to your account
								</>
							) : (
								<>
									👤 Playing as guest - <Link href="/auth" className="underline">Sign in</Link> to save adventures across devices
								</>
							)}
						</p>
					</div>

					{/* Error Display */}
					{error && (
						<div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
							<p className="text-red-800 dark:text-red-200">{error}</p>
						</div>
					)}

					{/* Quick Actions */}
					<div className="mb-8">
						<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
							Start New Adventure
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{stories.map(story => (
								<div key={story.id} className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
									<h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">
										{story.title}
									</h3>
									{story.description && (
										<p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
											{story.description}
										</p>
									)}
									<button
										onClick={() => createNewAdventure(story.id)}
										disabled={isCreating}
										className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
									>
										{isCreating ? 'Starting...' : 'Start Adventure'}
									</button>
								</div>
							))}
						</div>
					</div>

					{/* Adventures List */}
					<div className="mb-8">
						<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
							Your Adventures
						</h2>
						
						{adventures.length === 0 ? (
							<div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
								<div className="text-4xl mb-4">📚</div>
								<h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
									No adventures yet
								</h3>
								<p className="text-zinc-600 dark:text-zinc-400 mb-4">
									Start your first adventure above, or continue from the main page.
								</p>
								<Link 
									href="/"
									className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
								>
									Go to Main Page
								</Link>
							</div>
						) : (
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{adventures.map(adventure => (
									<div key={adventure.id} className="p-6 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
										<div className="flex items-start justify-between mb-4">
											<div>
												<h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
													{adventure.title}
												</h3>
												<p className="text-sm text-zinc-600 dark:text-zinc-400">
													Started {new Date(adventure.started_at).toLocaleDateString()}
												</p>
											</div>
											<span className={getStatusBadge(adventure.status)}>
												{adventure.status}
											</span>
										</div>

										{/* Progress Summary */}
										<div className="mb-4 grid grid-cols-3 gap-4 text-center">
											<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
												<div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
													{adventure.progress_summary?.totalChoices || 0}
												</div>
												<div className="text-xs text-blue-600 dark:text-blue-400">
													Choices
												</div>
											</div>
											<div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
												<div className="text-lg font-semibold text-green-600 dark:text-green-400">
													{adventure.progress_summary?.scenesExplored || 0}
												</div>
												<div className="text-xs text-green-600 dark:text-green-400">
													Scenes
												</div>
											</div>
											<div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
												<div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
													{adventure.progress_summary?.playTime || 0}m
												</div>
												<div className="text-xs text-purple-600 dark:text-purple-400">
													Play Time
												</div>
											</div>
										</div>

										{/* Actions */}
										<div className="flex gap-3">
											<Link
												href={`/story?adventure=${adventure.id}`}
												className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center font-medium rounded-lg transition-colors"
											>
												{adventure.status === 'active' ? 'Continue' : 'View'}
											</Link>
											<Link
												href={`/adventures/${adventure.id}/history`}
												className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium rounded-lg transition-colors"
											>
												History
											</Link>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Adventure Comparison */}
					{adventures.length > 1 && (
						<div className="text-center">
							<Link
								href="/adventures/compare"
								className="inline-block px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium rounded-lg transition-colors"
							>
								Compare Adventures
							</Link>
						</div>
					)}
				</div>
			</Section>
		</Page>
	)
}