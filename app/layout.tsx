import type { Metadata } from 'next';
import { Cormorant_Garamond, Outfit } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400','500','600'], variable: '--font-cormorant' });
const outfit = Outfit({ subsets: ['latin'], weight: ['300','400','500','600'], variable: '--font-outfit' });

export const metadata: Metadata = { title: 'Momotaro Sushi', description: 'Restaurant online ordering' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable}`}>
      <head>
        <link href="https://d2ibqiw1xziqq9.cloudfront.net/lex-web-ui-loader.css" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
        <Providers>{children}</Providers>
        <div id="lex-web-ui" />
        <script src="https://d2ibqiw1xziqq9.cloudfront.net/lex-web-ui-loader.js" />
      </body>
    </html>
  );
}
