import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import '../styles/globals.css';
import { DataProvider } from '../context/DataContext';

const manrope = Manrope({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Alsonotify - Agency-Client Collaboration',
  description: 'Minimalist agency-client collaboration tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  );
}
