import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import '../styles/globals.css';
import { AntDesignProvider } from '../components/AntDesignProvider';
import ReactQueryProvider from '../provider/ReactQueryClient';
import BrowserPolyfills from '../components/BrowserPolyfills';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Alsonotify',
  description: 'Alsonotify - Project management Tool',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={manrope.className} suppressHydrationWarning>
        <BrowserPolyfills />
        <ReactQueryProvider>
          <AntDesignProvider>
            {children}
          </AntDesignProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
