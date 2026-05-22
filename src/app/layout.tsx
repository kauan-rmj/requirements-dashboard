import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import NavBar from '@/components/NavBar';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Requirements Dashboard',
  description: 'Track project requirements and status from Linear',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body style={{ background: '#0f0f0f', minHeight: '100vh' }}>
        <NavBar />
        <main style={{ minHeight: 'calc(100vh - 57px)' }}>{children}</main>
      </body>
    </html>
  );
}
