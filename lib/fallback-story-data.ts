// Fallback story data for when Supabase is not configured
// This is the original hardcoded data from the application

export interface Choice {
	id: string
	text: string
	nextNodeId: string
}

export interface StoryNode {
	id: string
	storyId: string
	title: string
	text: string
	choices: Choice[]
	isEnding?: boolean
}

export interface Story {
	id: string
	title: string
	description?: string
	isActive: boolean
}

// Available stories in fallback mode
export const fallbackStories: Record<string, Story> = {
	'mystical-forest': {
		id: 'mystical-forest',
		title: 'The Mystical Forest',
		description: 'An adventure through an enchanted forest filled with magical creatures and ancient mysteries.',
		isActive: true
	}
}

export const fallbackStoryNodes: Record<string, StoryNode> = {
	start: {
		id: 'start',
		storyId: 'mystical-forest',
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
		storyId: 'mystical-forest',
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
		storyId: 'mystical-forest',
		title: 'Ancient Knowledge',
		text: 'The symbols begin to make sense as you study them. They tell of a guardian spirit trapped within, waiting for someone brave enough to free it.\n\n[The symbols pulse with a warning energy]\n\nThe ancient script also warns of great danger that lies beyond the threshold.',
		choices: [
			{ id: 'door_open_cautious', text: 'Open the door carefully', nextNodeId: 'door_opened' },
			{ id: 'spirit_call', text: 'Call out to the spirit', nextNodeId: 'spirit_responds' },
			{ id: 'symbols_leave', text: 'Heed the warning and leave', nextNodeId: 'forest_path' },
		],
	},
	forest_path: {
		id: 'forest_path',
		storyId: 'mystical-forest',
		title: 'The Safe Path',
		text: 'You decide discretion is the better part of valor and walk back down the forest path. As you leave, you hear a faint whisper on the wind: "Another time, perhaps..." The adventure ends, but you live to tell the tale.',
		choices: [
			{ id: 'restart', text: 'Start your adventure again', nextNodeId: 'start' },
		],
		isEnding: true,
	},
	orb_touched: {
		id: 'orb_touched',
		storyId: 'mystical-forest',
		title: 'Power Awakened',
		text: 'As your fingers make contact with the orb, energy surges through your body! The crystals around you spin faster, and suddenly you understand - you have awakened an ancient magic that has been dormant for centuries. You feel incredibly powerful!',
		choices: [
			{ id: 'power_use', text: 'Embrace the power', nextNodeId: 'power_embraced' },
			{ id: 'power_resist', text: 'Try to resist the energy', nextNodeId: 'power_resisted' },
		],
	},
	crystals_studied: {
		id: 'crystals_studied',
		storyId: 'mystical-forest',
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
		storyId: 'mystical-forest',
		title: 'The Guardian Awakens',
		text: 'A soft, ethereal voice echoes from within the door.\n\nGuardian Spirit: "Mortal, you have read the ancient warnings. I am bound here by duty, but perhaps you can help me complete my purpose."\n\nThe voice grows warmer, more hopeful.\n\nGuardian Spirit: "Will you aid me in protecting this realm?"',
		choices: [
			{ id: 'spirit_help', text: 'Offer to help the spirit', nextNodeId: 'spirit_helped' },
			{ id: 'spirit_question', text: 'Ask about its purpose', nextNodeId: 'purpose_revealed' },
			{ id: 'spirit_decline', text: 'Politely decline', nextNodeId: 'forest_path' },
		],
	},
	power_embraced: {
		id: 'power_embraced',
		storyId: 'mystical-forest',
		title: 'Master of Magic',
		text: 'You embrace the ancient power flowing through you. The magic responds to your will, and you become a bridge between the mortal world and the realm of magic. Your adventure has just begun, but as a being of great power!',
		choices: [
			{ id: 'restart', text: 'Begin a new adventure', nextNodeId: 'start' },
		],
		isEnding: true,
	},
	power_resisted: {
		id: 'power_resisted',
		storyId: 'mystical-forest',
		title: 'Wise Restraint',
		text: 'You resist the overwhelming power, showing wisdom beyond your years. The energy gently recedes, and you feel the respect of ancient spirits. You leave the chamber changed, but still yourself.',
		choices: [
			{ id: 'restart', text: 'Start a new adventure', nextNodeId: 'start' },
		],
		isEnding: true,
	},
	visions_revealed: {
		id: 'visions_revealed',
		storyId: 'mystical-forest',
		title: 'Memories of the Past',
		text: 'The visions reveal the truth - this sanctuary was created to protect the world from an ancient evil. The guardian spirit has been maintaining the seal for thousands of years, growing weaker with time.',
		choices: [
			{ id: 'seal_strengthen', text: 'Help strengthen the seal', nextNodeId: 'seal_strengthened' },
			{ id: 'spirit_find', text: 'Seek out the guardian spirit', nextNodeId: 'spirit_responds' },
		],
	},
	respectful_exit: {
		id: 'respectful_exit',
		storyId: 'mystical-forest',
		title: 'Honor and Respect',
		text: 'You bow respectfully to the ancient sanctuary and leave it undisturbed. As you exit, you feel a warm presence blessing your journey. Sometimes the greatest wisdom is knowing when not to act.',
		choices: [
			{ id: 'restart', text: 'Begin another adventure', nextNodeId: 'start' },
		],
		isEnding: true,
	},
	spirit_helped: {
		id: 'spirit_helped',
		storyId: 'mystical-forest',
		title: 'A Noble Alliance',
		text: 'Together with the guardian spirit, you work to strengthen the ancient seals protecting the world. Your courage and the spirit\'s wisdom prove to be a perfect combination. You become a protector of both realms.',
		choices: [
			{ id: 'restart', text: 'Start a new story', nextNodeId: 'start' },
		],
		isEnding: true,
	},
	purpose_revealed: {
		id: 'purpose_revealed',
		storyId: 'mystical-forest',
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
		storyId: 'mystical-forest',
		title: 'Guardian\'s Gratitude',
		text: 'Your life force helps renew the ancient seals. The guardian spirit glows brighter, its duty easier to bear. "Thank you, brave soul. The world is safer because of your sacrifice and courage."',
		choices: [
			{ id: 'restart', text: 'Continue your journey', nextNodeId: 'start' },
		],
		isEnding: true,
	},
}