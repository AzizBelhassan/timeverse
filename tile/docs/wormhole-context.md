# Wormhole Context

`WormholeContext` is the central navigation state management system. It manages camera progress along the tunnel, velocity, warp/boost state, and camera mode. It integrates keyboard and scroll-wheel input and runs the animation loop via `useFrame`.

**Important**: `WormholeProvider` must be inside an R3F `Canvas` component because it uses `useFrame` and `useThree` internally.

Import:
```typescript
import {
  WormholeContext,
  WormholeProvider,
  useWormhole,
  useWormholeState,
  useWormholeActions,
  useWormholeMeta,
} from './src/contexts/WormholeContext';
```

## Types

```typescript { .api }
type CameraMode = 'first-person' | 'third-person';

type WarpPhase = 'idle' | 'accelerating' | 'cruising' | 'decelerating';

interface WormholeState {
  /** Absolute Z position along tunnel (unbounded, increases with forward travel at ~50 units/sec at max speed) */
  progress: number;
  /** Actual current velocity. Range: -1 to 1 normally; up to 8 during warp */
  velocity: number;
  /** Target velocity being lerped toward. Range: MIN_SPEED to MAX_SPEED */
  targetVelocity: number;
  /** Current camera mode */
  cameraMode: CameraMode;
  /** Whether warp boost is active */
  isWarping: boolean;
  /** Warp completion fraction (0–1) */
  warpProgress: number;
  /** Current phase of warp sequence */
  warpPhase: WarpPhase;
  /** Warp effect intensity for visual effects (0–1); 0 = no effect, 1 = full warp */
  warpIntensity: number;
}

interface WormholeActions {
  /** Increase targetVelocity by NAV_CONFIG.KEY_ACCELERATION (clamped to MAX_SPEED) */
  accelerate(): void;
  /** Decrease targetVelocity by NAV_CONFIG.KEY_ACCELERATION (clamped to MIN_SPEED) */
  decelerate(): void;
  /** Set targetVelocity to given value, clamped to [MIN_SPEED, MAX_SPEED] */
  setTargetVelocity(velocity: number): void;
  /** If warping: trigger early deceleration. Otherwise: set velocity and targetVelocity to 0 */
  stop(): void;
  /** Toggle between 'first-person' and 'third-person' camera modes */
  toggleCameraMode(): void;
  /** Initiate warp boost. No-op if already warping or on cooldown (WARP_CONFIG.COOLDOWN ms).
   *  Note: warp is blocked for the first WARP_CONFIG.COOLDOWN ms (2000ms) after mount
   *  due to internal lastWarpEndTime initializing to 0. */
  initiateWarp(): void;
}

interface WormholeMeta {
  /** Direct reference to the InfiniteCurve instance */
  infiniteCurve: InfiniteCurve;
  /** Get current TubeGeometry (rebuilds if dirty) */
  getGeometry(): THREE.TubeGeometry;
  /** Get current speed normalized to -1..1 range */
  getSpeed(): number;
  /** Get current absolute Z progress */
  getProgress(): number;
  /** Increments each time geometry is rebuilt. Use as React dependency to react to geometry changes. */
  geometryVersion: number;
}

interface WormholeContextValue {
  state: WormholeState;
  actions: WormholeActions;
  meta: WormholeMeta;
}

interface WormholeProviderProps {
  children: React.ReactNode;
  /** Called each frame with current normalized speed (-1..1) */
  onSpeedChange?: (speed: number) => void;
  /** Called when warp state changes */
  onWarpStateChange?: (isWarping: boolean, warpPhase: WarpPhase, warpIntensity: number) => void;
  /** Called once with action references when the provider mounts */
  onActionsReady?: (actions: {
    stop: () => void;
    toggleCameraMode: () => void;
    initiateWarp: () => void;
  }) => void;
}
```

## Capabilities

### WormholeProvider

The context provider. Must be inside an R3F Canvas. Manages all state internally using refs for performance; exposes reactive state via `useState` for consuming components.

```typescript { .api }
function WormholeProvider(props: WormholeProviderProps): JSX.Element;
```

**Built-in input handling (automatic when mounted):**
- Scroll wheel down → accelerate
- Scroll wheel up → decelerate
- `ArrowUp` / `w` → accelerate (held)
- `ArrowDown` / `s` → decelerate (held)
- `Space` → `initiateWarp()` (once per press)

