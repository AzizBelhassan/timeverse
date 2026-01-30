'use client';

import dynamic from 'next/dynamic';
import { LoadingScreen } from '../src/components/LoadingScreen';

// Dynamic import with SSR disabled for WebGL components
const WormholeApp = dynamic(() => import('../src/App'), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Home() {
  return <WormholeApp />;
}
