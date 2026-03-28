# Instanced Ring Placement Along Curve

Build a React Three Fiber component that renders multiple ring shapes along a procedural tunnel curve using instanced mesh rendering, positioning and orienting each ring perpendicular to the curve tangent.

## Capabilities

### InstancedMesh Ring Array

Implement efficient ring rendering by placing instanced torus shapes along the InfiniteCurve:

- Rings are positioned at regular Z intervals ahead of the camera using InfiniteCurve position queries [@test](./tests/rings-position-z-intervals.test.tsx)
- Each ring is oriented perpendicular to the tunnel direction using a quaternion derived from the curve tangent at that Z position [@test](./tests/rings-tangent-orientation.test.tsx)
- Rings beyond the InfiniteCurve's maxZ boundary are hidden by scaling to zero rather than removed from the instance buffer [@test](./tests/rings-hide-beyond-max.test.tsx)
- Ring spacing decreases during warp (based on warpIntensity) to create a denser visual effect [@test](./tests/rings-warp-density.test.tsx)

## Implementation

[@generates](./src/TunnelRingArray.tsx)

## API

```typescript { #api }
interface TunnelRingArrayProps {
  ringCount?: number;
  baseSpacing?: number;
}

export function TunnelRingArray(props: TunnelRingArrayProps): JSX.Element;
```

## Dependencies { .dependencies }

### timeverse 0.0.0 { .dependency }

Provides `useWormholeState` for `progress` and `warpIntensity`, `useWormholeMeta` for the `infiniteCurve` instance with `getPointAtZ(z)`, `getTangentAtZ(z)`, `getMaxZ()` methods. Also provides `EFFECTS_CONFIG` (RING_COUNT, RING_BASE_RADIUS, RING_TUBE_RADIUS) and `WARP_CONFIG` (RING_DENSITY_MULTIPLIER, RING_SPACING_WARP) constants.

[@satisfied-by](timeverse)
