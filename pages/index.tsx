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

				<div className='mt-6 mb-8'>
					<Link 
						href='/story'
						className='inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
						aria-label='Start your adventure'
					>
						Start Adventure
					</Link>
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
