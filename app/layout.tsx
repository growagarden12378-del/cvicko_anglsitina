import type { ReactNode } from 'react';
import './globals.css';
import { SITE_ICON } from '@/lib/config';

export const metadata = {
  icons: {
    icon: [
      { url: `/icon-${SITE_ICON}.svg`, type: 'image/svg+xml' },
      { url: `/icon-${SITE_ICON}.png`, type: 'image/png', sizes: '512x512' },
    ],
    apple: `/icon-${SITE_ICON}.png`,
  },
  title: 'Cvičko 9 – precvič si to zadarmo',
  description: 'Bezplatný tréning angličtiny pre 9. ročník: výber tém, zápisník chýb, celé testy s časovačom.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sk">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600;800&family=Figtree:wght@400;500;600;700;800&family=Caveat:wght@600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
