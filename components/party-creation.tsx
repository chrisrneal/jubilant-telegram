import { useState } from 'react'
import { PartyMember, PartyMemberClass, PartyConfiguration } from '@/lib/supabase'
import { GameStateManager } from '@/lib/game-state-manager'

interface PartyCreationProps {
	onPartyCreated: (party: PartyConfiguration) => void
	onCancel: () => void
	maxPartySize?: number
}

export default function PartyCreation({ 
	onPartyCreated, 
	onCancel, 
	maxPartySize = 4 
}: PartyCreationProps) {
	const [partyMembers, setPartyMembers] = useState<PartyMember[]>([])
	const [editingMember, setEditingMember] = useState<{
		name: string
		classId: string
		index?: number
	} | null>(null)
	const [validationErrors, setValidationErrors] = useState<string[]>([])
	const [isCreating, setIsCreating] = useState(false)

	const availableClasses = GameStateManager.getAvailablePartyClasses()

	const handleAddMember = () => {
		if (partyMembers.length >= maxPartySize) {
			setValidationErrors([`Cannot exceed ${maxPartySize} party members`])
			return
		}
		
		setEditingMember({
			name: '',
			classId: availableClasses[0]?.id || 'barbarian'
		})
		setValidationErrors([])
	}

	const handleEditMember = (index: number) => {
		const member = partyMembers[index]
		setEditingMember({
			name: member.name,
			classId: member.class.id,
			index
		})
		setValidationErrors([])
	}

	const handleSaveMember = () => {
		if (!editingMember) return

		const { name, classId, index } = editingMember
		
		if (!name.trim()) {
			setValidationErrors(['Member name is required'])
			return
		}

		// Check for duplicate names (excluding current member being edited)
		const existingNames = partyMembers
			.filter((_, i) => i !== index)
			.map(m => m.name.toLowerCase())
		
		if (existingNames.includes(name.toLowerCase())) {
			setValidationErrors(['A party member with this name already exists'])
			return
		}

		const newMember = GameStateManager.createPartyMember(name, classId)
		if (!newMember) {
			setValidationErrors(['Invalid class selected'])
			return
		}

		const updatedMembers = [...partyMembers]
		if (typeof index === 'number') {
			// Edit existing member
			updatedMembers[index] = newMember
		} else {
			// Add new member
			updatedMembers.push(newMember)
		}

		setPartyMembers(updatedMembers)
		setEditingMember(null)
		setValidationErrors([])
	}

	const handleRemoveMember = (index: number) => {
		const updatedMembers = partyMembers.filter((_, i) => i !== index)
		setPartyMembers(updatedMembers)
		setValidationErrors([])
	}

	const handleCreateParty = async () => {
		if (partyMembers.length === 0) {
			setValidationErrors(['Party must have at least one member'])
			return
		}

		setIsCreating(true)
		try {
			const party = GameStateManager.createPartyConfiguration(partyMembers)
			const validation = GameStateManager.validatePartyConfiguration(party)
			
			if (!validation.isValid) {
				setValidationErrors(validation.errors)
				return
			}

			onPartyCreated(party)
		} catch (error) {
			console.error('Error creating party:', error)
			setValidationErrors(['Failed to create party. Please try again.'])
		} finally {
			setIsCreating(false)
		}
	}

	const getClassById = (classId: string): PartyMemberClass | undefined => {
		return availableClasses.find(c => c.id === classId)
	}

	return (
		<div className="max-w-4xl mx-auto">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
					Create Your Party
				</h1>
				<p className="text-zinc-600 dark:text-zinc-400">
					Assemble your adventuring party before beginning your quest. 
					Choose your party members wisely - each class has unique abilities and strengths.
				</p>
			</div>

			{/* Validation Errors */}
			{validationErrors.length > 0 && (
				<div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
					<h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
						Please fix the following issues:
					</h4>
					<ul className="text-sm text-red-600 dark:text-red-300 list-disc list-inside space-y-1">
						{validationErrors.map((error, index) => (
							<li key={index}>{error}</li>
						))}
					</ul>
				</div>
			)}

			{/* Party Members List */}
			<div className="mb-8">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
						Party Members ({partyMembers.length}/{maxPartySize})
					</h2>
					<button
						onClick={handleAddMember}
						disabled={partyMembers.length >= maxPartySize}
						className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
					>
						Add Member
					</button>
				</div>

				{partyMembers.length === 0 ? (
					<div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
						<div className="text-4xl mb-4">👥</div>
						<h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
							No party members yet
						</h3>
						<p className="text-zinc-600 dark:text-zinc-400">
							Click &quot;Add Member&quot; to start building your party.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{partyMembers.map((member, index) => (
							<div key={member.id} className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
								<div className="flex items-start justify-between mb-3">
									<div>
										<h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
											{member.name}
										</h3>
										<p className="text-sm text-zinc-600 dark:text-zinc-400">
											{member.class.name} (Level {member.level})
										</p>
									</div>
									<div className="flex gap-2">
										<button
											onClick={() => handleEditMember(index)}
											className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
										>
											Edit
										</button>
										<button
											onClick={() => handleRemoveMember(index)}
											className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
										>
											Remove
										</button>
									</div>
								</div>
								
								<p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
									{member.class.description}
								</p>
								
								<div className="flex flex-wrap gap-1">
									{member.class.abilities.map((ability, abilityIndex) => (
										<span 
											key={abilityIndex}
											className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
										>
											{ability}
										</span>
									))}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Member Creation/Edit Modal */}
			{editingMember && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-full max-w-md">
						<h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
							{typeof editingMember.index === 'number' ? 'Edit' : 'Add'} Party Member
						</h3>
						
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
									Name
								</label>
								<input
									type="text"
									value={editingMember.name}
									onChange={(e) => setEditingMember({
										...editingMember,
										name: e.target.value
									})}
									className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
									placeholder="Enter member name"
									maxLength={30}
								/>
							</div>
							
							<div>
								<label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
									Class
								</label>
								<select
									value={editingMember.classId}
									onChange={(e) => setEditingMember({
										...editingMember,
										classId: e.target.value
									})}
									className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
								>
									{availableClasses.map((cls) => (
										<option key={cls.id} value={cls.id}>
											{cls.name}
										</option>
									))}
								</select>
								
								{(() => {
									const selectedClass = getClassById(editingMember.classId)
									return selectedClass ? (
										<div className="mt-2 p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded border">
											<p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
												{selectedClass.description}
											</p>
											<div className="flex flex-wrap gap-1">
												{selectedClass.abilities.map((ability, index) => (
													<span 
														key={index}
														className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
													>
														{ability}
													</span>
												))}
											</div>
										</div>
									) : null
								})()}
							</div>
						</div>
						
						<div className="flex gap-3 mt-6">
							<button
								onClick={handleSaveMember}
								className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
							>
								{typeof editingMember.index === 'number' ? 'Update' : 'Add'} Member
							</button>
							<button
								onClick={() => {
									setEditingMember(null)
									setValidationErrors([])
								}}
								className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium rounded-lg transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Actions */}
			<div className="flex gap-4 justify-end">
				<button
					onClick={onCancel}
					className="px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium rounded-lg transition-colors"
				>
					Cancel
				</button>
				<button
					onClick={handleCreateParty}
					disabled={partyMembers.length === 0 || isCreating}
					className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors"
				>
					{isCreating ? 'Creating Party...' : 'Start Adventure'}
				</button>
			</div>
		</div>
	)
}