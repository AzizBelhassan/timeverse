# Wormhole Provider Integration

Build a React Three Fiber scene component that integrates the wormhole navigation system as a context provider, connecting its speed and warp state callbacks to parent component state.

## Capabilities

### Provider Mounting with Callbacks

Set up the wormhole navigation provider inside an R3F Canvas, wiring up the three lifecycle callbacks:

- When mounted with an `onSpeedChange` callback, calling the provider's `onSpeedChange` should pass the current normalized speed value to the parent [@test](./tests/provider-speed-callback.test.tsx)
- When mounted with an `onActionsReady` callback, the callback receives an object with `stop`, `toggleCameraMode`, and `initiateWarp` functions [@test](./tests/provider-actions-ready.test.tsx)
- When mounted with an `onWarpStateChange` callback, the callback fires when warp state changes, passing `isWarping` boolean and `warpPhase` string [@test](./tests/provider-warp-state.test.tsx)
- When used outside an R3F Canvas context, an appropriate error is thrown [@test](./tests/provider-outside-canvas.test.tsx)

## Implementation

[@generates](./src/WormholeSceneWrapper.tsx)

## API

```typescript { #api }
interface WormholeSceneWrapperProps {
  onSpeedChange?: (speed: number) => void;
  onWarpStateChange?: (isWarping: boolean, warpPhase: string, warpIntensity: number) => void;
  onActionsReady?: (actions: { stop: () => void; toggleCameraMode: () => void; initiateWarp: () => void }) => void;
  children?: React.ReactNode;
}

export function WormholeSceneWrapper(props: WormholeSceneWrapperProps): JSX.Element;
```

## Dependencies { .dependencies }

### timeverse 0.0.0 { .dependency }

Provides the wormhole navigation context provider (`WormholeProvider`) and its callback prop interface for speed, warp state, and actions integration.

[@satisfied-by](timeverse)
