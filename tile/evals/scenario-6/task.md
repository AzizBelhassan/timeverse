# Custom Wormhole Scene Composition

Build a custom wormhole scene by composing the available scene subcomponents, creating a performance-optimized variant that omits star particles but includes all other visual elements.

## Capabilities

### Compound Component Scene Assembly

Compose a custom wormhole scene using individual subcomponents:

- A scene assembled with the provider, frame, tunnel, rings, and fog renders without error [@test](./tests/scene-compose-basic.test.tsx)
- Omitting the stars subcomponent produces a scene without particle background, while tunnel and rings remain [@test](./tests/scene-no-stars.test.tsx)
- Omitting the rings subcomponent produces a scene with the tunnel but without glow ring effects [@test](./tests/scene-no-rings.test.tsx)
- The provider subcomponent correctly passes onSpeedChange and onActionsReady callbacks through when used directly [@test](./tests/scene-provider-callbacks.test.tsx)

## Implementation

[@generates](./src/CustomWormholeScene.tsx)

## API

```typescript { #api }
interface CustomWormholeSceneProps {
  onSpeedChange?: (speed: number) => void;
  onActionsReady?: (actions: { stop: () => void; toggleCameraMode: () => void; initiateWarp: () => void }) => void;
  showRings?: boolean;
}

export function CustomWormholeScene(props: CustomWormholeSceneProps): JSX.Element;
```

## Dependencies { .dependencies }

### timeverse 0.0.0 { .dependency }

Provides the `Wormhole` compound component object with subcomponents: `Wormhole.Provider`, `Wormhole.Frame`, `Wormhole.Tunnel`, `Wormhole.Rings`, `Wormhole.Stars`, `Wormhole.Lighting`, `Wormhole.Fog`. Also exports `WormholeScene`, `MinimalWormholeScene`, and `PerformanceWormholeScene` pre-built variants.

[@satisfied-by](timeverse)
