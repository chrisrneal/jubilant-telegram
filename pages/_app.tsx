import type { AppProps } from 'next/app'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/lib/auth-context'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
	return (
		<ThemeProvider
			attribute='class'
			defaultTheme='system'
			disableTransitionOnChange
		>
			<AuthProvider>
				<Component {...pageProps} />
			</AuthProvider>
		</ThemeProvider>
	)
}
