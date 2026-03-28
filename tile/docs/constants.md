# Configuration Constants

All configuration constants are exported from `src/utils/constants.ts` as `as const` TypeScript objects. They control tunnel geometry, navigation physics, infinite generation, warp behavior, and visual effects.

## Capabilities

### Tunnel Configuration (`TUNNEL_CONFIG`)

Controls the physical geometry of the tunnel tube and visual appearance.

```typescript { .api }
const TUNNEL_CONFIG: {
  readonly CURVE_SEGMENTS: 200;        // Number of control points for curve generation
  readonly CURVE_LENGTH: 500;          // Total length of each curve segment
  readonly CURVE_AMPLITUDE: 15;        // Sine wave amplitude for X/Y deviation
  readonly CURVE_FREQUENCY: 0.02;      // Sine wave frequency for curve shape
  readonly TUBE_RADIUS: 8;             // Radius of the tunnel tube (world units)
  readonly TUBE_RADIAL_SEGMENTS: 24;   // Circular cross-section subdivisions
  readonly TUBE_TUBULAR_SEGMENTS: 400; // Lengthwise geometry subdivisions
  readonly SEGMENT_LENGTH: 100;        // Length per recycling segment
  readonly RECYCLE_THRESHOLD: 0.7;     // Fraction of segment before recycling
  readonly TUNNEL_COLOR: '#4a00e0';    // Default tunnel mesh color (purple)
  readonly TUNNEL_OPACITY: 0.3;        // Tunnel mesh opacity (0–1)
};
```

**Usage:**
```typescript
import { TUNNEL_CONFIG } from './src/utils/constants';

// Use in custom geometry creation
const geometry = new THREE.TubeGeometry(
  curve,
  TUNNEL_CONFIG.TUBE_TUBULAR_SEGMENTS,
  TUNNEL_CONFIG.TUBE_RADIUS,
  TUNNEL_CONFIG.TUBE_RADIAL_SEGMENTS,
  false
);
```

### Navigation Configuration (`NAV_CONFIG`)

Controls speed limits, input sensitivity, camera behavior, and physics.

```typescript { .api }
const NAV_CONFIG: {
  readonly MIN_SPEED: -1;              // Minimum speed (negative = backwards)
  readonly MAX_SPEED: 1;               // Maximum normal speed
  readonly DEFAULT_SPEED: 0.3;         // Initial speed on load
  readonly SCROLL_SENSITIVITY: 0.0005; // Scroll wheel delta → velocity change
  readonly KEY_ACCELERATION: 0.02;     // Per-frame velocity change from keys
  readonly FRICTION: 0.98;             // Friction multiplier (reserved)
  readonly LERP_FACTOR: 0.1;           // Velocity smoothing per frame (0–1)
  readonly LOOK_AHEAD_DISTANCE: 0.01;  // Look-ahead along curve for legacy camera
  readonly CAMERA_OFFSET: 0.001;       // Camera position offset (legacy)
};
```

### Infinite Tunnel Configuration (`INFINITE_TUNNEL_CONFIG`)

Controls the procedural infinite tunnel generation system — point density, sliding window buffers, throttling, and sine wave parameters for curve shape.

```typescript { .api }
const INFINITE_TUNNEL_CONFIG: {
  readonly POINTS_PER_100_UNITS: 20;      // Control point density (per 100 units)
  readonly POINT_SPACING: 5;              // World units between control points
  readonly MIN_AHEAD_BUFFER: 300;         // Min units ahead to generate
  readonly MAX_AHEAD_BUFFER: 600;         // Max buffer at high speeds
  readonly BEHIND_KEEP: 50;              // Units behind camera to retain
  readonly CURVE_REBUILD_THROTTLE: 200;   // ms minimum between curve rebuilds
  readonly GEOMETRY_REBUILD_THROTTLE: 500;// ms minimum between geometry rebuilds
  // Primary wave — large, slow sweeping curves
  readonly PRIMARY_FREQUENCY: 0.008;
  readonly PRIMARY_AMPLITUDE: 12;
  // Secondary wave — medium variation
  readonly SECONDARY_FREQUENCY: 0.02;
  readonly SECONDARY_AMPLITUDE: 5;
  // Tertiary wave — subtle detail
  readonly TERTIARY_FREQUENCY: 0.035;
  readonly TERTIARY_AMPLITUDE: 2;
  readonly MAX_OFFSET: 20;               // Maximum XY offset from center line
  readonly INITIAL_LENGTH: 500;          // Units to generate at initialization
};
```

