// Utility for parsing and rendering different types of story content

export interface ParsedStoryContent {
  type: 'narrative' | 'dialogue' | 'system'
  content: string
  characterName?: string
}

/**
 * Parses story text to identify different content types
 * Supports formats like:
 * - Regular narrative text
 * - "Character Name: dialogue text" 
 * - [System message or special formatting]
 */
export function parseStoryText(text: string): ParsedStoryContent[] {
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  const parsedContent: ParsedStoryContent[] = []

  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Check for system messages (wrapped in brackets)
    if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
      parsedContent.push({
        type: 'system',
        content: trimmedLine.slice(1, -1) // Remove brackets
      })
      continue
    }

    // Check for character dialogue (Character Name: dialogue)
    const dialogueMatch = trimmedLine.match(/^([A-Z][a-zA-Z\s]+):\s*(.+)$/)
    if (dialogueMatch) {
      const [, characterName, dialogue] = dialogueMatch
      parsedContent.push({
        type: 'dialogue',
        characterName: characterName.trim(),
        content: dialogue.trim()
      })
      continue
    }

    // Default to narrative
    parsedContent.push({
      type: 'narrative',
      content: trimmedLine
    })
  }

  return parsedContent
}

/**
 * Combines multiple narrative pieces into single blocks for better rendering
 */
export function consolidateNarrative(content: ParsedStoryContent[]): ParsedStoryContent[] {
  const consolidated: ParsedStoryContent[] = []
  let currentNarrative = ''

  for (const item of content) {
    if (item.type === 'narrative') {
      currentNarrative += (currentNarrative ? ' ' : '') + item.content
    } else {
      // If we have accumulated narrative, add it first
      if (currentNarrative) {
        consolidated.push({
          type: 'narrative',
          content: currentNarrative
        })
        currentNarrative = ''
      }
      // Add the non-narrative item
      consolidated.push(item)
    }
  }

  // Add any remaining narrative
  if (currentNarrative) {
    consolidated.push({
      type: 'narrative',
      content: currentNarrative
    })
  }

  return consolidated
}