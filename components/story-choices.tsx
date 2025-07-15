import { useState, useEffect } from 'react'

interface Choice {
  id: string
  text: string
  next_node_id: string
}

interface StoryChoicesProps {
  choices: Choice[]
  onChoiceSelect: (nextNodeId: string, choiceId: string, choiceText: string) => void
  enableAnimations?: boolean
  className?: string
}

interface ChoiceButtonProps {
  choice: Choice
  index: number
  onSelect: () => void
  enableAnimations: boolean
}

const ChoiceButton = ({ choice, index, onSelect, enableAnimations }: ChoiceButtonProps) => {
  const [isVisible, setIsVisible] = useState(!enableAnimations)
  const [isClicked, setIsClicked] = useState(false)

  useEffect(() => {
    if (enableAnimations) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, (index + 1) * 150) // Stagger choice appearance

      return () => clearTimeout(timer)
    }
  }, [enableAnimations, index])

  const handleClick = () => {
    setIsClicked(true)
    // Call the onSelect immediately
    onSelect()
  }

  return (
    <button
      onClick={handleClick}
      disabled={isClicked}
      className={`
        story-choice choice-appear
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
        ${isClicked ? 'opacity-50 pointer-events-none' : ''}
        transition-all duration-300
      `}
      style={{ 
        transitionDelay: enableAnimations ? `${index * 150}ms` : '0ms' 
      }}
    >
      <span className="story-choice-text">
        <span className="story-choice-arrow">→</span>
        {choice.text}
      </span>
    </button>
  )
}

export default function StoryChoices({ 
  choices, 
  onChoiceSelect, 
  enableAnimations = true, 
  className = '' 
}: StoryChoicesProps) {
  const [showChoices, setShowChoices] = useState(!enableAnimations)

  useEffect(() => {
    if (enableAnimations) {
      const timer = setTimeout(() => {
        setShowChoices(true)
      }, 800) // Show choices after story content has appeared

      return () => clearTimeout(timer)
    }
  }, [enableAnimations])

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className={`text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4 transition-all duration-500 ${
        showChoices ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}>
        What do you do?
      </h3>
      
      <div className="space-y-3">
        {choices.map((choice, index) => (
          <ChoiceButton
            key={choice.id}
            choice={choice}
            index={index}
            onSelect={() => onChoiceSelect(choice.next_node_id, choice.id, choice.text)}
            enableAnimations={enableAnimations && showChoices}
          />
        ))}
      </div>
    </div>
  )
}