# Tunnel Math Utilities

Legacy utility functions for segment-based tunnel generation, camera transforms, and placement helpers. These were used in the original fixed-segment tunnel system. For the active infinite tunnel system, use `InfiniteCurve` instead.

Import:
```typescript
import {
  generateCurvePoints,
  createTunnelCurve,
  getCameraTransform,
  generateRingPositions,
  generateParticlePositions,
  lerp,
  smoothStep,
} from './src/utils/tunnelMath';
```

## Capabilities

### Curve Generation

Generate control points or a complete `CatmullRomCurve3` for a tunnel segment. Each segment is positioned along the Z axis at `segmentIndex * TUNNEL_CONFIG.SEGMENT_LENGTH`.

```typescript { .api }
/**
 * Generate control points for a procedural tunnel curve segment.
 * Uses layered sine waves for organic, flowing movement.
 * @param segmentIndex - Which segment to generate (default: 0). Determines Z offset.
 * @param pointCount - Number of control points (default: TUNNEL_CONFIG.CURVE_SEGMENTS = 200)
 * @returns Array of THREE.Vector3 control points
 */
function generateCurvePoints(
  segmentIndex?: number,
  pointCount?: number
): THREE.Vector3[];

/**
 * Create a CatmullRomCurve3 for a tunnel segment.
 * Wraps generateCurvePoints with curve construction.
 * @param segmentIndex - Which segment (default: 0)
 * @returns CatmullRomCurve3 with catmullrom type and 0.5 tension
 */
function createTunnelCurve(segmentIndex?: number): THREE.CatmullRomCurve3;
```

**Usage:**
```typescript
// Create initial segment
const curve = createTunnelCurve(0);
const geometry = new THREE.TubeGeometry(
  curve,
  TUNNEL_CONFIG.TUBE_TUBULAR_SEGMENTS,
  TUNNEL_CONFIG.TUBE_RADIUS,
  TUNNEL_CONFIG.TUBE_RADIAL_SEGMENTS,
  false
);

// Extend to next segment
const nextCurve = createTunnelCurve(1);
```

### Camera Transform

Compute camera position, look-at target, and up vector for a given progress along a curve. Uses the Frenet-Serret frame for stable orientation.

```typescript { .api }
/**
 * Get camera position and orientation from a curve at a given progress.
 * @param curve - The CatmullRomCurve3 to traverse
 * @param progress - Position along curve (0–1). Clamped to [0, 0.99].
 * @param lookAheadDistance - Additional progress for look-at point (0–1 fraction of curve)
 * @returns Camera transform data
 */
function getCameraTransform(
  curve: THREE.CatmullRomCurve3,
  progress: number,
  lookAheadDistance: number
): {
  position: THREE.Vector3;  // Camera position on curve
  lookAt: THREE.Vector3;    // Look-ahead target point on curve
  up: THREE.Vector3;        // Frenet-Serret up vector (stable orientation)
};
```

**Usage:**
```typescript
import { useFrame, useThree } from '@react-three/fiber';

useFrame((_, delta) => {
  state.progress += state.velocity * delta * 0.1;
  const transform = getCameraTransform(curve, state.progress, NAV_CONFIG.LOOK_AHEAD_DISTANCE);
  camera.position.lerp(transform.position, 0.1);
  camera.lookAt(transform.lookAt);
});
```

### Ring Position Generation

Generate placement data for glow rings along a curve. Each ring is oriented perpendicular to the curve tangent.

```typescript { .api }
/**
 * Generate ring placement data along a curve.
 * Rings are spaced by `spacing` fractions along the curve.
 * Ring scale varies sinusoidally (0.6 to 1.0) for visual interest. Formula: 0.8 + sin(t × π × 10) × 0.2.
 * @param curve - Curve to place rings along
 * @param count - Number of rings to generate
 * @param startProgress - Starting position on curve (0–1, default: 0)
 * @param spacing - Progress fraction between rings (default: 0.02)
 * @returns Array of ring transform data
 */
function generateRingPositions(
  curve: THREE.CatmullRomCurve3,
  count: number,
  startProgress?: number,
  spacing?: number
): Array<{
  position: THREE.Vector3;
  rotation: THREE.Euler;   // Quaternion-derived, perpendicular to curve tangent
  scale: number;           // Varies between 0.6 and 1.0 (sinusoidal: 0.8 ± 0.2)
}>;
```

### Particle Position Generation

Generate random particle positions distributed inside the tunnel.

```typescript { .api }
/**
 * Generate random particle positions within the tunnel tube.
 * Particles are placed at random positions along the curve
 * with random angular and radial offsets.
 * @param curve - Curve defining the tunnel centerline
 * @param count - Number of particles
 * @param spread - Maximum radial distance from curve centerline
 * @param startProgress - Start of distribution range (default: 0)
 * @param endProgress - End of distribution range (default: 0.9)
 * @returns Float32Array of [x, y, z, x, y, z, ...] length = count * 3
 */
function generateParticlePositions(
  curve: THREE.CatmullRomCurve3,
  count: number,
  spread: number,
  startProgress?: number,
  endProgress?: number
): Float32Array;
```

**Usage:**
```typescript
const positions = generateParticlePositions(
  curve,
  EFFECTS_CONFIG.PARTICLE_COUNT,
  EFFECTS_CONFIG.PARTICLE_SPREAD
);
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
```

### Math Helpers

```typescript { .api }
/**
 * Linear interpolation between start and end.
 * @param start - Start value
 * @param end - End value
 * @param factor - Blend factor (0 = start, 1 = end)
 * @returns Interpolated value
 */
function lerp(start: number, end: number, factor: number): number;

/**
 * Smooth step easing function (cubic Hermite interpolation).
 * Result is 0 at x <= edge0, 1 at x >= edge1, smooth S-curve between.
 * @param edge0 - Lower edge
 * @param edge1 - Upper edge
 * @param x - Input value
 * @returns Smoothly interpolated value in [0, 1]
 */
function smoothStep(edge0: number, edge1: number, x: number): number;
```

**Usage:**
```typescript
// Smooth camera rotation
camera.rotation.z = lerp(camera.rotation.z, targetRoll, 0.05);

// Easing for transitions
const fade = smoothStep(0, 1, transitionProgress);
```
