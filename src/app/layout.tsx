import type { Metadata, Viewport } from 'next';
// Fonts are bundled with the site (no request to Google Fonts before the page can draw).
import '@fontsource-variable/bricolage-grotesque/opsz.css';
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
