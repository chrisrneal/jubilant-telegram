import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured, PartyConfiguration } from '@/lib/supabase'

/**
 * Party Configurations API Endpoint
 * GET /api/party-configurations?sessionId=...&storyId=... - Get party configuration
 * POST /api/party-configurations - Create party configuration
 * PUT /api/party-configurations?partyId=... - Update party configuration
 * DELETE /api/party-configurations?partyId=... - Delete party configuration
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const storyId = searchParams.get('storyId')

    if (!sessionId || !storyId) {
      return NextResponse.json(
        { success: false, error: 'sessionId and storyId are required' },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Party configurations require Supabase setup'
      })
    }

    // Get party configuration with members
    const { data: partyConfig, error: configError } = await supabase
      .from('party_configurations')
      .select(`
        *,
        party_members:party_members (
          *,
          class:party_member_classes (*)
        )
      `)
      .eq('session_id', sessionId)
      .eq('story_id', storyId)
      .single()

    if (configError && configError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching party configuration:', configError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch party configuration' },
        { status: 500 }
      )
    }

    if (!partyConfig) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No party configuration found'
      })
    }

    // Transform to application format
    const transformedConfig: PartyConfiguration = {
      members: partyConfig.party_members
        .sort((a: any, b: any) => a.member_order - b.member_order)
        .map((member: any) => ({
          id: member.id,
          name: member.name,
          class: {
            id: member.class.id,
            name: member.class.name,
            description: member.class.description,
            abilities: member.class.abilities || [],
            baseStats: member.class.base_stats || {}
          },
          level: member.level,
          customAttributes: member.custom_attributes || {},
          createdAt: member.created_at
        })),
      formation: partyConfig.formation,
      createdAt: partyConfig.created_at,
      maxSize: partyConfig.max_size
    }

    return NextResponse.json({
      success: true,
      data: transformedConfig
    })

  } catch (error) {
    console.error('Error in party configurations GET:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch party configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, storyId, partyConfig } = await request.json()

    if (!sessionId || !storyId || !partyConfig) {
      return NextResponse.json(
        { success: false, error: 'sessionId, storyId, and partyConfig are required' },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json(
        { success: false, error: 'Party configurations require Supabase setup' },
        { status: 501 }
      )
    }

    // Validate party configuration
    const { GameStateManager } = await import('@/lib/game-state-manager')
    const validation = GameStateManager.validatePartyConfiguration(partyConfig)
    
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid party configuration',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Start transaction
    const { data: newPartyConfig, error: configError } = await supabase
      .from('party_configurations')
      .insert({
        session_id: sessionId,
        story_id: storyId,
        formation: partyConfig.formation,
        max_size: partyConfig.maxSize || 4
      })
      .select()
      .single()

    if (configError) {
      console.error('Error creating party configuration:', configError)
      return NextResponse.json(
        { success: false, error: 'Failed to create party configuration' },
        { status: 500 }
      )
    }

    // Insert party members
    const memberInserts = partyConfig.members.map((member: any, index: number) => ({
      party_configuration_id: newPartyConfig.id,
      name: member.name,
      class_id: member.class.id,
      level: member.level || 1,
      custom_attributes: member.customAttributes || {},
      member_order: index
    }))

    const { error: membersError } = await supabase
      .from('party_members')
      .insert(memberInserts)

    if (membersError) {
      console.error('Error creating party members:', membersError)
      
      // Cleanup - delete the party configuration if members failed
      await supabase
        .from('party_configurations')
        .delete()
        .eq('id', newPartyConfig.id)

      return NextResponse.json(
        { success: false, error: 'Failed to create party members' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { partyConfigId: newPartyConfig.id },
      message: 'Party configuration created successfully'
    })

  } catch (error) {
    console.error('Error in party configurations POST:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create party configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partyId = searchParams.get('partyId')

    if (!partyId) {
      return NextResponse.json(
        { success: false, error: 'partyId is required' },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json(
        { success: false, error: 'Party configurations require Supabase setup' },
        { status: 501 }
      )
    }

    // Delete party configuration (members will be deleted by CASCADE)
    const { error } = await supabase
      .from('party_configurations')
      .delete()
      .eq('id', partyId)

    if (error) {
      console.error('Error deleting party configuration:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete party configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Party configuration deleted successfully'
    })

  } catch (error) {
    console.error('Error in party configurations DELETE:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete party configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}