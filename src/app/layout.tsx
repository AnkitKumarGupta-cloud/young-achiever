import type { Metadata, Viewport } from 'next';
// Fonts are bundled with the site (no request to Google Fonts before the page can draw).
// Inter for text and numbers, Instrument Serif for big headlines.
import '@fontsource-variable/inter';
import '@fontsource/instrument-serif';
import '@fontsource/instrument-serif/400-italic.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Young Achievers',
  description: 'Showcasing young chess players.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#0b1533' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
