# UI Components

DOM-based React overlay components. These do not use R3F and can be placed outside the `Canvas` element.

Import:
```typescript
import { HUD, HUDComponents } from './src/components/HUD';
import { LoadingScreen } from './src/components/LoadingScreen';
```

## Types

```typescript { .api }
type WarpPhase = 'idle' | 'accelerating' | 'cruising' | 'decelerating';

interface HUDProps {
  /** Normalized speed. Range: -1 to 1 normally; can exceed during warp. Displayed as percentage. */
  speed: number;
  /** Stop button click handler */
  onStop?: () => void;
  /** Camera toggle button click handler */
  onToggleCamera?: () => void;
  /** Boost button click handler */
  onBoost?: () => void;
  /** Whether warp is currently active; changes HUD color scheme to orange */
  isWarping?: boolean;
  /** Current warp phase; changes boost button label */
  warpPhase?: WarpPhase;
}
```

## Capabilities

### HUD

Memoized full-screen fixed-position DOM overlay. Displays:
- **Speed bar**: Bi-directional bar from center (0%) with forward/backward indication
- **Velocity readout**: Numeric percentage display; turns orange during warp
- **Control buttons**: BOOST, STOP, CAMERA (top-right panel)
- **Controls hint**: Keyboard/scroll hints (bottom-right)
- **Title**: "WORMHOLE TUNNEL" label (top-left)

All visual styles use the cyan (`#00d4ff`) color theme by default, switching to orange/gold during warp.

```typescript { .api }
const HUD: React.MemoExoticComponent<(props: HUDProps) => JSX.Element>;
```

**Usage:**
```typescript
import { HUD } from './src/components/HUD';
import { useState } from 'react';

function App() {
  const [speed, setSpeed] = useState(0);
  const [isWarping, setIsWarping] = useState(false);
  const [warpPhase, setWarpPhase] = useState<WarpPhase>('idle');
  const [actions, setActions] = useState(null);

  return (
    <>
      <Canvas>
        <WormholeScene
          onSpeedChange={setSpeed}
          onWarpStateChange={(warping, phase) => {
            setIsWarping(warping);
            setWarpPhase(phase);
          }}
          onActionsReady={setActions}
        />
      </Canvas>
      <HUD
        speed={speed}
        isWarping={isWarping}
        warpPhase={warpPhase}
        onStop={actions?.stop}
        onToggleCamera={actions?.toggleCameraMode}
        onBoost={actions?.initiateWarp}
      />
    </>
  );
}
```

**Boost button behavior by warp phase:**
- `idle` → Shows "BOOST", enabled
- `accelerating` → Shows "ACCELERATING...", disabled with pulsing animation
- `cruising` → Shows "WARPING...", disabled with pulsing animation
- `decelerating` → Shows "SLOWING...", disabled with pulsing animation

**Control button rendered text** (includes icon prefixes):
- STOP button renders as `"■ STOP"` (Unicode ■ prefix)
- CAMERA button renders as `"⎚ CAMERA"` (Unicode ⎚ prefix)
- BOOST button renders as `"BOOST"` (no prefix)

**Speed display:**
- Speed is displayed using a lerp-smoothed value: `displaySpeed += (speed - displaySpeed) * 0.1` each render
- Actual displayed percent = `Math.round(displaySpeed * 100)` — lags behind the actual `speed` prop
- During warp, displayed speed can exceed 100% (capped at 999%)
- The speed bar extends from center (0%) toward edges; backward movement goes left, forward goes right

### HUDComponents

Compound object for custom HUD layouts. Use these when you want to render only specific parts of the HUD in custom positions.

```typescript { .api }
const HUDComponents: {
  /** Full-screen fixed-position overlay container (pointerEvents: none) */
  Container: React.MemoExoticComponent<(props: { children: React.ReactNode }) => JSX.Element>;
  /** "VELOCITY" text label */
  SpeedLabel: React.MemoExoticComponent<() => JSX.Element>;
  /** Keyboard and scroll control hints (bottom-right corner text) */
  ControlsHint: React.MemoExoticComponent<() => JSX.Element>;
  /**
   * Control panel with BOOST, STOP, and CAMERA buttons
   * @param onStop - Stop button handler
   * @param onToggleCamera - Camera toggle handler
   * @param onBoost - Boost button handler
   * @param isWarping - Affects boost button appearance
   * @param warpPhase - Affects boost button label
   */
  ControlPanel: React.MemoExoticComponent<(props: {
    onStop?: () => void;
    onToggleCamera?: () => void;
    onBoost?: () => void;
    isWarping?: boolean;
    warpPhase?: WarpPhase;
  }) => JSX.Element>;
  /** "WORMHOLE TUNNEL" title text (top-left) */
  Title: React.MemoExoticComponent<() => JSX.Element>;
};
```

**Usage example (custom layout):**
```typescript
import { HUDComponents } from './src/components/HUD';

function CustomHUD({ onBoost, isWarping, warpPhase }) {
  return (
    <HUDComponents.Container>
      <HUDComponents.Title />
      {/* Custom speed display */}
      <div style={{ position: 'absolute', bottom: 40, left: 40 }}>
        <HUDComponents.SpeedLabel />
      </div>
      <HUDComponents.ControlPanel
        onBoost={onBoost}
        isWarping={isWarping}
        warpPhase={warpPhase}
      />
      <HUDComponents.ControlsHint />
    </HUDComponents.Container>
  );
}
```

### LoadingScreen

Memoized full-screen loading indicator. Displays a spinning circle, "LOADING" text, and "Initializing wormhole..." subtext on a dark (`#0a0015`) background. No props.

```typescript { .api }
const LoadingScreen: React.MemoExoticComponent<() => JSX.Element>;
```

**Usage:**
```typescript
import dynamic from 'next/dynamic';
import { LoadingScreen } from './src/components/LoadingScreen';

const WormholeApp = dynamic(() => import('./src/App'), {
  ssr: false,
  loading: () => <LoadingScreen />,
});
```
