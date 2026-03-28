# Legacy Hooks

These hooks implement the original, segment-based (non-infinite) tunnel system. They are still present in the codebase but superseded by `WormholeContext` + `InfiniteCurve` for active use. Use them for simpler, fixed-curve scenarios or as reference implementations.

Import:
```typescript
import { useProceduralTunnel } from './src/hooks/useProceduralTunnel';
import { useTunnelNavigation } from './src/hooks/useTunnelNavigation';
```

## Types

```typescript { .api }
interface TunnelSegment {
  curve: THREE.CatmullRomCurve3;
  geometry: THREE.TubeGeometry;
  startZ: number;  // World Z offset: segmentIndex * TUNNEL_CONFIG.SEGMENT_LENGTH
}

interface NavigationState {
  progress: number;        // 0–1 along the fixed curve
  velocity: number;        // Current actual velocity
  targetVelocity: number;  // Target being lerped toward
}
```

## Capabilities

### useProceduralTunnel

Creates a single memoized tunnel curve and geometry. Provides an `extendTunnel` function to generate the next segment manually.

**Requires**: R3F Canvas context (`'use client'`).

```typescript { .api }
/**
 * Creates and returns a memoized tunnel curve and tube geometry.
 * @returns Tunnel data and segment extension function
 */
function useProceduralTunnel(): {
  /** The main tunnel CatmullRomCurve3 (memoized) */
  curve: THREE.CatmullRomCurve3;
  /** TubeGeometry built from the curve (memoized) */
  geometry: THREE.TubeGeometry;
  /** Total arc length of the curve */
  curveLength: number;
  /** Generate the next tunnel segment (increments internal index) */
  extendTunnel: () => TunnelSegment;
};
```

**Usage:**
```typescript
'use client';
import { useProceduralTunnel } from './src/hooks/useProceduralTunnel';

function TunnelMesh() {
  const { curve, geometry, extendTunnel } = useProceduralTunnel();

  // Use geometry for mesh
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color="#4a00e0" side={THREE.BackSide} transparent opacity={0.3} />
    </mesh>
  );
}
```

### useTunnelNavigation

Camera navigation along a fixed `CatmullRomCurve3`. Integrates scroll-wheel and keyboard input via `@use-gesture/react`. Moves camera along the curve and loops back to the start at `progress >= 0.95`.

**Requires**: R3F Canvas context (`'use client'`).

```typescript { .api }
/**
 * Camera navigation hook for a fixed CatmullRomCurve3.
 * Integrates scroll wheel (bound directly to gl.domElement) and keyboard input.
 * Keyboard: ArrowUp/w = accelerate, ArrowDown/s = decelerate.
 * Updates camera position every frame via useFrame.
 * @param curve - The curve to navigate along
 * @returns Navigation controls and state accessors
 */
function useTunnelNavigation(curve: THREE.CatmullRomCurve3): {
  /**
   * Bind function from @use-gesture/react.
   * Note: scroll events are already attached to gl.domElement (via `target` option),
   * so spreading bind() on a JSX element is not required for scroll handling.
   */
  bind: () => Record<string, unknown>;
  /** Get current normalized speed in range [0, 1] (0 = MIN_SPEED, 1 = MAX_SPEED) */
  getSpeed: () => number;
  /** Get current progress along curve (0–1). Resets to 0.001 when reaching 0.95. */
  getProgress: () => number;
  /** Direct mutable ref to the internal navigation state */
  stateRef: React.MutableRefObject<NavigationState>;
};
```

**Usage:**
```typescript
'use client';
import { useProceduralTunnel } from './src/hooks/useProceduralTunnel';
import { useTunnelNavigation } from './src/hooks/useTunnelNavigation';

function Scene() {
  const { curve, geometry } = useProceduralTunnel();
  // Scroll events are auto-bound to the R3F canvas element; no need to spread bind()
  const { getSpeed, getProgress } = useTunnelNavigation(curve);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial side={THREE.BackSide} color="#4a00e0" />
    </mesh>
  );
}
```

**Speed normalization difference from WormholeContext:**
- `useTunnelNavigation.getSpeed()` returns `(velocity - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)` → range `0–1`
- `useWormholeMeta().getSpeed()` returns `velocity / MAX_SPEED` → range `-1..1`