### Warp/Boost Configuration (`WARP_CONFIG`)

Controls the three-phase warp boost system (accelerating → cruising → decelerating) and associated visual effects.

```typescript { .api }
const WARP_CONFIG: {
  // Phase fractions (must sum to 1.0)
  readonly ACCEL_PHASE: 0.2;           // 20% of duration = acceleration
  readonly CRUISE_PHASE: 0.6;          // 60% of duration = cruise
  readonly DECEL_PHASE: 0.2;           // 20% of duration = deceleration

  // Velocities (normal MAX_SPEED = 1)
  readonly WARP_MAX_VELOCITY: 8;       // Peak velocity during acceleration
  readonly WARP_CRUISE_VELOCITY: 6;    // Sustained cruise velocity

  // Timing (milliseconds)
  readonly DEFAULT_DURATION: 4000;     // Total warp duration
  readonly COOLDOWN: 2000;             // Cooldown between warps
  readonly EARLY_DECEL_DURATION: 1000; // Duration when stop() called mid-warp

  // Visual effects
  readonly RADIAL_STRETCH_MAX: 0.4;    // Shader radial distortion strength
  readonly FOV_WARP_MAX: 120;          // Max FOV during warp (degrees)
  readonly FOV_NORMAL: 75;             // Normal FOV (degrees)
  readonly RING_DENSITY_MULTIPLIER: 3; // Ring count multiplier during warp
  readonly RING_SPACING_WARP: 3;       // Reduced ring Z spacing during warp (normal: 10)
};
```

**Usage:**
```typescript
import { WARP_CONFIG } from './src/utils/constants';

// Check if warp is on cooldown
const canWarp = (lastWarpEndTime: number) =>
  performance.now() - lastWarpEndTime >= WARP_CONFIG.COOLDOWN;
```

### Visual Effects Configuration (`EFFECTS_CONFIG`)

Controls ring geometry, particle settings, star counts, and color palette.

```typescript { .api }
const EFFECTS_CONFIG: {
  // Glow rings
  readonly RING_COUNT: 40;             // Total rings ahead of camera
  readonly RING_SPACING: 0.02;         // Legacy ring spacing (fraction, not used in active system)
  readonly RING_BASE_RADIUS: 7;        // Torus outer radius
  readonly RING_TUBE_RADIUS: 0.04;     // Torus tube radius
  readonly RING_COLOR_PRIMARY: '#00d4ff';   // Cyan — rings near camera
  readonly RING_COLOR_SECONDARY: '#4a00e0'; // Purple — legacy second color

  // Particles
  readonly PARTICLE_COUNT: 200;
  readonly PARTICLE_SIZE: 0.3;
  readonly PARTICLE_SPREAD: 6;         // Radial spread radius inside tunnel
  readonly PARTICLE_SPEED: 0.5;

  // Stars background (used by Drei <Stars>)
  readonly STARS_COUNT: 2000;          // Legacy; actual scene uses different values
  readonly STARS_DEPTH: 100;
  readonly STARS_FACTOR: 4;

  // Color palette
  readonly COLOR_PURPLE: '#4a00e0';
  readonly COLOR_CYAN: '#00d4ff';
  readonly COLOR_PINK: '#ff00ff';
};
```
