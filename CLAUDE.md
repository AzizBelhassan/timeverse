# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
yarn dev              # Start Next.js dev server (http://localhost:3000)

# Build & Production
yarn build            # Next.js production build
yarn start            # Start production server

# Testing
yarn test             # Run Vitest in watch mode
yarn test:run         # Run all tests once
yarn test:coverage    # Run tests with coverage report
yarn test src/path/to/file.test.ts  # Run single test file

# Linting
yarn lint             # Next.js lint
```

## Architecture

A 3D wormhole tunnel exploration experience using Next.js 15, React 19, Three.js, and React Three Fiber.

### Key Technologies
- **Next.js 15** - App Router with React Server Components
- **React Three Fiber** (@react-three/fiber) - React renderer for Three.js
- **Drei** (@react-three/drei) - Useful helpers for R3F (Stars, PerformanceMonitor, shaderMaterial)
- **@use-gesture/react** - Scroll and gesture handling for navigation
- **Vitest** - Testing framework with jsdom environment

### Source Structure
```
app/                 # Next.js App Router
├── layout.tsx       # Root layout with metadata (Server Component)
├── page.tsx         # Home page with Suspense boundary ('use client')
├── loading.tsx      # Route-level loading UI (Server Component)
├── error.tsx        # Error boundary for WebGL errors ('use client')
└── not-found.tsx    # 404 page (Server Component)
src/
├── App.tsx          # Main 3D canvas component ('use client')
├── contexts/        # WormholeContext - navigation state management
├── scenes/          # 3D scene components (TunnelGeometry, GlowRings)
├── components/      # UI overlays (HUD, LoadingScreen)
└── utils/           # Math utilities, constants, InfiniteCurve
```

### Core Systems

**InfiniteCurve** (`src/utils/infiniteCurve.ts`): Manages procedural infinite tunnel generation using a sliding window of control points. Uses layered sine waves (primary/secondary/tertiary frequencies) for smooth curves. Generates ahead of camera, trims behind. Key methods:
- `update(cameraZ, velocity)` - Call every frame to manage generation
- `getPointAtZ(z)` / `getTangentAtZ(z)` - Get curve data at absolute Z position
- `zToLocalT(z)` - Convert absolute Z to curve parameter (0-1)

**Warp System**: Speed boost with visual effects. Phases: `idle` → `accelerating` → `cruising` → `decelerating`. Configuration in `WARP_CONFIG`. Shader effects include radial stretch and helicoidal (spiral) patterns.

### Core Patterns

**Compound Components**: The `Wormhole` component exports composable subcomponents:
```tsx
<Wormhole.Provider>
  <Wormhole.Frame>
    <Wormhole.Tunnel />
    <Wormhole.Rings />
  </Wormhole.Frame>
</Wormhole.Provider>
```

**Context Interface**: WormholeContext provides state/actions/meta separation:
- `useWormholeState()` - progress, velocity, warp state (isWarping, warpPhase, warpIntensity)
- `useWormholeActions()` - accelerate, decelerate, setTargetVelocity, stop, initiateWarp
- `useWormholeMeta()` - infiniteCurve, getGeometry, getSpeed, getProgress, geometryVersion

**React 19**: Uses `use()` instead of `useContext()`, no forwardRef needed for refs.

**Performance**: Components use lazy state initialization (`useState(() => expensive)`), memoization (`memo()`), and refs for transient animation values. Geometry rebuilds are throttled via `CURVE_REBUILD_THROTTLE` and `GEOMETRY_REBUILD_THROTTLE`.

### 3D Graphics

- **Tunnel**: Procedural `TubeGeometry` along a `CatmullRomCurve3` path with grid overlay
- **Camera**: Follows curve with look-ahead, uses Frenet-Serret frame for orientation
- **Shaders**: Custom vertex/fragment shaders via `shaderMaterial` for glow, pulse, radial stretch, and helicoidal warp effects
- **Instancing**: `InstancedMesh` for efficient ring rendering with per-instance colors

### Server vs Client Components

All 3D/R3F components require `'use client'` due to WebGL browser APIs. The app uses:
- **Server Components**: layout.tsx, loading.tsx, not-found.tsx (static, no JS)
- **Client Components**: page.tsx (Suspense), App.tsx, all scenes/hooks/contexts (R3F)

## Testing

Tests require WebGL mocks configured in `src/test/setup.ts`. Mock patterns:
- R3F hooks (`useThree`, `useFrame`) via vi.mock
- Store frame callbacks in global for manual invocation in tests
- Use `renderHook` with wrapper providing context

## Configuration

All tunable parameters are in `src/utils/constants.ts`:
- `TUNNEL_CONFIG` - Tube geometry, visual settings
- `NAV_CONFIG` - Speed limits, acceleration, camera offsets
- `INFINITE_TUNNEL_CONFIG` - Point density, buffer zones, sine wave frequencies
- `WARP_CONFIG` - Phase durations, velocities, visual effect strengths
- `EFFECTS_CONFIG` - Ring counts, colors, particle settings

## Agent Skills

This project uses agent skills in `.agents/skills/`:

**React Three Fiber**: r3f-fundamentals, r3f-animation, r3f-geometry, r3f-shaders, r3f-materials, r3f-lighting, r3f-textures, r3f-postprocessing, r3f-interaction, r3f-physics, r3f-loaders

**Next.js Patterns**: nextjs-app-router-fundamentals, nextjs-server-client-components, nextjs-anti-patterns, nextjs-advanced-routing

**React Patterns**: vercel-react-best-practices, vercel-composition-patterns