**Usage:**
```typescript
import { Canvas } from '@react-three/fiber';
import { WormholeProvider } from './src/contexts/WormholeContext';
import { TunnelGeometry } from './src/scenes/TunnelGeometry';
import { useState, useCallback } from 'react';

function App() {
  const [speed, setSpeed] = useState(0);
  const [actions, setActions] = useState(null);

  return (
    <Canvas>
      <WormholeProvider
        onSpeedChange={setSpeed}
        onActionsReady={setActions}
        onWarpStateChange={(isWarping, warpPhase, warpIntensity) => {
          console.log('Warp state:', warpPhase, warpIntensity);
        }}
      >
        <TunnelGeometry />
      </WormholeProvider>
    </Canvas>
  );
}
```

### useWormhole

Full context hook. Returns the entire context value. Throws `Error` if used outside `WormholeProvider`.

```typescript { .api }
/**
 * @throws Error if used outside WormholeProvider
 */
function useWormhole(): WormholeContextValue;
```

### useWormholeState

State-only hook. Triggers re-render when any state field changes.

```typescript { .api }
function useWormholeState(): WormholeState;
```

**Usage:**
```typescript
function SpeedDisplay() {
  const { velocity, warpIntensity, isWarping } = useWormholeState();
  return <div>{Math.round(velocity * 100)}%{isWarping ? ' WARP' : ''}</div>;
}
```

### useWormholeActions

Actions-only hook. Returns stable function references (do not cause re-renders).

```typescript { .api }
function useWormholeActions(): WormholeActions;
```

**Usage:**
```typescript
function Controls() {
  const { initiateWarp, stop, toggleCameraMode } = useWormholeActions();
  return (
    <div>
      <button onClick={initiateWarp}>BOOST</button>
      <button onClick={stop}>STOP</button>
      <button onClick={toggleCameraMode}>CAMERA</button>
    </div>
  );
}
```

### useWormholeMeta

Meta/utilities hook. Provides direct InfiniteCurve access, geometry getter, and `geometryVersion` counter.

```typescript { .api }
function useWormholeMeta(): WormholeMeta;
```

**Usage:**
```typescript
// React to geometry updates
function CustomTunnel() {
  const { getGeometry, geometryVersion, infiniteCurve } = useWormholeMeta();
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.geometry = getGeometry();
    }
  }, [geometryVersion]);

  // Access curve data directly
  useFrame(() => {
    const { getProgress } = useWormholeMeta(); // (call at top level in practice)
    const pos = infiniteCurve.getPointAtZ(getProgress());
    // ...
  });
}
```

### WormholeContext (raw)

Raw React context. Use `use(WormholeContext)` in React 19, or `useContext(WormholeContext)` in React 18.

```typescript { .api }
const WormholeContext: React.Context<WormholeContextValue | null>;
```

## Warp System Lifecycle

```
initiateWarp()
    │
    ▼
[idle] ──► [accelerating] (20% of DEFAULT_DURATION)
              │  velocity ramps from MAX_SPEED → WARP_MAX_VELOCITY (easeInQuad)
              │  warpIntensity ramps 0 → 1
              ▼
          [cruising] (60% of DEFAULT_DURATION)
              │  velocity = WARP_CRUISE_VELOCITY + oscillation
              │  warpIntensity = 1
              ▼
          [decelerating] (20% of DEFAULT_DURATION)
              │  velocity ramps WARP_CRUISE_VELOCITY → pre-warp velocity (easeOutQuad)
              │  warpIntensity ramps 1 → 0
              ▼
           [idle]
```

Calling `stop()` during warp: immediately transitions to `decelerating` and shortens duration to `WARP_CONFIG.EARLY_DECEL_DURATION`.

## Camera Modes

**first-person** (default): Camera is inside the tunnel at curve position, with layered sine-wave "wandering" offset that creates organic parallax movement. Camera rolls slightly with the wander direction.

**third-person**: Camera is positioned above and to the side of the tunnel, looking far ahead. Height and lateral offset vary with the wander pattern.

Toggle with `actions.toggleCameraMode()` or keyboard (if wired externally).
