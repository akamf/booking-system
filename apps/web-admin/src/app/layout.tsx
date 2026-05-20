import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sportshallen Admin',
  description: 'Booking system admin dashboard',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv-SE">
      <body>{children}</body>
    </html>
  );
}
