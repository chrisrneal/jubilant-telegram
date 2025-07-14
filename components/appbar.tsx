import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { isSupabaseConfigured } from '@/lib/supabase'
import AuthModal from './auth-modal'

const Appbar = () => {
	const router = useRouter()
	const { user, signOut, loading, isAuthenticated } = useAuth()
	const [showAuthModal, setShowAuthModal] = useState(false)
	const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
	const [showUserMenu, setShowUserMenu] = useState(false)

	const handleAuthClick = (mode: 'signin' | 'signup') => {
		setAuthMode(mode)
		setShowAuthModal(true)
	}

	const handleSignOut = async () => {
		await signOut()
		setShowUserMenu(false)
	}

	const getUserDisplayName = () => {
		if (!user) return ''
		return user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'
	}

	const getUserInitials = () => {
		const name = getUserDisplayName()
		return name.charAt(0).toUpperCase()
	}

	return (
		<div className='fixed top-0 left-0 z-20 w-full bg-zinc-900 pt-safe'>
			<header className='border-b bg-zinc-100 px-safe dark:border-zinc-800 dark:bg-zinc-900'>
				<div className='mx-auto flex h-20 max-w-screen-md items-center justify-between px-6'>
					<Link href='/' className='font-medium'>
						<h1 className='font-medium'>Story Rider</h1>
					</Link>

					<nav className='flex items-center space-x-6'>
						<div className='hidden sm:block'>
							<div className='flex items-center space-x-6'></div>
						</div>

						{/* Authentication UI */}
						{isSupabaseConfigured ? (
							<div className='relative'>
								{loading ? (
									<div className='h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center'>
										<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-500'></div>
									</div>
								) : isAuthenticated && user ? (
									/* Authenticated User */
									<div className='relative'>
										<button
											onClick={() => setShowUserMenu(!showUserMenu)}
											className='h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
											title={`Signed in as ${getUserDisplayName()}`}
											aria-label={`User menu for ${getUserDisplayName()}`}
										>
											{getUserInitials()}
										</button>

										{/* User Menu Dropdown */}
										{showUserMenu && (
											<div className='absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-2'>
												<div className='px-4 py-2 border-b border-zinc-200 dark:border-zinc-700'>
													<p className='text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate'>
														{getUserDisplayName()}
													</p>
													<p className='text-xs text-zinc-600 dark:text-zinc-400 truncate'>
														{user.email}
													</p>
												</div>
												<button
													onClick={handleSignOut}
													className='w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors'
												>
													Sign Out
												</button>
											</div>
										)}
									</div>
								) : (
									/* Not Authenticated */
									<div className='flex items-center space-x-2'>
										<button
											onClick={() => handleAuthClick('signin')}
											className='px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors'
										>
											Sign In
										</button>
										<button
											onClick={() => handleAuthClick('signup')}
											className='px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
										>
											Sign Up
										</button>
									</div>
								)}
							</div>
						) : (
							/* Supabase not configured - show generic user icon */
							<div
								title='User Account (Authentication disabled - configure Supabase to enable)'
								aria-label='User Account'
								className='h-10 w-10 rounded-full bg-zinc-200 flex items-center justify-center shadow-inner dark:bg-zinc-800'
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
							</div>
						)}
					</nav>
				</div>
			</header>

			{/* Authentication Modal */}
			<AuthModal
				isOpen={showAuthModal}
				onClose={() => setShowAuthModal(false)}
				mode={authMode}
				onSwitchMode={setAuthMode}
			/>

			{/* Click outside to close user menu */}
			{showUserMenu && (
				<div
					className='fixed inset-0 z-10'
					onClick={() => setShowUserMenu(false)}
				/>
			)}
		</div>
	)
}

export default Appbar
