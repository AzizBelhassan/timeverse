# Infinite Curve

`InfiniteCurve` manages procedural infinite tunnel generation using a sliding window of control points. It generates curve control points ahead of the camera and removes old points behind it, creating the illusion of infinite travel. Curve shapes are driven by three layers of sine waves (primary, secondary, tertiary) with configurable frequencies and amplitudes.

Import:
```typescript
import { InfiniteCurve } from './src/utils/infiniteCurve';
```

## Capabilities

### Constructor

```typescript { .api }
class InfiniteCurve {
  /**
   * @param initialSeed - Optional seed for phase offset randomization.
   *   Different seeds produce different curve shapes.
   *   Defaults to Math.random() * 10000 if not provided.
   */
  constructor(initialSeed?: number);
}
```

**Usage:**
```typescript
// Random curve shape each time
const curve = new InfiniteCurve();

// Deterministic curve for testing/replay
const curve = new InfiniteCurve(42);
```

### Frame Update

Call `update()` every animation frame to advance the sliding window of curve points. This generates new points ahead of the camera and trims old points behind.

```typescript { .api }
/**
 * Advance the sliding window based on camera position and velocity.
 * Must be called every frame (e.g., from useFrame in R3F).
 * @param cameraZ - Camera's current absolute Z position (positive, increasing with forward travel)
 * @param velocity - Current velocity; used to calculate look-ahead buffer
 */
update(cameraZ: number, velocity: number): void;
```

**Usage:**
```typescript
import { useFrame } from '@react-three/fiber';

useFrame(() => {
  infiniteCurve.update(cameraZ, currentVelocity);
});
```

### Curve Access

Get the current `CatmullRomCurve3` for use with Three.js operations. The curve is rebuilt when dirty, with throttling defined by `INFINITE_TUNNEL_CONFIG.CURVE_REBUILD_THROTTLE`.

```typescript { .api }
/**
 * Get the current CatmullRomCurve3.
 * Rebuilds if dirty (throttled to CURVE_REBUILD_THROTTLE ms).
 * @returns The current curve. Will not be null after construction.
 */
getCurve(): THREE.CatmullRomCurve3;
```

### Geometry Access

Get the current `TubeGeometry` for the tunnel mesh. Rebuilds when dirty, with throttling defined by `INFINITE_TUNNEL_CONFIG.GEOMETRY_REBUILD_THROTTLE`. Disposes previous geometry to prevent memory leaks.

```typescript { .api }
/**
 * Get the current TubeGeometry.
 * Rebuilds if dirty (throttled to GEOMETRY_REBUILD_THROTTLE ms).
 * Automatically disposes old geometry on rebuild.
 * @returns The current TubeGeometry. Will not be null after construction.
 */
getGeometry(): THREE.TubeGeometry;

/**
 * Check if geometry needs an update (useful for polling in useFrame).
 * @returns true if geometry has been marked dirty since last rebuild.
 */
isGeometryDirty(): boolean;
```

**Usage:**
```typescript
// Poll in useFrame to detect geometry changes
useFrame(() => {
  if (infiniteCurve.isGeometryDirty()) {
    const newGeometry = infiniteCurve.getGeometry();
    if (meshRef.current) {
      meshRef.current.geometry = newGeometry;
    }
  }
});
```

### Position Queries

Query 3D positions and tangents along the curve by absolute Z coordinate.

```typescript { .api }
/**
 * Get the 3D position on the curve at an absolute Z coordinate.
 * @param z - Absolute Z position (same coordinate system as cameraZ in update())
 * @returns THREE.Vector3 point on the curve
 */
getPointAtZ(z: number): THREE.Vector3;

/**
 * Get the tangent direction on the curve at an absolute Z coordinate.
 * @param z - Absolute Z position
 * @returns Normalized THREE.Vector3 tangent
 */
getTangentAtZ(z: number): THREE.Vector3;

/**
 * Convert absolute Z position to local curve parameter t (0–1).
 * t=0 is the oldest generated point, t=1 is the newest.
 * Clamped to [0.001, 0.999] to avoid curve endpoint issues.
 * @param z - Absolute Z position
 * @returns t parameter in range [0.001, 0.999]
 */
zToLocalT(z: number): number;
```

**Usage:**
```typescript
// Position and orient an object along the tunnel
const position = infiniteCurve.getPointAtZ(cameraZ);
const tangent = infiniteCurve.getTangentAtZ(cameraZ);
object.position.copy(position);
object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
```

### Window Extent Queries

Query the current extent of the sliding window of generated points.

```typescript { .api }
/**
 * Get the minimum (oldest) Z coordinate in the current window.
 * @returns Minimum Z value of oldest generated control point
 */
getMinZ(): number;

/**
 * Get the maximum (newest) Z coordinate in the current window.
 * @returns Maximum Z value of newest generated control point
 */
getMaxZ(): number;

/**
 * Get the total length of the current curve window.
 * @returns maxZ - minZ
 */
getCurveLength(): number;
```

### Manual Generation and Trimming

For advanced use cases, manually trigger point generation or trimming.

```typescript { .api }
/**
 * Generate control points up to targetZ (if not already generated).
 * @param targetZ - Target Z position to generate up to
 * @returns true if new points were added
 */
generateAhead(targetZ: number): boolean;

/**
 * Remove points older than (cameraZ - BEHIND_KEEP).
 * Always keeps at least 4 points (minimum for valid CatmullRomCurve3).
 * @param cameraZ - Current camera Z position
 * @returns true if points were removed
 */
trimBehind(cameraZ: number): boolean;
```

### Cleanup

```typescript { .api }
/**
 * Dispose Three.js geometry resources and clear all internal state.
 * Call when removing the tunnel (e.g., component unmount).
 */
dispose(): void;
```

**Usage:**
```typescript
// In React useEffect cleanup
useEffect(() => {
  const curve = new InfiniteCurve();
  return () => curve.dispose();
}, []);
```

## Complete Integration Example

```typescript
import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { InfiniteCurve } from './src/utils/infiniteCurve';

function MyTunnel() {
  const [infiniteCurve] = useState(() => new InfiniteCurve());
  const meshRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);
  const velocityRef = useRef(0.3);

  useEffect(() => {
    return () => infiniteCurve.dispose();
  }, [infiniteCurve]);

  useFrame((_, delta) => {
    // Advance camera position
    progressRef.current += velocityRef.current * delta * 50;

    // Update curve (generates ahead, trims behind)
    infiniteCurve.update(progressRef.current, velocityRef.current);

    // Update mesh geometry if changed
    if (infiniteCurve.isGeometryDirty() && meshRef.current) {
      meshRef.current.geometry = infiniteCurve.getGeometry();
    }

    // Get camera transform from curve
    const pos = infiniteCurve.getPointAtZ(progressRef.current);
    // ... apply to camera
  });

  return (
    <mesh ref={meshRef} geometry={infiniteCurve.getGeometry()}>
      <meshBasicMaterial side={THREE.BackSide} color="#4a00e0" transparent opacity={0.3} />
    </mesh>
  );
}
```
