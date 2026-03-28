# Timeverse

Timeverse is a 3D wormhole tunnel exploration application built with Next.js 15, React 19, and React Three Fiber. It renders an infinite procedurally-generated wormhole tunnel through which users can navigate in first-person or third-person view. The application features a warp/boost system, animated glow rings, a HUD overlay, and gesture/keyboard navigation.

## Package Information

- **Package Name**: timeverse
- **Repository**: github/AzizBelhassan/timeverse
- **Language**: TypeScript
- **Framework**: Next.js 15 (App Router)
- **Setup**: Clone repo, run `yarn install`, then `yarn dev` (http://localhost:3000)
- **Run dev**: `yarn dev`
- **Build**: `yarn build` / `yarn start`
- **Test**: `yarn test:run`

## Core Imports

All source files are under `src/`. Next.js App Router pages are under `app/`.

```typescript
// Main App component (use with Next.js dynamic import, SSR disabled)
import App from './src/App';

// Scene components (must be inside R3F Canvas)
import { WormholeScene, Wormhole, MinimalWormholeScene, PerformanceWormholeScene } from './src/scenes/WormholeScene';
import { TunnelGeometry } from './src/scenes/TunnelGeometry';
import { GlowRings } from './src/scenes/GlowRings';

// Context & hooks (must be inside R3F Canvas via WormholeProvider)
import {
  WormholeContext,
  WormholeProvider,
  useWormhole,
  useWormholeState,
  useWormholeActions,
  useWormholeMeta,
} from './src/contexts/WormholeContext';

// Utility hooks
import { useProceduralTunnel } from './src/hooks/useProceduralTunnel';
import { useTunnelNavigation } from './src/hooks/useTunnelNavigation';

// UI components
import { HUD, HUDComponents } from './src/components/HUD';
import { LoadingScreen } from './src/components/LoadingScreen';

// Utilities
import { InfiniteCurve } from './src/utils/infiniteCurve';
import {
  generateCurvePoints,
  createTunnelCurve,
  getCameraTransform,
  generateRingPositions,
  generateParticlePositions,
  lerp,
  smoothStep,
} from './src/utils/tunnelMath';

// Configuration constants
import {
  TUNNEL_CONFIG,
  NAV_CONFIG,
  INFINITE_TUNNEL_CONFIG,
  WARP_CONFIG,
  EFFECTS_CONFIG,
} from './src/utils/constants';
```

## Basic Usage

The primary integration point is the `App` component (dynamically imported to disable SSR):

```typescript
// app/page.tsx (Next.js page - existing pattern)
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

For embedding the 3D scene in custom layouts:

```typescript
'use client';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { WormholeScene } from './src/scenes/WormholeScene';
import { HUD } from './src/components/HUD';
import { useState, useCallback } from 'react';

function MyApp() {
  const [speed, setSpeed] = useState(0);
  const [actions, setActions] = useState(null);

  return (
    <>
      <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 5] }}>
        <Suspense fallback={null}>
          <WormholeScene
            onSpeedChange={setSpeed}
            onActionsReady={setActions}
          />
        </Suspense>
      </Canvas>
      <HUD speed={speed} onStop={actions?.stop} onBoost={actions?.initiateWarp} />
    </>
  );
}
```

## Architecture

The application is organized around several key systems:

- **Infinite Tunnel Generation**: `InfiniteCurve` class manages a sliding window of procedurally-generated control points using layered sine waves. Geometry is rebuilt on demand with throttling.
- **Navigation State**: `WormholeContext` / `WormholeProvider` manages progress, velocity, camera mode, and warp state. Integrates `useFrame` animation loops and gesture/keyboard input.
- **Warp System**: Three-phase boost (accelerating → cruising → decelerating) with visual shader effects (radial stretch, helicoidal/spiral patterns), FOV animation, and ring density changes.
- **Compound Scene**: `Wormhole` compound object allows composing custom scenes from individual sub-components (Provider, Frame, Stars, Lighting, Tunnel, Rings, Fog).
- **HUD Overlay**: DOM-based overlay showing velocity and control buttons; designed for use outside the R3F Canvas.

## Capabilities

### Configuration Constants

All tunable parameters for tunnel geometry, navigation, warp, and visual effects.

```typescript { .api }
const TUNNEL_CONFIG: { CURVE_SEGMENTS: number; CURVE_LENGTH: number; TUBE_RADIUS: number; TUBE_RADIAL_SEGMENTS: number; TUBE_TUBULAR_SEGMENTS: number; TUNNEL_COLOR: string; TUNNEL_OPACITY: number; /* ... */ };
const NAV_CONFIG: { MIN_SPEED: number; MAX_SPEED: number; DEFAULT_SPEED: number; SCROLL_SENSITIVITY: number; KEY_ACCELERATION: number; LERP_FACTOR: number; /* ... */ };
const INFINITE_TUNNEL_CONFIG: { POINTS_PER_100_UNITS: number; MIN_AHEAD_BUFFER: number; CURVE_REBUILD_THROTTLE: number; GEOMETRY_REBUILD_THROTTLE: number; INITIAL_LENGTH: number; /* ... */ };
const WARP_CONFIG: { WARP_MAX_VELOCITY: number; WARP_CRUISE_VELOCITY: number; DEFAULT_DURATION: number; COOLDOWN: number; FOV_WARP_MAX: number; FOV_NORMAL: number; RING_DENSITY_MULTIPLIER: number; /* ... */ };
const EFFECTS_CONFIG: { RING_COUNT: number; RING_BASE_RADIUS: number; PARTICLE_COUNT: number; COLOR_PURPLE: string; COLOR_CYAN: string; COLOR_PINK: string; /* ... */ };
```

[Configuration Constants](./constants.md)

### Infinite Curve

Procedural infinite tunnel generation using a sliding window of control points. Call `update()` every frame.

```typescript { .api }
class InfiniteCurve {
  constructor(initialSeed?: number);
  update(cameraZ: number, velocity: number): void;
  getPointAtZ(z: number): THREE.Vector3;
  getTangentAtZ(z: number): THREE.Vector3;
  getCurve(): THREE.CatmullRomCurve3;
  getGeometry(): THREE.TubeGeometry;
  isGeometryDirty(): boolean;
  zToLocalT(z: number): number;
  getMinZ(): number;
  getMaxZ(): number;
  getCurveLength(): number;
  generateAhead(targetZ: number): boolean;
  trimBehind(cameraZ: number): boolean;
  dispose(): void;
}
```

[Infinite Curve](./infinite-curve.md)

### Wormhole Context

Central navigation state management. Provides state, actions, and meta via React context. Must be placed inside an R3F Canvas.

```typescript { .api }
function WormholeProvider(props: WormholeProviderProps): JSX.Element;
function useWormhole(): WormholeContextValue;
function useWormholeState(): WormholeState;
function useWormholeActions(): WormholeActions;
function useWormholeMeta(): WormholeMeta;

