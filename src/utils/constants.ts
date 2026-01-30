// Tunnel configuration
export const TUNNEL_CONFIG = {
  // Curve parameters
  CURVE_SEGMENTS: 200,
  CURVE_LENGTH: 500,
  CURVE_AMPLITUDE: 15,
  CURVE_FREQUENCY: 0.02,

  // Tube geometry
  TUBE_RADIUS: 8,
  TUBE_RADIAL_SEGMENTS: 24,
  TUBE_TUBULAR_SEGMENTS: 400,

  // Segment recycling
  SEGMENT_LENGTH: 100,
  RECYCLE_THRESHOLD: 0.7,

  // Visual
  TUNNEL_COLOR: '#4a00e0',
  TUNNEL_OPACITY: 0.3,
} as const;

// Navigation configuration
export const NAV_CONFIG = {
  // Speed limits (negative allows backwards movement)
  MIN_SPEED: -1,
  MAX_SPEED: 1,
  DEFAULT_SPEED: 0.3,

  // Acceleration
  SCROLL_SENSITIVITY: 0.0005,
  KEY_ACCELERATION: 0.02,
  FRICTION: 0.98,
  LERP_FACTOR: 0.1,

  // Camera
  LOOK_AHEAD_DISTANCE: 0.01,
  CAMERA_OFFSET: 0.001,
} as const;

// Infinite tunnel configuration
export const INFINITE_TUNNEL_CONFIG = {
  // Point density and generation
  POINTS_PER_100_UNITS: 20,        // Control point density
  POINT_SPACING: 5,                // Units between control points (100 / 20)

  // Buffer zones
  MIN_AHEAD_BUFFER: 300,           // Minimum units ahead to generate
  MAX_AHEAD_BUFFER: 600,           // Maximum units ahead (for high speeds)
  BEHIND_KEEP: 50,                 // Units behind camera to keep

  // Update throttling
  CURVE_REBUILD_THROTTLE: 200,     // ms between curve rebuilds
  GEOMETRY_REBUILD_THROTTLE: 500,  // ms between geometry rebuilds

  // Smooth curve parameters (sine wave based)
  // Primary wave - large, slow curves
  PRIMARY_FREQUENCY: 0.008,        // Very slow oscillation
  PRIMARY_AMPLITUDE: 12,           // Gentle amplitude

  // Secondary wave - medium variation
  SECONDARY_FREQUENCY: 0.02,       // Slightly faster
  SECONDARY_AMPLITUDE: 5,          // Smaller amplitude

  // Tertiary wave - subtle detail
  TERTIARY_FREQUENCY: 0.035,       // Even faster but subtle
  TERTIARY_AMPLITUDE: 2,           // Very small

  MAX_OFFSET: 20,                  // Maximum XY offset from center

  // Initial curve
  INITIAL_LENGTH: 500,             // Initial tunnel length to generate
} as const;

// Warp/Boost configuration
export const WARP_CONFIG = {
  // Phase durations (percentages of total warp time)
  ACCEL_PHASE: 0.2,           // 20% - rapid acceleration
  CRUISE_PHASE: 0.6,          // 60% - max speed
  DECEL_PHASE: 0.2,           // 20% - smooth slowdown

  // Velocity (normal max is 1)
  WARP_MAX_VELOCITY: 8,       // Peak during acceleration
  WARP_CRUISE_VELOCITY: 6,    // Sustained speed

  // Timing
  DEFAULT_DURATION: 4000,     // 4 seconds total
  COOLDOWN: 2000,             // 2 seconds between warps
  EARLY_DECEL_DURATION: 1000, // 1 second for early stop deceleration

  // Visual effects
  RADIAL_STRETCH_MAX: 0.4,    // Shader distortion strength
  FOV_WARP_MAX: 120,          // Degrees (normal is 75)
  FOV_NORMAL: 75,             // Normal FOV
  RING_DENSITY_MULTIPLIER: 3, // 3x more rings during warp
  RING_SPACING_WARP: 3,       // Reduced spacing during warp (normal is 10)
} as const;

// Visual effects configuration
export const EFFECTS_CONFIG = {
  // Glow rings
  RING_COUNT: 40,
  RING_SPACING: 0.02,
  RING_BASE_RADIUS: 7,
  RING_TUBE_RADIUS: 0.04,
  RING_COLOR_PRIMARY: '#00d4ff',
  RING_COLOR_SECONDARY: '#4a00e0',

  // Particles
  PARTICLE_COUNT: 200,
  PARTICLE_SIZE: 0.3,
  PARTICLE_SPREAD: 6,
  PARTICLE_SPEED: 0.5,

  // Stars background
  STARS_COUNT: 2000,
  STARS_DEPTH: 100,
  STARS_FACTOR: 4,

  // Colors
  COLOR_PURPLE: '#4a00e0',
  COLOR_CYAN: '#00d4ff',
  COLOR_PINK: '#ff00ff',
} as const;
