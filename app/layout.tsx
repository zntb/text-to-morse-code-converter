import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Outfit } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Morse Code Converter',
  description:
    'Convert text to Morse code and play it back with adjustable speed and frequency. A retro-futuristic radio station aesthetic.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Morse Code Converter',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.svg', sizes: '192x192' },
      { url: '/icon-512.svg', sizes: '512x512' },
    ],
    apple: [{ url: '/icon-192.svg', sizes: '192x192' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${jetbrainsMono.variable} ${outfit.variable} antialiased`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
