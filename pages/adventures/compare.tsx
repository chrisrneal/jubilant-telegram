import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Page from '@/components/page'
import Section from '@/components/section'
import { Adventure, GameState, ChoiceRecord } from '@/lib/supabase'
import { GameStateManager } from '@/lib/game-state-manager'
import { StoryService } from '@/lib/story-service'
import { useAuth } from '@/lib/auth-context'

export default function AdventureComparePage() {
	const [adventures, setAdventures] = useState<Adventure[]>([])
	const [selectedAdventures, setSelectedAdventures] = useState<string[]>([])
	const [comparisonData, setComparisonData] = useState<{[adventureId: string]: GameState}>({})
	const [loading, setLoading] = useState(true)
	const [loadingComparison, setLoadingComparison] = useState(false)
	const [error, setError] = useState<string | null>(null)
	
	const { user, isAuthenticated, loading: authLoading } = useAuth()

	const loadAdventures = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)

			const params = new URLSearchParams()
			if (isAuthenticated && user) {
				params.append('userId', user.id)
			} else {
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

	const loadComparisonData = useCallback(async () => {
		try {
			setLoadingComparison(true)
			const data: {[adventureId: string]: GameState} = {}

			for (const adventureId of selectedAdventures) {
				const response = await fetch(`/api/game-state?gameStateId=${encodeURIComponent(adventureId)}`)
				const result = await response.json()
				
				if (response.ok && result.gameState) {
					data[adventureId] = result.gameState
				}
			}

			setComparisonData(data)
		} catch (err) {
			console.error('Error loading comparison data:', err)
		} finally {
			setLoadingComparison(false)
		}
	}, [selectedAdventures])

	useEffect(() => {
		if (!authLoading) {
			loadAdventures()
		}
	}, [authLoading, loadAdventures])

	useEffect(() => {
		if (selectedAdventures.length > 0) {
			loadComparisonData()
		}
	}, [selectedAdventures, loadComparisonData])

	const toggleAdventureSelection = (adventureId: string) => {
		setSelectedAdventures(prev => {
			if (prev.includes(adventureId)) {
				return prev.filter(id => id !== adventureId)
			} else if (prev.length < 3) { // Limit to 3 adventures for comparison
				return [...prev, adventureId]
			}
			return prev
		})
	}

	const getProgressData = (adventureId: string) => {
		const gameState = comparisonData[adventureId]
		if (!gameState) return null
		
		return GameStateManager.validateProgressData(gameState.progress_data) 
			? gameState.progress_data 
			: GameStateManager.migrateProgressData(gameState.progress_data)
	}

	const formatTimestamp = (timestamp: string) => {
		return new Date(timestamp).toLocaleDateString()
	}

	if (authLoading || loading) {
		return (
			<Page title="Compare Adventures">
				<Section>
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading adventures...</p>
					</div>
				</Section>
			</Page>
		)
	}

	return (
		<Page title="Compare Adventures">
			<Section>
				<div className="max-w-7xl mx-auto">
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
							Compare Adventures
						</h1>
						<p className="text-zinc-600 dark:text-zinc-400">
							Select up to 3 adventures to compare their progress and choices.
						</p>
					</div>

					{/* Error Display */}
					{error && (
						<div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
							<p className="text-red-800 dark:text-red-200">{error}</p>
						</div>
					)}

					{/* Adventure Selection */}
					<div className="mb-8">
						<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
							Select Adventures to Compare
						</h2>
						
						{adventures.length === 0 ? (
							<div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
								<div className="text-4xl mb-4">📚</div>
								<h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
									No adventures to compare
								</h3>
								<p className="text-zinc-600 dark:text-zinc-400 mb-4">
									You need at least 2 adventures to use the comparison feature.
								</p>
								<Link 
									href="/adventures"
									className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
								>
									Start More Adventures
								</Link>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{adventures.map(adventure => (
									<div 
										key={adventure.id}
										className={`p-4 border rounded-lg cursor-pointer transition-all ${
											selectedAdventures.includes(adventure.id)
												? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
												: 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
										}`}
										onClick={() => toggleAdventureSelection(adventure.id)}
									>
										<div className="flex items-start justify-between mb-2">
											<h3 className="font-medium text-zinc-900 dark:text-zinc-100">
												{adventure.title}
											</h3>
											<input
												type="checkbox"
												checked={selectedAdventures.includes(adventure.id)}
												onChange={() => {}} // Handled by div onClick
												className="rounded"
											/>
										</div>
										<p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
											Started {formatTimestamp(adventure.started_at)}
										</p>
										<div className="grid grid-cols-3 gap-2 text-xs">
											<div className="text-center">
												<div className="font-semibold text-blue-600 dark:text-blue-400">
													{adventure.progress_summary?.totalChoices || 0}
												</div>
												<div className="text-zinc-600 dark:text-zinc-400">Choices</div>
											</div>
											<div className="text-center">
												<div className="font-semibold text-green-600 dark:text-green-400">
													{adventure.progress_summary?.scenesExplored || 0}
												</div>
												<div className="text-zinc-600 dark:text-zinc-400">Scenes</div>
											</div>
											<div className="text-center">
												<div className="font-semibold text-purple-600 dark:text-purple-400">
													{adventure.progress_summary?.playTime || 0}m
												</div>
												<div className="text-zinc-600 dark:text-zinc-400">Time</div>
											</div>
										</div>
									</div>
								))}
							</div>
						)}

						{selectedAdventures.length > 0 && (
							<div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
								<p className="text-sm text-blue-800 dark:text-blue-200">
									{selectedAdventures.length} adventure{selectedAdventures.length > 1 ? 's' : ''} selected for comparison
									{selectedAdventures.length >= 3 && ' (maximum reached)'}
								</p>
							</div>
						)}
					</div>

					{/* Comparison Results */}
					{selectedAdventures.length >= 2 && (
						<div className="mb-8">
							<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
								Comparison Results
							</h2>

							{loadingComparison ? (
								<div className="text-center py-8">
									<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
									<p className="mt-2 text-zinc-600 dark:text-zinc-400">Loading comparison data...</p>
								</div>
							) : (
								<div className="space-y-8">
									{/* Summary Comparison */}
									<div className="overflow-x-auto">
										<table className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg">
											<thead className="bg-zinc-50 dark:bg-zinc-800">
												<tr>
													<th className="px-4 py-3 text-left text-sm font-medium text-zinc-900 dark:text-zinc-100">
														Adventure
													</th>
													<th className="px-4 py-3 text-center text-sm font-medium text-zinc-900 dark:text-zinc-100">
														Choices Made
													</th>
													<th className="px-4 py-3 text-center text-sm font-medium text-zinc-900 dark:text-zinc-100">
														Scenes Explored
													</th>
													<th className="px-4 py-3 text-center text-sm font-medium text-zinc-900 dark:text-zinc-100">
														Play Time
													</th>
													<th className="px-4 py-3 text-center text-sm font-medium text-zinc-900 dark:text-zinc-100">
														Status
													</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
												{selectedAdventures.map(adventureId => {
													const adventure = adventures.find(a => a.id === adventureId)
													const progressData = getProgressData(adventureId)
													
													return adventure ? (
														<tr key={adventureId} className="bg-white dark:bg-zinc-800">
															<td className="px-4 py-3">
																<div>
																	<div className="font-medium text-zinc-900 dark:text-zinc-100">
																		{adventure.title}
																	</div>
																	<div className="text-sm text-zinc-600 dark:text-zinc-400">
																		{formatTimestamp(adventure.started_at)}
																	</div>
																</div>
															</td>
															<td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400 font-medium">
																{progressData ? GameStateManager.getTotalChoicesMade(progressData) : 0}
															</td>
															<td className="px-4 py-3 text-center text-green-600 dark:text-green-400 font-medium">
																{progressData?.visitedScenarios?.length || 0}
															</td>
															<td className="px-4 py-3 text-center text-purple-600 dark:text-purple-400 font-medium">
																{progressData ? GameStateManager.getGameplayDuration(progressData) : 0}min
															</td>
															<td className="px-4 py-3 text-center">
																<span className={`px-2 py-1 text-xs font-medium rounded-full ${
																	adventure.status === 'active' 
																		? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
																		: adventure.status === 'completed'
																		? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
																		: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
																}`}>
																	{adventure.status}
																</span>
															</td>
														</tr>
													) : null
												})}
											</tbody>
										</table>
									</div>

									{/* Choice Path Comparison */}
									<div>
										<h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
											Choice Paths
										</h3>
										<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
											{selectedAdventures.map(adventureId => {
												const adventure = adventures.find(a => a.id === adventureId)
												const progressData = getProgressData(adventureId)
												
												return adventure && progressData ? (
													<div key={adventureId} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
														<h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-3">
															{adventure.title}
														</h4>
														<div className="space-y-2 max-h-64 overflow-y-auto">
															{progressData.choiceHistory && progressData.choiceHistory.length > 0 ? (
																progressData.choiceHistory.map((choice: ChoiceRecord, index: number) => (
																	<div key={index} className="text-sm p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
																		<div className="font-medium text-zinc-900 dark:text-zinc-100 text-xs mb-1">
																			#{index + 1}: {choice.nodeId}
																		</div>
																		<div className="text-zinc-700 dark:text-zinc-300">
																			&ldquo;{choice.choiceText}&rdquo;
																		</div>
																	</div>
																))
															) : (
																<p className="text-zinc-600 dark:text-zinc-400 text-sm">No choices recorded</p>
															)}
														</div>
													</div>
												) : null
											})}
										</div>
									</div>
								</div>
							)}
						</div>
					)}

					{selectedAdventures.length < 2 && adventures.length > 1 && (
						<div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
							<div className="text-4xl mb-4">🔀</div>
							<h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
								Select Adventures to Compare
							</h3>
							<p className="text-zinc-600 dark:text-zinc-400">
								Choose at least 2 adventures above to see their comparison.
							</p>
						</div>
					)}
				</div>
			</Section>
		</Page>
	)
}