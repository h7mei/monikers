import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import RealtimeNav from '@/components/multiplayer/RealtimeNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Monikers',
  description: 'A multiplayer card guessing game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RealtimeNav>{children}</RealtimeNav>
      </body>
    </html>
  );
}
