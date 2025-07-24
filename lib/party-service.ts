/**
 * Party Service
 * Handles saving, loading, and managing party configurations
 */

import { PartyConfiguration, SavedPartyConfiguration } from './supabase'

export class PartyService {
	/**
	 * Save a party configuration as a standalone saved party
	 */
	static async saveParty(
		sessionId: string,
		partyConfig: PartyConfiguration,
		partyName: string
	): Promise<{ success: boolean; data?: any; error?: string }> {
		try {
			const response = await fetch('/api/party-configurations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId,
					partyConfig,
					partyName,
					standalone: true
				})
			})

			const result = await response.json()

			if (!response.ok) {
				return {
					success: false,
					error: result.error || 'Failed to save party'
				}
			}

			return {
				success: true,
				data: result.data
			}
		} catch (error) {
			console.error('Error saving party:', error)
			return {
				success: false,
				error: 'Network error while saving party'
			}
		}
	}

	/**
	 * Get all saved parties for a session
	 */
	static async getSavedParties(sessionId: string): Promise<SavedPartyConfiguration[]> {
		try {
			const response = await fetch(
				`/api/party-configurations?sessionId=${encodeURIComponent(sessionId)}&standalone=true`
			)

			const result = await response.json()

			if (!response.ok) {
				console.error('Error loading saved parties:', result.error)
				return []
			}

			return result.data || []
		} catch (error) {
			console.error('Error loading saved parties:', error)
			return []
		}
	}

	/**
	 * Load a specific saved party by ID
	 */
	static async loadSavedParty(partyId: string): Promise<SavedPartyConfiguration | null> {
		try {
			const response = await fetch(
				`/api/party-configurations?partyId=${encodeURIComponent(partyId)}`
			)

			const result = await response.json()

			if (!response.ok) {
				console.error('Error loading saved party:', result.error)
				return null
			}

			return result.data
		} catch (error) {
			console.error('Error loading saved party:', error)
			return null
		}
	}

	/**
	 * Delete a saved party
	 */
	static async deleteSavedParty(partyId: string): Promise<{ success: boolean; error?: string }> {
		try {
			const response = await fetch(
				`/api/party-configurations?partyId=${encodeURIComponent(partyId)}`,
				{ method: 'DELETE' }
			)

			const result = await response.json()

			if (!response.ok) {
				return {
					success: false,
					error: result.error || 'Failed to delete party'
				}
			}

			return { success: true }
		} catch (error) {
			console.error('Error deleting saved party:', error)
			return {
				success: false,
				error: 'Network error while deleting party'
			}
		}
	}

	/**
	 * Check if a party name is available for a session
	 */
	static async isPartyNameAvailable(sessionId: string, partyName: string): Promise<boolean> {
		try {
			const savedParties = await this.getSavedParties(sessionId)
			return !savedParties.some(party => party.partyName.toLowerCase() === partyName.toLowerCase())
		} catch (error) {
			console.error('Error checking party name availability:', error)
			return false
		}
	}

	/**
	 * Get suggested party names based on party composition
	 */
	static generatePartyName(party: PartyConfiguration): string {
		const classNames = party.members.map(member => member.class.name)
		const uniqueClasses = Array.from(new Set(classNames))
		
		// Generate name based on party composition
		if (uniqueClasses.length === 1) {
			return `${uniqueClasses[0]} Band`
		} else if (uniqueClasses.length === 2) {
			return `${uniqueClasses.join(' & ')} Team`
		} else if (party.members.length <= 2) {
			return `${party.members.map(m => m.name).join(' & ')}`
		} else {
			return `The ${uniqueClasses[0]}'s Party`
		}
	}
}