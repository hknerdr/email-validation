// pages/_app.tsx
import type { AppProps } from 'next/app';
import { CredentialsProvider } from '../context/CredentialsContext';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CredentialsProvider>
      <Component {...pageProps} />
    </CredentialsProvider>
  );
}