# Scene Components

Scene components render the 3D wormhole visuals. All components must be inside an R3F `Canvas` element.

Import:
```typescript
import {
  WormholeScene,
  MinimalWormholeScene,
  PerformanceWormholeScene,
  Wormhole,
} from './src/scenes/WormholeScene';
import { TunnelGeometry } from './src/scenes/TunnelGeometry';
import { GlowRings } from './src/scenes/GlowRings';
```

## Types

```typescript { .api }
type WarpPhase = 'idle' | 'accelerating' | 'cruising' | 'decelerating';

interface WormholeSceneProps {
  /** Called each frame with normalized speed (-1..1, can exceed during warp) */
  onSpeedChange?: (speed: number) => void;
  /** Called when warp state changes */
  onWarpStateChange?: (isWarping: boolean, warpPhase: WarpPhase, warpIntensity: number) => void;
  /** Called once on mount with action references */
  onActionsReady?: (actions: {
    stop: () => void;
    toggleCameraMode: () => void;
    initiateWarp: () => void;
  }) => void;
}
```

## Capabilities

### WormholeScene

Complete wormhole scene. Renders stars, lighting, tunnel geometry, glow rings, and fog. Wraps all content in `WormholeProvider`.

```typescript { .api }
function WormholeScene(props: WormholeSceneProps): JSX.Element;
```

**Usage:**
```typescript
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { WormholeScene } from './src/scenes/WormholeScene';

<Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 5] }}>
  <Suspense fallback={null}>
    <WormholeScene
      onSpeedChange={(speed) => setSpeed(speed)}
      onActionsReady={(actions) => setActions(actions)}
      onWarpStateChange={(isWarping, phase) => setIsWarping(isWarping)}
    />
  </Suspense>
</Canvas>
```

### MinimalWormholeScene

Includes stars, lighting, tunnel, rings, and fog — same visual content as `WormholeScene`. Accepts `WormholeSceneProps` but **only `onSpeedChange` is forwarded** to `WormholeProvider`; `onWarpStateChange` and `onActionsReady` are accepted in the type signature but are not wired. Use `WormholeScene` if you need those callbacks.

```typescript { .api }
function MinimalWormholeScene(props: WormholeSceneProps): JSX.Element;
```

### PerformanceWormholeScene

Performance-optimized variant. Renders only lighting, tunnel geometry, and fog — excludes `Stars` and `GlowRings`. Accepts `WormholeSceneProps` but **only `onSpeedChange` is forwarded** to `WormholeProvider`; `onWarpStateChange` and `onActionsReady` are ignored. Use `WormholeScene` if you need those callbacks.

```typescript { .api }
function PerformanceWormholeScene(props: WormholeSceneProps): JSX.Element;
```

### Wormhole (Compound Component)

Object containing all wormhole sub-components for custom scene composition. Use this when you need to arrange or replace individual visual elements.

```typescript { .api }
const Wormhole: {
  /** Context provider; must be inside R3F Canvas. See WormholeProviderProps */
  Provider: typeof WormholeProvider;
  /** Wrapper for composing scene children (pass-through fragment) */
  Frame: React.FC<{ children: React.ReactNode }>;
  /** Background star skybox; follows camera. Reacts to warpIntensity (stars speed up) */
  Stars: React.FC;
  /** Scene lighting: ambient light + 2 point lights (cyan and purple) */
  Lighting: React.FC;
  /** Tunnel tube mesh with custom shader. Consumes WormholeContext. No props. */
  Tunnel: typeof TunnelGeometry;
  /** Instanced glow rings ahead of camera. Consumes WormholeContext. No props. */
  Rings: typeof GlowRings;
  /** Atmospheric fog ('#0a0015', near: 10, far: 200) */
  Fog: React.FC;
};
```

**Custom composition example:**
```typescript
import { Canvas } from '@react-three/fiber';
import { Wormhole } from './src/scenes/WormholeScene';

// Scene without stars (custom background)
function CustomWormhole({ onSpeedChange }) {
  return (
    <Canvas>
      <Wormhole.Provider onSpeedChange={onSpeedChange}>
        <Wormhole.Frame>
          {/* Custom background instead of stars */}
          <color attach="background" args={['#000010']} />
          <Wormhole.Lighting />
          <Wormhole.Tunnel />
          <Wormhole.Rings />
          <Wormhole.Fog />
        </Wormhole.Frame>
      </Wormhole.Provider>
    </Canvas>
  );
}
```

### TunnelGeometry

Memoized R3F component. Renders the procedural tunnel tube mesh with a custom GLSL shader. Consumes `WormholeContext` for geometry and warp state — requires `WormholeProvider` ancestor. No props.

```typescript { .api }
const TunnelGeometry: React.MemoExoticComponent<() => JSX.Element>;
```

**Shader details:**
- Uniforms: `time` (float), `color1` (vec3, purple), `color2` (vec3, cyan), `opacity` (float), `warpIntensity` (float)
- Vertex: passes `vPosition` and `vUv` to fragment
- Fragment effects during warp:
  - Radial stretch from UV center based on `warpIntensity`
  - Helicoidal (spiral) pattern — 4 spiral arms rotating with `time`
  - Speed lines along Z axis
  - Pulsing brightness
  - Color shifts toward white
- Material: `THREE.BackSide` rendering (camera inside tunnel), `transparent: true`, `depthWrite: false`
- Grid lines overlay (rings + longitudinal lines) hidden when `warpIntensity >= 0.1`

### GlowRings

Memoized R3F component. Renders instanced torus rings ahead of the camera, oriented perpendicular to the tunnel curve. Consumes `WormholeContext`. No props.

```typescript { .api }
const GlowRings: React.MemoExoticComponent<() => JSX.Element>;
```

**Behavior:**
- `EFFECTS_CONFIG.RING_COUNT * WARP_CONFIG.RING_DENSITY_MULTIPLIER` rings total
- Rings are placed along Z-axis ahead of camera with `RING_Z_SPACING` (10 units) between them
- During warp, spacing decreases to `WARP_CONFIG.RING_SPACING_WARP` (3 units) for denser effect
- Color: cyan (`#00d4ff`) near camera → blue (`#0044ff`) far → white (`#ffffff`) during warp
- Uses `InstancedMesh` with `THREE.AdditiveBlending` for glow effect
- `frustumCulled={false}` (rings are always ahead, no culling needed)
- Rings at positions beyond `infiniteCurve.getMaxZ() - 10` are hidden (scaled to 0)

## Scene Setup Requirements

All scene components require:
1. Placement inside an R3F `Canvas`
2. WebGL-capable browser
3. Wrap in `Suspense` (async Three.js initialization)

Recommended Canvas configuration:
```typescript
<Canvas
  camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 5] }}
  dpr={1.5}
  gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
  style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
>
  <Suspense fallback={null}>
    <WormholeScene ... />
  </Suspense>
</Canvas>
```