interface WormholeState {
  progress: number;
  velocity: number;
  targetVelocity: number;
  cameraMode: 'first-person' | 'third-person';
  isWarping: boolean;
  warpProgress: number;
  warpPhase: 'idle' | 'accelerating' | 'cruising' | 'decelerating';
  warpIntensity: number;
}
```

[Wormhole Context](./wormhole-context.md)

### Scene Components

Composable R3F scene components for rendering the wormhole. Use `WormholeScene` for a complete scene, or compose from `Wormhole.*` subcomponents.

```typescript { .api }
function WormholeScene(props: WormholeSceneProps): JSX.Element;
function MinimalWormholeScene(props: WormholeSceneProps): JSX.Element;
function PerformanceWormholeScene(props: WormholeSceneProps): JSX.Element;
const Wormhole: {
  Provider: typeof WormholeProvider;
  Frame: React.FC<{ children: React.ReactNode }>;
  Stars: React.FC;
  Lighting: React.FC;
  Tunnel: typeof TunnelGeometry;
  Rings: typeof GlowRings;
  Fog: React.FC;
};
```

[Scene Components](./scene-components.md)

### Tunnel Math Utilities

Legacy utility functions for segment-based curve generation, camera transforms, ring/particle placement, and math helpers.

```typescript { .api }
function generateCurvePoints(segmentIndex?: number, pointCount?: number): THREE.Vector3[];
function createTunnelCurve(segmentIndex?: number): THREE.CatmullRomCurve3;
function getCameraTransform(curve: THREE.CatmullRomCurve3, progress: number, lookAheadDistance: number): { position: THREE.Vector3; lookAt: THREE.Vector3; up: THREE.Vector3 };
function generateRingPositions(curve: THREE.CatmullRomCurve3, count: number, startProgress?: number, spacing?: number): Array<{ position: THREE.Vector3; rotation: THREE.Euler; scale: number }>;
function generateParticlePositions(curve: THREE.CatmullRomCurve3, count: number, spread: number, startProgress?: number, endProgress?: number): Float32Array;
function lerp(start: number, end: number, factor: number): number;
function smoothStep(edge0: number, edge1: number, x: number): number;
```

[Tunnel Math Utilities](./tunnel-math.md)

### Legacy Hooks

React hooks for the older segment-based tunnel system.

```typescript { .api }
function useProceduralTunnel(): { curve: THREE.CatmullRomCurve3; geometry: THREE.TubeGeometry; curveLength: number; extendTunnel: () => TunnelSegment };
function useTunnelNavigation(curve: THREE.CatmullRomCurve3): { bind: () => Record<string, unknown>; getSpeed: () => number; getProgress: () => number; stateRef: React.MutableRefObject<NavigationState> };
```

[Legacy Hooks](./hooks.md)

### UI Components

DOM-based React components for the HUD overlay and loading screen.

```typescript { .api }
function HUD(props: HUDProps): JSX.Element;
const HUDComponents: { Container: React.FC; SpeedLabel: React.FC; ControlsHint: React.FC; ControlPanel: React.FC; Title: React.FC };
function LoadingScreen(): JSX.Element;
```

[UI Components](./ui-components.md)

### Next.js App Router Pages

Server and client components that form the Next.js application shell.

[Next.js Pages](./nextjs-pages.md)
