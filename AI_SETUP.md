# AI Story Generation Setup

This application integrates with Azure OpenAI to generate dynamic story content. Follow these steps to configure the AI integration:

## Prerequisites

1. An Azure account with access to Azure OpenAI Service
2. A deployed GPT-4o-mini model in Azure OpenAI

## Configuration

1. Copy the environment variables template:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Azure OpenAI credentials in `.env.local`:
   ```bash
   AZURE_OPENAI_API_KEY=your_actual_api_key_here
   AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
   AZURE_OPENAI_API_VERSION=2024-02-15-preview
   ```

## How it Works

- The application will attempt to use AI to generate unique story content for each playthrough
- If AI is unavailable or fails, it gracefully falls back to static content
- The AI generates:
  - Opening scenes with atmospheric descriptions
  - Story continuations based on player choices
  - Dynamic endings based on the story progression

## Features

- **Dynamic Story Generation**: Each playthrough is unique with AI-generated content
- **Contextual Choices**: AI considers previous choices and story history
- **Graceful Fallback**: Application works even without AI configuration
- **Loading States**: Smooth user experience during AI generation
- **Error Handling**: Clear feedback when AI is unavailable

## Development

The AI integration consists of:

- `services/aiService.ts` - Azure OpenAI API client
- `lib/promptTemplates.ts` - Prompt templates for story generation
- `pages/api/generate-story.ts` - API endpoint for secure AI calls
- `pages/story.tsx` - Updated story component with AI integration

The application maintains the same user interface whether using AI or fallback content.