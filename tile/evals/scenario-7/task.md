# Infinite Tunnel Curve Tracker

Build a utility class that wraps the infinite procedural curve system to track and report the camera position within the tunnel, including the local curve parameter and world-space position at any absolute Z coordinate.

## Capabilities

### InfiniteCurve Position Queries

Implement a tracker that correctly uses the procedural curve API for position lookups:

- Calling the update method with a camera Z position and velocity causes the curve to generate new points ahead of that position [@test](./tests/curve-update-generates.test.tsx)
- Getting a position at a given Z returns a THREE.Vector3 within the curve's min/max Z bounds [@test](./tests/curve-point-at-z.test.tsx)
- Getting a tangent at a given Z returns a normalized THREE.Vector3 representing the tunnel direction at that point [@test](./tests/curve-tangent-at-z.test.tsx)
- Converting an absolute Z position to a local curve parameter t returns a value between 0 and 1 [@test](./tests/curve-z-to-local-t.test.tsx)

## Implementation

[@generates](./src/TunnelCurveTracker.ts)

## API

```typescript { #api }
import * as THREE from 'three';

export class TunnelCurveTracker {
  constructor();
  update(cameraZ: number, velocity: number): void;
  getPositionAt(z: number): THREE.Vector3;
  getTangentAt(z: number): THREE.Vector3;
  getLocalParameter(z: number): number;
  getMinZ(): number;
  getMaxZ(): number;
  dispose(): void;
}
```

## Dependencies { .dependencies }

### timeverse 0.0.0 { .dependency }

Provides the `InfiniteCurve` class with methods: `update(cameraZ, velocity)`, `getPointAtZ(z)`, `getTangentAtZ(z)`, `zToLocalT(z)`, `getMinZ()`, `getMaxZ()`, `getGeometry()`, `getCurve()`, `isGeometryDirty()`, and `dispose()`.

[@satisfied-by](timeverse)
