# Tunnel Speed Controller

Build a React component that provides a custom keyboard and button interface for controlling tunnel navigation speed, using the wormhole action callbacks for acceleration, deceleration, and stopping.

## Capabilities

### Speed Control Actions

Implement speed control using the provided navigation action callbacks:

- Calling the accelerate action increases the target velocity by one step, capped at the maximum speed of 1.0 [@test](./tests/accelerate-clamp.test.tsx)
- Calling the decelerate action decreases the target velocity by one step, floored at the minimum speed of -1.0 [@test](./tests/decelerate-clamp.test.tsx)
- Calling the stop action sets both velocity and target velocity to 0 immediately when not warping [@test](./tests/stop-action.test.tsx)
- Calling setTargetVelocity with a value outside the -1 to 1 range results in a clamped value at the boundary [@test](./tests/set-target-velocity-clamp.test.tsx)

## Implementation

[@generates](./src/SpeedController.tsx)

## API

```typescript { #api }
interface SpeedControllerProps {
  onSpeedChange?: (speed: number) => void;
}

export function SpeedController(props: SpeedControllerProps): JSX.Element;
```

## Dependencies { .dependencies }

### timeverse 0.0.0 { .dependency }

Provides `useWormholeActions` hook with `accelerate`, `decelerate`, `setTargetVelocity`, and `stop` action callbacks. Also provides `useWormholeState` for reading current velocity and `NAV_CONFIG` constants for speed limits.

[@satisfied-by](timeverse)
