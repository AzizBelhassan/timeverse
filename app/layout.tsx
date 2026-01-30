import type { Metadata, Viewport } from 'next';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'Timeverse',
  description: '3D wormhole tunnel exploration game built with React Three Fiber',
  keywords: ['webgl', 'three.js', 'react', 'game', 'wormhole', '3d'],
  authors: [{ name: 'Timeverse' }],
  openGraph: {
    title: 'Timeverse',
    description: '3D wormhole tunnel exploration game',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0015',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
