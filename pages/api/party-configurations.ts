import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured, PartyConfiguration } from '@/lib/supabase'

/**
 * Party Configurations API Endpoint
 * GET /api/party-configurations?sessionId=...&storyId=... - Get party configuration for adventure
 * GET /api/party-configurations?sessionId=...&standalone=true - Get all standalone saved parties
 * GET /api/party-configurations?partyId=... - Get specific party configuration
 * POST /api/party-configurations - Create party configuration (adventure-specific or standalone)
 * PUT /api/party-configurations?partyId=... - Update party configuration
 * DELETE /api/party-configurations?partyId=... - Delete party configuration
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const storyId = searchParams.get('storyId')
    const partyId = searchParams.get('partyId')
    const standalone = searchParams.get('standalone') === 'true'

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({
        success: true,
        data: standalone ? [] : null,
        message: 'Party configurations require Supabase setup'
      })
    }

    // Handle different query types
    if (partyId) {
      // Get specific party by ID
      const { data: partyConfig, error: configError } = await supabase
        .from('party_configurations')
        .select(`
          *,
          party_members:party_members (
            *,
            class:party_member_classes (*)
          )
        `)
        .eq('id', partyId)
        .single()

      if (configError) {
        console.error('Error fetching party configuration by ID:', configError)
        return NextResponse.json(
          { success: false, error: 'Party configuration not found' },
          { status: 404 }
        )
      }

      const transformedConfig = transformPartyConfig(partyConfig)
      return NextResponse.json({
        success: true,
        data: transformedConfig
      })
    } else if (standalone && sessionId) {
      // Get all standalone parties for session
      const { data: parties, error: partiesError } = await supabase
        .from('party_configurations')
        .select(`
          *,
          party_members:party_members (
            *,
            class:party_member_classes (*)
          )
        `)
        .eq('session_id', sessionId)
        .is('story_id', null)
        .order('created_at', { ascending: false })

      if (partiesError) {
        console.error('Error fetching standalone parties:', partiesError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch saved parties' },
          { status: 500 }
        )
      }

      const transformedParties = parties.map(transformPartyConfig)
      return NextResponse.json({
        success: true,
        data: transformedParties
      })
    } else if (sessionId && storyId) {
      // Get party configuration for specific adventure
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

      const transformedConfig = transformPartyConfig(partyConfig)
      return NextResponse.json({
        success: true,
        data: transformedConfig
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters. Provide sessionId with storyId, standalone=true, or partyId' },
        { status: 400 }
      )
    }

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

function transformPartyConfig(partyConfig: any): PartyConfiguration & { id?: string; partyName?: string } {
  return {
    id: partyConfig.id,
    partyName: partyConfig.party_name,
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
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, storyId, partyConfig, partyName, standalone } = await request.json()

    if (!sessionId || !partyConfig) {
      return NextResponse.json(
        { success: false, error: 'sessionId and partyConfig are required' },
        { status: 400 }
      )
    }

    // For standalone parties, partyName is required
    if (standalone && !partyName) {
      return NextResponse.json(
        { success: false, error: 'partyName is required for standalone parties' },
        { status: 400 }
      )
    }

    // For adventure parties, storyId is required
    if (!standalone && !storyId) {
      return NextResponse.json(
        { success: false, error: 'storyId is required for adventure parties' },
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

    // Check for duplicate party names for standalone parties
    if (standalone) {
      const { data: existingParty } = await supabase
        .from('party_configurations')
        .select('id')
        .eq('session_id', sessionId)
        .eq('party_name', partyName)
        .is('story_id', null)
        .single()

      if (existingParty) {
        return NextResponse.json(
          { success: false, error: 'A saved party with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Create party configuration
    const insertData: any = {
      session_id: sessionId,
      formation: partyConfig.formation,
      max_size: partyConfig.maxSize || 4
    }

    if (standalone) {
      insertData.party_name = partyName;
      // story_id remains null for standalone parties
    } else {
      insertData.story_id = storyId;
    }

    const { data: newPartyConfig, error: configError } = await supabase
      .from('party_configurations')
      .insert(insertData)
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
      data: { 
        partyConfigId: newPartyConfig.id,
        partyName: newPartyConfig.party_name,
        standalone: !!standalone
      },
      message: `${standalone ? 'Standalone' : 'Adventure'} party configuration created successfully`
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