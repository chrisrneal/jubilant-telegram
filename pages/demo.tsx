import { useState } from 'react'
import Page from '@/components/page'
import Section from '@/components/section'
import StoryContent from '@/components/story-content'
import StoryChoices from '@/components/story-choices'
import AnimationControls from '@/components/animation-controls'

export default function StyleDemo() {
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [currentDemo, setCurrentDemo] = useState(0)

  const demoContent = [
    {
      title: 'Narrative Text Demo',
      text: 'You find yourself in a mysterious library filled with ancient tomes. The air is thick with the scent of old parchment and forgotten knowledge. Dust motes dance in the shafts of sunlight streaming through tall windows.',
      choices: [
        { id: '1', text: 'Examine the ancient books', next_node_id: 'next' },
        { id: '2', text: 'Look out the window', next_node_id: 'next' },
      ]
    },
    {
      title: 'Character Dialogue Demo',
      text: 'As you approach the desk, an elderly librarian looks up from her work.\n\nLibrarian: "Welcome, traveler. I sense you seek knowledge beyond the ordinary."\n\nShe gestures toward the restricted section.\n\nLibrarian: "Few are permitted to enter those hallowed halls. What brings you to my domain?"',
      choices: [
        { id: '1', text: 'Ask about the restricted books', next_node_id: 'next' },
        { id: '2', text: 'Inquire about magical texts', next_node_id: 'next' },
      ]
    },
    {
      title: 'Mixed Content Demo',
      text: 'You venture deeper into the library\'s depths.\n\n[The temperature drops noticeably as you proceed]\n\nA ghostly figure materializes before you.\n\nSpirit Scholar: "Turn back, living one. Some knowledge is too dangerous for mortal minds."\n\nThe spirit\'s eyes glow with ancient wisdom and warning.',
      choices: [
        { id: '1', text: 'Challenge the spirit', next_node_id: 'next' },
        { id: '2', text: 'Ask for guidance', next_node_id: 'next' },
        { id: '3', text: 'Respectfully retreat', next_node_id: 'next' },
      ]
    }
  ]

  const handleChoiceSelect = (nextNodeId: string, choiceId: string, choiceText: string) => {
    // Just advance to next demo
    setCurrentDemo((prev) => (prev + 1) % demoContent.length)
  }

  const currentContent = demoContent[currentDemo]

  return (
    <Page title="Style Demo">
      <Section>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h2 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-2">
              UI/UX Style Demonstration
            </h2>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This demo showcases the enhanced story styling features: narrative text, character dialogue, 
              system messages, and interactive animations.
            </p>
          </div>

          {/* Animation Controls */}
          <div className="mb-6">
            <AnimationControls
              onAnimationToggle={setAnimationsEnabled}
              className="justify-end"
            />
          </div>

          {/* Demo Navigation */}
          <div className="mb-6 flex justify-center space-x-2">
            {demoContent.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentDemo(index)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  index === currentDemo
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                }`}
              >
                Demo {index + 1}
              </button>
            ))}
          </div>

          {/* Story Content */}
          <StoryContent
            key={`demo-${currentDemo}`}
            title={currentContent.title}
            text={currentContent.text}
            enableAnimations={animationsEnabled}
          />

          {/* Choices */}
          <StoryChoices
            key={`choices-${currentDemo}`}
            choices={currentContent.choices}
            onChoiceSelect={handleChoiceSelect}
            enableAnimations={animationsEnabled}
          />

          {/* Style Guide */}
          <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
              Style Features Demonstrated
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <h4 className="font-medium text-zinc-800 dark:text-zinc-200 mb-2">
                  Typography & Layout
                </h4>
                <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                  <li>• Narrative text with serif fonts</li>
                  <li>• Character dialogue with speech formatting</li>
                  <li>• System messages in highlighted boxes</li>
                  <li>• Enhanced story content cards</li>
                </ul>
              </div>
              
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <h4 className="font-medium text-zinc-800 dark:text-zinc-200 mb-2">
                  Animations & Interactions
                </h4>
                <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                  <li>• Staggered content fade-in effects</li>
                  <li>• Animated choice button appearances</li>
                  <li>• Hover effects and micro-interactions</li>
                  <li>• Accessibility motion controls</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </Page>
  )
}