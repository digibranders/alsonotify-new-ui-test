import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import '../styles/globals.css';
import { AntDesignProvider } from '../components/AntDesignProvider';
import ReactQueryProvider from '../provider/ReactQueryClient';


const manrope = Manrope({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Alsonotify - Agency-Client Collaboration',
  description: 'Minimalist agency-client collaboration tool',
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
    <html lang="en">
      <body className={manrope.className}>
        <ReactQueryProvider>
          <AntDesignProvider>
            {children}
          </AntDesignProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
