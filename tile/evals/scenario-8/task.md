# Procedural Tunnel Path Generator

Build a utility module that generates a smooth procedural tunnel path with control points, creates a spline curve through them, and computes camera transforms for first-person navigation.

## Capabilities

### Tunnel Curve Math Functions

Implement path generation using the tunnel math utility functions:

- Generating curve points for segment index 0 returns an array of THREE.Vector3 objects with Z values starting near 0 [@test](./tests/curve-points-segment-zero.test.tsx)
- Generating curve points with a custom point count returns exactly that many points [@test](./tests/curve-points-custom-count.test.tsx)
- Creating a tunnel curve returns a CatmullRomCurve3 that can be sampled with getPointAt(t) for t in [0, 1] [@test](./tests/tunnel-curve-sample.test.tsx)
- getCameraTransform with progress 0.5 and a valid look-ahead distance returns position, lookAt, and up vectors as THREE.Vector3 instances [@test](./tests/camera-transform-vectors.test.tsx)

## Implementation

[@generates](./src/TunnelPathGenerator.ts)

## API

```typescript { #api }
import * as THREE from 'three';

export function buildTunnelPath(segmentIndex?: number, pointCount?: number): {
  points: THREE.Vector3[];
  curve: THREE.CatmullRomCurve3;
};

export function computeCameraTransform(
  curve: THREE.CatmullRomCurve3,
  progress: number,
  lookAhead: number
): {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  up: THREE.Vector3;
};
```

## Dependencies { .dependencies }

### timeverse 0.0.0 { .dependency }

Provides `generateCurvePoints(segmentIndex, pointCount)`, `createTunnelCurve(segmentIndex)`, `getCameraTransform(curve, progress, lookAheadDistance)`, `generateRingPositions(curve, count, startProgress, spacing)`, `generateParticlePositions(curve, count, spread)`, `lerp(start, end, factor)`, and `smoothStep(edge0, edge1, x)` utility functions.

[@satisfied-by](timeverse)
