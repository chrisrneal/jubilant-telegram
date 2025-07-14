import { useState, useEffect } from 'react'

interface AnimationControlsProps {
  onAnimationToggle: (enabled: boolean) => void
  className?: string
}

export default function AnimationControls({ onAnimationToggle, className = '' }: AnimationControlsProps) {
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [userPreferencesMotion, setUserPreferencesMotion] = useState(true)

  useEffect(() => {
    // Check system preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    // Check localStorage for user preference
    const savedPreference = localStorage.getItem('story-animations-enabled')
    
    let shouldEnableAnimations = true
    
    if (prefersReducedMotion) {
      shouldEnableAnimations = false
      setUserPreferencesMotion(false)
    } else if (savedPreference !== null) {
      shouldEnableAnimations = JSON.parse(savedPreference)
    }
    
    setAnimationsEnabled(shouldEnableAnimations)
    onAnimationToggle(shouldEnableAnimations)
    
    // Apply the motion class to body
    document.body.classList.toggle('motion-reduced', !shouldEnableAnimations)
  }, [onAnimationToggle])

  const handleToggle = () => {
    const newValue = !animationsEnabled
    setAnimationsEnabled(newValue)
    onAnimationToggle(newValue)
    
    // Save preference to localStorage
    localStorage.setItem('story-animations-enabled', JSON.stringify(newValue))
    
    // Apply the motion class to body
    document.body.classList.toggle('motion-reduced', !newValue)
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <label className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
        <input
          type="checkbox"
          checked={animationsEnabled}
          onChange={handleToggle}
          className="rounded border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
        />
        <span>Enable animations</span>
      </label>
      
      {!userPreferencesMotion && (
        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          System prefers reduced motion
        </span>
      )}
    </div>
  )
}