// Prompt templates for AI story generation

export interface StoryContext {
	currentScene?: string
	playerChoice?: string
	storyHistory?: string[]
	characterName?: string
	genre?: string
}

export const generateInitialStoryPrompt = (context: StoryContext = {}) => {
	const { characterName = 'the adventurer', genre = 'fantasy' } = context

	return `You are a creative storyteller for a text adventure game. Generate an engaging opening scene for a ${genre} adventure.

Create a response in this exact JSON format:
{
  "title": "Scene Title",
  "text": "Detailed scene description (2-3 sentences, immersive and engaging)",
  "choices": [
    {"text": "Choice 1 description", "id": "choice_1"},
    {"text": "Choice 2 description", "id": "choice_2"},
    {"text": "Choice 3 description", "id": "choice_3"}
  ]
}

Requirements:
- The scene should be immersive and atmospheric
- Provide exactly 3 meaningful choices that lead to different story paths
- Each choice should be 3-8 words long
- The text should be 2-3 sentences describing the scene
- Include sensory details (what the character sees, hears, feels)
- Create tension or intrigue to engage the player
- Keep the tone appropriate for all ages

Character: ${characterName}
Genre: ${genre}

Generate a compelling opening scene:`
}

export const generateContinuationPrompt = (context: StoryContext) => {
	const {
		currentScene = '',
		playerChoice = '',
		storyHistory = [],
		characterName = 'the adventurer',
		genre = 'fantasy'
	} = context

	const historyText = storyHistory.length > 0 
		? `\n\nStory so far:\n${storyHistory.join('\n')}`
		: ''

	return `You are continuing a ${genre} text adventure story. Based on the player's choice, generate the next scene.

Previous scene: ${currentScene}
Player chose: ${playerChoice}${historyText}

Create a response in this exact JSON format:
{
  "title": "Scene Title",
  "text": "Detailed scene description (2-3 sentences showing consequences of the choice)",
  "choices": [
    {"text": "Choice 1 description", "id": "choice_1"},
    {"text": "Choice 2 description", "id": "choice_2"},
    {"text": "Choice 3 description", "id": "choice_3"}
  ],
  "isEnding": false
}

Requirements:
- Show clear consequences of the previous choice
- Create logical story progression from the player's decision
- Provide exactly 3 meaningful choices (unless it's an ending)
- If this should be a story ending, set "isEnding" to true and provide only 1 choice to restart
- Each choice should be 3-8 words long
- The text should be 2-3 sentences
- Maintain consistency with previous story elements
- Include sensory details and maintain immersion
- Keep the tone appropriate for all ages

Character: ${characterName}
Genre: ${genre}

Generate the next scene:`
}

export const generateEndingPrompt = (context: StoryContext) => {
	const {
		currentScene = '',
		playerChoice = '',
		storyHistory = [],
		characterName = 'the adventurer',
		genre = 'fantasy'
	} = context

	const historyText = storyHistory.length > 0 
		? `\n\nComplete story:\n${storyHistory.join('\n')}`
		: ''

	return `You are concluding a ${genre} text adventure story. Create a satisfying ending based on the player's journey.

Previous scene: ${currentScene}
Player chose: ${playerChoice}${historyText}

Create a response in this exact JSON format:
{
  "title": "Conclusion Title",
  "text": "Satisfying conclusion that wraps up the story (2-3 sentences)",
  "choices": [
    {"text": "Start a new adventure", "id": "restart"}
  ],
  "isEnding": true
}

Requirements:
- Provide a satisfying conclusion that feels complete
- Show the consequences of the player's choices throughout the story
- The text should be 2-3 sentences that wrap up the adventure
- Always include exactly one choice to restart
- Maintain consistency with the story's tone and themes
- Make the ending feel earned based on the player's decisions

Character: ${characterName}
Genre: ${genre}

Generate a satisfying conclusion:`
}