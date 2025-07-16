import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

/**
 * Party Classes API Endpoint
 * GET /api/party-classes - Get all available party member classes
 */

export async function GET() {
  try {
    if (!isSupabaseConfigured || !supabase) {
      // Return default classes from game state manager when Supabase is not configured
      const { GameStateManager } = await import('@/lib/game-state-manager')
      const classes = GameStateManager.getAvailablePartyClasses()
      
      return NextResponse.json({
        success: true,
        data: classes,
        source: 'fallback'
      })
    }

    // Fetch from database
    const { data: classes, error } = await supabase
      .from('party_member_classes')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching party classes:', error)
      
      // Fallback to default classes on database error
      const { GameStateManager } = await import('@/lib/game-state-manager')
      const fallbackClasses = GameStateManager.getAvailablePartyClasses()
      
      return NextResponse.json({
        success: true,
        data: fallbackClasses,
        source: 'fallback',
        warning: 'Database error, using fallback data'
      })
    }

    // Transform database format to application format
    const transformedClasses = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      description: cls.description,
      abilities: cls.abilities || [],
      baseStats: cls.base_stats || {}
    }))

    return NextResponse.json({
      success: true,
      data: transformedClasses,
      source: 'database'
    })

  } catch (error) {
    console.error('Error in party classes API:', error)
    
    // Fallback to default classes on any error
    try {
      const { GameStateManager } = await import('@/lib/game-state-manager')
      const fallbackClasses = GameStateManager.getAvailablePartyClasses()
      
      return NextResponse.json({
        success: true,
        data: fallbackClasses,
        source: 'fallback',
        warning: 'API error, using fallback data'
      })
    } catch (fallbackError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch party classes',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  }
}