import { useState, useEffect } from 'react'
import { parseStoryText, consolidateNarrative, ParsedStoryContent } from '@/lib/story-text-parser'

interface StoryContentProps {
  title: string
  text: string
  enableAnimations?: boolean
  className?: string
}

interface StoryContentItemProps {
  item: ParsedStoryContent
  index: number
  enableAnimations: boolean
}

const StoryContentItem = ({ item, index, enableAnimations }: StoryContentItemProps) => {
  const [isVisible, setIsVisible] = useState(!enableAnimations)

  useEffect(() => {
    if (enableAnimations) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, index * 200) // Stagger the appearance of content items

      return () => clearTimeout(timer)
    }
  }, [enableAnimations, index])

  const baseClasses = `transition-all duration-500 ${
    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
  }`

  switch (item.type) {
    case 'dialogue':
      return (
        <div className={`story-dialogue-container ${baseClasses}`}>
          <div className="story-character-name">{item.characterName}</div>
          <div className="story-dialogue-text">&ldquo;{item.content}&rdquo;</div>
        </div>
      )
    
    case 'system':
      return (
        <div className={`story-system-message ${baseClasses}`}>
          {item.content}
        </div>
      )
    
    case 'narrative':
    default:
      return (
        <p className={`story-narrative ${baseClasses}`}>
          {item.content}
        </p>
      )
  }
}

export default function StoryContent({ 
  title, 
  text, 
  enableAnimations = true, 
  className = '' 
}: StoryContentProps) {
  const [showContent, setShowContent] = useState(!enableAnimations)
  const [showTitle, setShowTitle] = useState(!enableAnimations)

  useEffect(() => {
    if (enableAnimations) {
      // Show title first
      const titleTimer = setTimeout(() => {
        setShowTitle(true)
      }, 100)

      // Then show content
      const contentTimer = setTimeout(() => {
        setShowContent(true)
      }, 300)

      return () => {
        clearTimeout(titleTimer)
        clearTimeout(contentTimer)
      }
    }
  }, [enableAnimations])

  const parsedContent = consolidateNarrative(parseStoryText(text))

  return (
    <div className={`story-content-card ${className}`}>
      {/* Story Title with animation */}
      <h2 className={`text-2xl font-bold text-zinc-800 dark:text-zinc-200 mb-6 transition-all duration-700 ${
        showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        {title}
      </h2>

      {/* Story Content */}
      <div className={`space-y-4 transition-all duration-500 ${
        showContent ? 'opacity-100' : 'opacity-0'
      }`}>
        {parsedContent.map((item, index) => (
          <StoryContentItem
            key={index}
            item={item}
            index={index}
            enableAnimations={enableAnimations && showContent}
          />
        ))}
      </div>
    </div>
  )
}