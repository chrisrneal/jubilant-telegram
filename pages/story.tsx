import { useState } from 'react'
import Page from '@/components/page'
import Section from '@/components/section'

// Game state interfaces
interface Choice {
	id: string
	text: string
	nextNodeId: string
}

interface StoryNode {
	id: string
	title: string
	text: string
	choices: Choice[]
	isEnding?: boolean
}

// Sample story data
const storyNodes: Record<string, StoryNode> = {
	start: {
		id: 'start',
		title: 'The Mysterious Door',
		text: 'You find yourself standing before an ancient wooden door deep in a forgotten forest. Strange symbols glow faintly on its surface, and you can hear a low humming sound coming from behind it. The air feels charged with magic.',
		choices: [
			{ id: 'door_open', text: 'Push open the door', nextNodeId: 'door_opened' },
			{ id: 'door_examine', text: 'Examine the symbols closely', nextNodeId: 'symbols_examined' },
			{ id: 'door_leave', text: 'Turn around and leave', nextNodeId: 'forest_path' },
		],
	},
	door_opened: {
		id: 'door_opened',
		title: 'The Crystal Chamber',
		text: 'The door creaks open to reveal a magnificent chamber filled with floating crystals that pulse with inner light. In the center stands a pedestal holding a glowing orb. The humming grows louder.',
		choices: [
			{ id: 'orb_touch', text: 'Touch the glowing orb', nextNodeId: 'orb_touched' },
			{ id: 'crystals_examine', text: 'Study the floating crystals', nextNodeId: 'crystals_studied' },
			{ id: 'chamber_retreat', text: 'Back away slowly', nextNodeId: 'start' },
		],
	},
	symbols_examined: {
		id: 'symbols_examined',
		title: 'Ancient Knowledge',
		text: 'The symbols begin to make sense as you study them. They tell of a guardian spirit trapped within, waiting for someone brave enough to free it. The symbols also warn of great danger.',
		choices: [
			{ id: 'door_open_cautious', text: 'Open the door carefully', nextNodeId: 'door_opened' },
			{ id: 'spirit_call', text: 'Call out to the spirit', nextNodeId: 'spirit_responds' },
			{ id: 'symbols_leave', text: 'Heed the warning and leave', nextNodeId: 'forest_path' },
		],
	},
	forest_path: {
		id: 'forest_path',
		title: 'The Safe Path',
		text: 'You decide discretion is the better part of valor and walk back down the forest path. As you leave, you hear a faint whisper on the wind: "Another time, perhaps..." The adventure ends, but you live to tell the tale.',
		choices: [
			{ id: 'restart', text: 'Start your adventure again', nextNodeId: 'start' },
		],
		isEnding: true,
	},
	orb_touched: {
		id: 'orb_touched',
		title: 'Power Awakened',
		text: 'As your fingers make contact with the orb, energy surges through your body! The crystals around you spin faster, and suddenly you understand - you have awakened an ancient magic that has been dormant for centuries. You feel incredibly powerful!',
		choices: [
			{ id: 'power_use', text: 'Embrace the power', nextNodeId: 'power_embraced' },
			{ id: 'power_resist', text: 'Try to resist the energy', nextNodeId: 'power_resisted' },
		],
	},
	crystals_studied: {
		id: 'crystals_studied',
		title: 'Hidden Knowledge',
		text: 'The crystals contain ancient memories. As you focus on them, visions flash before your eyes - this was once a sanctuary for magical beings. The orb is a key to their realm.',
		choices: [
			{ id: 'realm_enter', text: 'Use the orb as a key', nextNodeId: 'orb_touched' },
			{ id: 'visions_explore', text: 'Focus on the visions', nextNodeId: 'visions_revealed' },
			{ id: 'sanctuary_respect', text: 'Leave the sanctuary undisturbed', nextNodeId: 'respectful_exit' },
		],
	},
	spirit_responds: {
		id: 'spirit_responds',
		title: 'The Guardian Awakens',
		text: 'A ethereal voice responds to your call: "Mortal, you have read the ancient warnings. I am bound here by duty, but perhaps you can help me complete my purpose. Will you aid me?"',
		choices: [
			{ id: 'spirit_help', text: 'Offer to help the spirit', nextNodeId: 'spirit_helped' },
			{ id: 'spirit_question', text: 'Ask about its purpose', nextNodeId: 'purpose_revealed' },
			{ id: 'spirit_decline', text: 'Politely decline', nextNodeId: 'forest_path' },
		],
	},
	power_embraced: {
		id: 'power_embraced',
		title: 'Master of Magic',
		text: 'You embrace the ancient power flowing through you. The magic responds to your will, and you become a bridge between the mortal world and the realm of magic. Your adventure has just begun, but as a being of great power!',
		choices: [
			{ id: 'restart', text: 'Begin a new adventure', nextNodeId: 'start' },
		],
		isEnding: true,
	},
	power_resisted: {
		id: 'power_resisted',
		title: 'Wise Restraint',
		text: 'You resist the overwhelming power, showing wisdom beyond your years. The energy gently recedes, and you feel the respect of ancient spirits. You leave the chamber changed, but still yourself.',
		choices: [
			{ id: 'restart', text: 'Start a new adventure', nextNodeId: 'start' },
		],
		isEnding: true,
	},
	visions_revealed: {
		id: 'visions_revealed',
		title: 'Memories of the Past',
		text: 'The visions reveal the truth - this sanctuary was created to protect the world from an ancient evil. The guardian spirit has been maintaining the seal for thousands of years, growing weaker with time.',
		choices: [
			{ id: 'seal_strengthen', text: 'Help strengthen the seal', nextNodeId: 'seal_strengthened' },
			{ id: 'spirit_find', text: 'Seek out the guardian spirit', nextNodeId: 'spirit_responds' },
		],
	},
	respectful_exit: {
		id: 'respectful_exit',
		title: 'Honor and Respect',
		text: 'You bow respectfully to the ancient sanctuary and leave it undisturbed. As you exit, you feel a warm presence blessing your journey. Sometimes the greatest wisdom is knowing when not to act.',
		choices: [
			{ id: 'restart', text: 'Begin another adventure', nextNodeId: 'start' },
		],
		isEnding: true,
	},
	spirit_helped: {
		id: 'spirit_helped',
		title: 'A Noble Alliance',
		text: 'Together with the guardian spirit, you work to strengthen the ancient seals protecting the world. Your courage and the spirit\'s wisdom prove to be a perfect combination. You become a protector of both realms.',
		choices: [
			{ id: 'restart', text: 'Start a new story', nextNodeId: 'start' },
		],
		isEnding: true,
	},
	purpose_revealed: {
		id: 'purpose_revealed',
		title: 'The Guardian\'s Duty',
		text: 'The spirit explains its sacred duty to guard the boundary between worlds. "Dark forces seek to break through," it warns. "I grow weak, and need someone to carry on my work or help me renew my strength."',
		choices: [
			{ id: 'duty_accept', text: 'Accept the sacred duty', nextNodeId: 'spirit_helped' },
			{ id: 'strength_offer', text: 'Offer your strength', nextNodeId: 'seal_strengthened' },
			{ id: 'duty_decline', text: 'Admit you\'re not ready', nextNodeId: 'forest_path' },
		],
	},
	seal_strengthened: {
		id: 'seal_strengthened',
		title: 'Guardian\'s Gratitude',
		text: 'Your life force helps renew the ancient seals. The guardian spirit glows brighter, its duty easier to bear. "Thank you, brave soul. The world is safer because of your sacrifice and courage."',
		choices: [
			{ id: 'restart', text: 'Continue your journey', nextNodeId: 'start' },
		],
		isEnding: true,
	},
}

export default function StoryPage() {
	const [currentNodeId, setCurrentNodeId] = useState('start')
	const currentNode = storyNodes[currentNodeId]

	const handleChoice = (nextNodeId: string) => {
		setCurrentNodeId(nextNodeId)
	}

	if (!currentNode) {
		return (
			<Page title="Adventure">
				<Section>
					<div className="text-center">
						<h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
							Error: Story node not found
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
								onClick={() => handleChoice(choice.nextNodeId)}
								className="w-full text-left p-4 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors duration-200 border border-zinc-300 dark:border-zinc-600"
							>
								<span className="text-zinc-800 dark:text-zinc-200 font-medium">
									→ {choice.text}
								</span>
							</button>
						))}
					</div>

					{/* Ending indicator */}
					{currentNode.isEnding && (
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
					</div>
				</div>
			</Section>
		</Page>
	)
}
