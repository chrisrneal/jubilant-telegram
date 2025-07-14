import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured, AuthUser } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
	user: AuthUser | null
	session: Session | null
	loading: boolean
	signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: string }>
	signIn: (email: string, password: string) => Promise<{ error?: string }>
	signOut: () => Promise<void>
	isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<AuthUser | null>(null)
	const [session, setSession] = useState<Session | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		// Only set up auth if Supabase is configured
		if (!isSupabaseConfigured || !supabase) {
			setLoading(false)
			return
		}

		// Get initial session
		const getSession = async () => {
			try {
				const { data: { session }, error } = await supabase!.auth.getSession()
				if (error) {
					console.error('Error getting session:', error)
				} else {
					setSession(session)
					setUser(session?.user ? {
						id: session.user.id,
						email: session.user.email,
						user_metadata: session.user.user_metadata
					} : null)
				}
			} catch (error) {
				console.error('Error getting session:', error)
			}
			setLoading(false)
		}

		getSession()

		// Listen for auth changes
		const { data: { subscription } } = supabase!.auth.onAuthStateChange(
			async (event, session) => {
				setSession(session)
				setUser(session?.user ? {
					id: session.user.id,
					email: session.user.email,
					user_metadata: session.user.user_metadata
				} : null)
				setLoading(false)
			}
		)

		return () => subscription.unsubscribe()
	}, [])

	const signUp = async (email: string, password: string, displayName?: string) => {
		if (!isSupabaseConfigured || !supabase) {
			return { error: 'Authentication not available. Please configure Supabase.' }
		}

		const { error } = await supabase!.auth.signUp({
			email,
			password,
			options: {
				data: {
					display_name: displayName || email.split('@')[0]
				}
			}
		})

		if (error) {
			return { error: error.message }
		}

		return {}
	}

	const signIn = async (email: string, password: string) => {
		if (!isSupabaseConfigured || !supabase) {
			return { error: 'Authentication not available. Please configure Supabase.' }
		}

		const { error } = await supabase!.auth.signInWithPassword({
			email,
			password
		})

		if (error) {
			return { error: error.message }
		}

		return {}
	}

	const signOut = async () => {
		if (!isSupabaseConfigured || !supabase) {
			return
		}

		const { error } = await supabase!.auth.signOut()
		if (error) {
			console.error('Error signing out:', error)
		}
	}

	const value = {
		user,
		session,
		loading,
		signUp,
		signIn,
		signOut,
		isAuthenticated: !!user
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}