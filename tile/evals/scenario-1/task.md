# Navigation State Consumer Component

Build a React component that consumes the wormhole navigation context and renders a live status panel showing current speed, warp state, camera mode, and progress.

## Capabilities

### Context Hook Usage

Use the appropriate navigation context hooks to read different slices of state:

- A component reading velocity via the state hook renders a value between -1 and 1 (or higher during warp) [@test](./tests/state-velocity.test.tsx)
- A component reading warpPhase displays one of: `idle`, `accelerating`, `cruising`, or `decelerating` [@test](./tests/state-warp-phase.test.tsx)
- A component reading cameraMode displays either `first-person` or `third-person` [@test](./tests/state-camera-mode.test.tsx)
- Using any navigation hook outside a provider throws an error with a message indicating provider requirement [@test](./tests/hooks-outside-provider.test.tsx)

## Implementation

[@generates](./src/NavigationStatusPanel.tsx)

## API

```typescript { #api }
export function NavigationStatusPanel(): JSX.Element;
```

## Dependencies { .dependencies }

### timeverse 0.0.0 { .dependency }

Provides `useWormholeState`, `useWormholeActions`, and `useWormholeMeta` hooks for consuming navigation context state, actions, and meta information. Also provides `WormholeProvider` for wrapping the component in tests.

[@satisfied-by](timeverse)
