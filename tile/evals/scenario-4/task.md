# Warp Phase Visual Effects Controller

Build a React Three Fiber component that drives visual effects (FOV, material opacity, color tint) based on the warp phase lifecycle, smoothly transitioning between phases.

## Capabilities

### Warp Phase State Transitions

Implement a component that reacts to all four warp phases with appropriate visual responses:

- In the `idle` phase, warpIntensity is 0 and visual effects are at their baseline values [@test](./tests/phase-idle.test.tsx)
- In the `accelerating` phase, warpIntensity ramps from 0 to 1 and the FOV increases toward the warp maximum [@test](./tests/phase-accelerating.test.tsx)
- In the `cruising` phase, warpIntensity is at 1 and visual effects are at full strength [@test](./tests/phase-cruising.test.tsx)
- In the `decelerating` phase, warpIntensity fades from 1 back to 0 and effects smoothly return to baseline [@test](./tests/phase-decelerating.test.tsx)

## Implementation

[@generates](./src/WarpEffectsController.tsx)

## API

```typescript { #api }
interface WarpEffectsControllerProps {
  onIntensityChange?: (intensity: number) => void;
}

export function WarpEffectsController(props: WarpEffectsControllerProps): JSX.Element;
```

## Dependencies { .dependencies }

### timeverse 0.0.0 { .dependency }

Provides `useWormholeState` for reading `warpPhase` ('idle' | 'accelerating' | 'cruising' | 'decelerating'), `warpIntensity` (0-1 float), and `isWarping` boolean. Also provides `WARP_CONFIG` constants for FOV limits (FOV_NORMAL=75, FOV_WARP_MAX=120) and phase durations (ACCEL_PHASE=0.2, CRUISE_PHASE=0.6, DECEL_PHASE=0.2).

[@satisfied-by](timeverse)
