import type { AppProps } from 'next/app'
import { AppProvider } from '../context/AppContext'
import { CredentialsProvider } from '../context/CredentialsContext'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppProvider>
      <CredentialsProvider>
        <Component {...pageProps} />
      </CredentialsProvider>
    </AppProvider>
  )
}