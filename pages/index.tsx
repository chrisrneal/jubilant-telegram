import Page from '@/components/page'
import Section from '@/components/section'
import Link from 'next/link'

const Index = () => (
	<Page>
		<Section>
			<h2 className='text-xl font-semibold text-zinc-800 dark:text-zinc-200'>
				Welcome to Story Rider
			</h2>

			<div className='mt-4'>
				<p className='text-zinc-600 dark:text-zinc-400'>
					Begin your journey through interactive stories. Choose your own path and see where your adventure takes you.
				</p>

				<div className='mt-6 mb-8 flex flex-col sm:flex-row gap-4'>
					<Link 
						href='/story'
						className='inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none text-center'
						aria-label='Start or continue your adventure'
					>
						Start Adventure
					</Link>
					<Link 
						href='/adventures'
						className='inline-block px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:outline-none text-center'
						aria-label='Manage your adventures'
					>
						My Adventures
					</Link>
				</div>

				<div className='mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
					<h3 className='font-medium text-blue-800 dark:text-blue-200 mb-2'>
						✨ New Features
					</h3>
					<ul className='text-sm text-blue-700 dark:text-blue-300 space-y-1'>
						<li>• <strong>Multiple Adventures:</strong> Play multiple stories simultaneously</li>
						<li>• <strong>Adventure History:</strong> Review your choices and progress</li>
						<li>• <strong>Compare Playthroughs:</strong> See how different choices led to different outcomes</li>
					</ul>
				</div>

				<p className='text-zinc-600 dark:text-zinc-400'>
					Our stories are crafted to immerse you in worlds of adventure and exploration. Each choice you make will shape your unique journey.
				</p>

				<br />

				<p className='text-sm text-zinc-600 dark:text-zinc-400'>
					<a
						href='https://github.com/mvllow/next-pwa-template'
						className='underline'
					>
						Source
					</a>
				</p>
			</div>
		</Section>
	</Page>
)

export default Index
