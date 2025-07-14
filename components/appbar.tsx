import Link from 'next/link'
import { useRouter } from 'next/router'

const Appbar = () => {
	const router = useRouter()

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

						<div
							title='User Account'
							aria-label='User Account'
							className='h-10 w-10 rounded-full bg-zinc-200 flex items-center justify-center shadow-inner dark:bg-zinc-800'
						>
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
						</div>
					</nav>
				</div>
			</header>
		</div>
	)
}

export default Appbar
