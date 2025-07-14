import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

interface AuthModalProps {
	isOpen: boolean
	onClose: () => void
	mode: 'signin' | 'signup'
	onSwitchMode: (mode: 'signin' | 'signup') => void
}

export default function AuthModal({ isOpen, onClose, mode, onSwitchMode }: AuthModalProps) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [displayName, setDisplayName] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const { signIn, signUp } = useAuth()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		try {
			let result
			if (mode === 'signup') {
				result = await signUp(email, password, displayName)
			} else {
				result = await signIn(email, password)
			}

			if (result.error) {
				setError(result.error)
			} else {
				// Success - close modal and reset form
				onClose()
				setEmail('')
				setPassword('')
				setDisplayName('')
				setError('')
			}
		} catch (err) {
			setError('An unexpected error occurred')
		} finally {
			setLoading(false)
		}
	}

	const resetForm = () => {
		setEmail('')
		setPassword('')
		setDisplayName('')
		setError('')
	}

	const handleClose = () => {
		resetForm()
		onClose()
	}

	const handleSwitchMode = (newMode: 'signin' | 'signup') => {
		resetForm()
		onSwitchMode(newMode)
	}

	if (!isOpen) return null

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
			<div className='bg-white dark:bg-zinc-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl'>
				<div className='flex justify-between items-center mb-4'>
					<h2 className='text-xl font-semibold text-zinc-800 dark:text-zinc-200'>
						{mode === 'signup' ? 'Create Account' : 'Sign In'}
					</h2>
					<button
						onClick={handleClose}
						className='text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
						aria-label='Close'
					>
						<svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
						</svg>
					</button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4'>
					{mode === 'signup' && (
						<div>
							<label htmlFor='displayName' className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1'>
								Display Name
							</label>
							<input
								id='displayName'
								type='text'
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								className='w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
								placeholder='Your name'
							/>
						</div>
					)}

					<div>
						<label htmlFor='email' className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1'>
							Email
						</label>
						<input
							id='email'
							type='email'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className='w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
							placeholder='your@email.com'
						/>
					</div>

					<div>
						<label htmlFor='password' className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1'>
							Password
						</label>
						<input
							id='password'
							type='password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={6}
							className='w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
							placeholder='Your password'
						/>
					</div>

					{error && (
						<div className='p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
							<p className='text-red-800 dark:text-red-200 text-sm'>{error}</p>
						</div>
					)}

					<button
						type='submit'
						disabled={loading}
						className='w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
					>
						{loading ? (
							<div className='flex items-center justify-center'>
								<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
								{mode === 'signup' ? 'Creating Account...' : 'Signing In...'}
							</div>
						) : (
							mode === 'signup' ? 'Create Account' : 'Sign In'
						)}
					</button>
				</form>

				<div className='mt-4 text-center'>
					<p className='text-sm text-zinc-600 dark:text-zinc-400'>
						{mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
						<button
							onClick={() => handleSwitchMode(mode === 'signup' ? 'signin' : 'signup')}
							className='ml-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium'
						>
							{mode === 'signup' ? 'Sign In' : 'Sign Up'}
						</button>
					</p>
				</div>

				{mode === 'signup' && (
					<div className='mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
						<p className='text-blue-800 dark:text-blue-200 text-sm'>
							<strong>Note:</strong> Check your email after signing up to confirm your account.
						</p>
					</div>
				)}
			</div>
		</div>
	)
}