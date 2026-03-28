# Next.js App Router Pages

Next.js 15 App Router pages and layouts under `app/`. Mix of Server and Client Components.

## Capabilities

### Root Layout (`app/layout.tsx`)

Server Component. Provides the HTML shell with metadata, viewport configuration, and global CSS.

```typescript { .api }
// Exported metadata (used by Next.js for <head> generation)
export const metadata: Metadata;
// Exported viewport config
export const viewport: Viewport;
// Default export — Root layout component
export default function RootLayout(props: { children: React.ReactNode }): JSX.Element;
```

**Metadata values:**
```typescript
const metadata: Metadata = {
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

const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0015',
};
```

**Imports global CSS:** `../src/index.css`

### Home Page (`app/page.tsx`)

Client Component (`'use client'`). Dynamically imports the `App` component with SSR disabled. Shows `LoadingScreen` while loading. This is the entry point of the application.

```typescript { .api }
export default function Home(): JSX.Element;
```

**Implementation pattern:**
```typescript
'use client';
import dynamic from 'next/dynamic';
import { LoadingScreen } from '../src/components/LoadingScreen';

const WormholeApp = dynamic(() => import('../src/App'), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Home() {
  return <WormholeApp />;
}
```

SSR is disabled because WebGL requires browser APIs not available in Node.js.

### Route-Level Loading (`app/loading.tsx`)

Server Component. Shown by Next.js during route transitions before the page is ready. Full-screen dark loading spinner with "INITIALIZING" text. No props.

```typescript { .api }
export default function Loading(): JSX.Element;
```

### Error Boundary (`app/error.tsx`)

Client Component (`'use client'`). Next.js error boundary. Shown when an uncaught error occurs in the page (e.g., WebGL initialization failure). Displays an error message with a "TRY AGAIN" button that calls `reset()`.

```typescript { .api }
export default function Error(props: {
  /** The caught error. May have a `digest` property for server-side error IDs. */
  error: Error & { digest?: string };
  /** Call to retry rendering the failed segment */
  reset: () => void;
}): JSX.Element;
```

The error message displayed: "Something went wrong while rendering the wormhole. This may be due to WebGL not being supported or a graphics driver issue."

### 404 Not Found (`app/not-found.tsx`)

Server Component. Displayed for unmatched routes. Shows a "404" heading with "LOST IN THE VOID" text and a link back to `/`.

```typescript { .api }
export default function NotFound(): JSX.Element;
```

Uses Next.js `Link` component: `<Link href="/">RETURN TO WORMHOLE</Link>`

## Main App Component (`src/App.tsx`)

Client Component (`'use client'`). Composes the R3F Canvas with `WormholeScene` and the DOM `HUD` overlay. Manages speed, DPR (via `PerformanceMonitor`), warp state, and action references.

```typescript { .api }
// Default export
export default function App(): JSX.Element;
```

**Internal state managed:**
- `speed: number` — Normalized speed passed to HUD
- `dpr: number` — Device pixel ratio (1 or 1.5, adjusted by `PerformanceMonitor`)
- `actions` — Stop/toggle/warp action refs from `WormholeScene`
- `isWarping: boolean` — Warp state for HUD
- `warpPhase: WarpPhase` — Warp phase for HUD

**Canvas configuration (hoisted constants):**
```typescript
const CAMERA_CONFIG = { fov: 75, near: 0.1, far: 1000, position: [0, 0, 5] };
const GL_CONFIG = { antialias: true, alpha: false, powerPreference: 'high-performance' };
```

**Performance monitoring:**
- `PerformanceMonitor` from `@react-three/drei` adjusts DPR automatically
- `onDecline` → sets DPR to 1 (lower quality for performance)
- `onIncline` → sets DPR to 1.5 (higher quality when performance allows)
