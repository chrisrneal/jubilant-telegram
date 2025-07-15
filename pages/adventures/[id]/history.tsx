import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Page from '@/components/page'
import Section from '@/components/section'
import { GameState, Adventure, ChoiceRecord } from '@/lib/supabase'
import { GameStateManager } from '@/lib/game-state-manager'
import { useAuth } from '@/lib/auth-context'

export default function AdventureHistoryPage() {
	const router = useRouter()
	const { id } = router.query
	const [adventure, setAdventure] = useState<Adventure | null>(null)
	const [gameState, setGameState] = useState<GameState | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	
	const { user, isAuthenticated, loading: authLoading } = useAuth()

	const loadAdventureHistory = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)

			if (!id || typeof id !== 'string') {
				setError('Invalid adventure ID')
				return
			}

			// Get the game state for this adventure
			const response = await fetch(`/api/game-state?gameStateId=${encodeURIComponent(id)}`)
			const result = await response.json()

			if (!response.ok) {
				throw new Error(result.error || 'Failed to load adventure history')
			}

			const gameStateData = result.gameState
			if (!gameStateData) {
				setError('Adventure not found')
				return
			}

			setGameState(gameStateData)

			// Create adventure summary from game state
			const adventureSummary: Adventure = {
				id: gameStateData.id,
				user_id: user?.id || null,
				session_id: gameStateData.session_id,
				story_id: gameStateData.story_id,
				title: `Adventure ${gameStateData.id.slice(-8)}`,
				status: 'active', // We could determine this based on current_node_id
				started_at: gameStateData.created_at || new Date().toISOString(),
				last_played_at: gameStateData.updated_at || gameStateData.created_at || new Date().toISOString(),
				current_node_id: gameStateData.current_node_id,
				progress_summary: gameStateData.progress_data ? {
					totalChoices: GameStateManager.getTotalChoicesMade(gameStateData.progress_data),
					scenesExplored: gameStateData.progress_data.visitedScenarios?.length || 0,
					playTime: GameStateManager.getGameplayDuration(gameStateData.progress_data)
				} : undefined
			}

			setAdventure(adventureSummary)
		} catch (err) {
			console.error('Error loading adventure history:', err)
			setError(err instanceof Error ? err.message : 'Failed to load adventure history')
		} finally {
			setLoading(false)
		}
	}, [id, user?.id])

	useEffect(() => {
		if (id && !authLoading) {
			loadAdventureHistory()
		}
	}, [id, authLoading, loadAdventureHistory])

	if (authLoading || loading) {
		return (
			<Page title="Adventure History">
				<Section>
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading adventure history...</p>
					</div>
				</Section>
			</Page>
		)
	}

	if (error || !adventure || !gameState) {
		return (
			<Page title="Adventure History">
				<Section>
					<div className="text-center">
						<div className="text-4xl mb-4">❌</div>
						<h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
							{error || 'Adventure not found'}
						</h2>
						<Link
							href="/adventures"
							className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
						>
							Back to Adventures
						</Link>
					</div>
				</Section>
			</Page>
		)
	}

	const progressData = GameStateManager.validateProgressData(gameState.progress_data) 
		? gameState.progress_data 
		: GameStateManager.migrateProgressData(gameState.progress_data)

	const formatTimestamp = (timestamp: string) => {
		return new Date(timestamp).toLocaleString()
	}

	return (
		<Page title={`${adventure.title} - History`}>
			<Section>
				<div className="max-w-4xl mx-auto">
					{/* Header */}
					<div className="mb-8">
						<div className="flex items-center gap-4 mb-4">
							<Link
								href="/adventures"
								className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
							>
								← Back to Adventures
							</Link>
						</div>
						<h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
							Adventure History
						</h1>
						<h2 className="text-xl text-zinc-600 dark:text-zinc-400">
							{adventure.title}
						</h2>
					</div>

					{/* Adventure Summary */}
					<div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
							<div className="text-center">
								<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
									{adventure.progress_summary?.totalChoices || 0}
								</div>
								<div className="text-sm text-blue-600 dark:text-blue-400">Total Choices</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-green-600 dark:text-green-400">
									{adventure.progress_summary?.scenesExplored || 0}
								</div>
								<div className="text-sm text-green-600 dark:text-green-400">Scenes Explored</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
									{adventure.progress_summary?.playTime || 0}min
								</div>
								<div className="text-sm text-purple-600 dark:text-purple-400">Play Time</div>
							</div>
							<div className="text-center">
								<div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Status</div>
								<span className={`px-2 py-1 text-xs font-medium rounded-full ${
									adventure.status === 'active' 
										? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
										: adventure.status === 'completed'
										? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
										: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
								}`}>
									{adventure.status}
								</span>
							</div>
						</div>
						<div className="text-sm text-blue-700 dark:text-blue-300">
							<p><strong>Started:</strong> {formatTimestamp(adventure.started_at)}</p>
							<p><strong>Last Played:</strong> {formatTimestamp(adventure.last_played_at)}</p>
						</div>
					</div>

					{/* Choice History */}
					<div className="mb-8">
						<h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
							Choice Timeline
						</h3>
						
						{progressData.choiceHistory && progressData.choiceHistory.length > 0 ? (
							<div className="space-y-4">
								{progressData.choiceHistory.map((choice: ChoiceRecord, index: number) => (
									<div key={index} className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800/50">
										<div className="flex items-start justify-between mb-2">
											<div className="flex items-center gap-2">
												<span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-2 py-1 rounded text-xs font-medium">
													#{index + 1}
												</span>
												<span className="text-sm text-zinc-600 dark:text-zinc-400">
													Scene: {choice.nodeId}
												</span>
											</div>
											<span className="text-xs text-zinc-500 dark:text-zinc-500">
												{formatTimestamp(choice.timestamp)}
											</span>
										</div>
										<div className="mb-2">
											<p className="text-zinc-900 dark:text-zinc-100 font-medium">
												&ldquo;{choice.choiceText}&rdquo;
											</p>
										</div>
										<div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
											<span>→</span>
											<span>Led to scene: {choice.nextNodeId}</span>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
								<div className="text-2xl mb-2">📝</div>
								<p className="text-zinc-600 dark:text-zinc-400">No choices recorded yet</p>
							</div>
						)}
					</div>

					{/* Visited Scenarios */}
					<div className="mb-8">
						<h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
							Explored Scenes
						</h3>
						
						{progressData.visitedScenarios && progressData.visitedScenarios.length > 0 ? (
							<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
								{progressData.visitedScenarios.map((nodeId: string, index: number) => (
									<div key={index} className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-center">
										<span className="text-xs text-green-800 dark:text-green-400 font-mono">
											{nodeId}
										</span>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
								<div className="text-2xl mb-2">🗺️</div>
								<p className="text-zinc-600 dark:text-zinc-400">No scenes explored yet</p>
							</div>
						)}
					</div>

					{/* Player Inventory */}
					{progressData.inventory && Object.keys(progressData.inventory).length > 0 && (
						<div className="mb-8">
							<h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
								Inventory
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{Object.entries(progressData.inventory).map(([itemId, item]) => (
									<div key={itemId} className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
										<div className="flex items-center justify-between mb-2">
											<h4 className="font-medium text-amber-800 dark:text-amber-200">
												{item.name}
											</h4>
											<span className="bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-1 rounded text-xs">
												×{item.quantity}
											</span>
										</div>
										{item.description && (
											<p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
												{item.description}
											</p>
										)}
										<p className="text-xs text-amber-600 dark:text-amber-400">
											Acquired: {formatTimestamp(item.acquiredAt)}
										</p>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Actions */}
					<div className="flex gap-4 justify-center">
						<Link
							href={`/story?adventure=${adventure.id}`}
							className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
						>
							Continue Adventure
						</Link>
						<Link
							href="/adventures/compare"
							className="px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium rounded-lg transition-colors"
						>
							Compare Adventures
						</Link>
					</div>
				</div>
			</Section>
		</Page>
	)
}