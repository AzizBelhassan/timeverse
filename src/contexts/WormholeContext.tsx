'use client';

import { createContext, use, useRef, useCallback, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGesture } from '@use-gesture/react';
import * as THREE from 'three';
import { NAV_CONFIG, WARP_CONFIG } from '../utils/constants';
import { InfiniteCurve } from '../utils/infiniteCurve';
import { lerp } from '../utils/tunnelMath';

// Generic interface with state, actions, meta pattern (composition-patterns)
type CameraMode = 'first-person' | 'third-person';
type WarpPhase = 'idle' | 'accelerating' | 'cruising' | 'decelerating';

interface WormholeState {
  progress: number;        // Absolute Z position (unbounded, increases forever)
  velocity: number;
  targetVelocity: number;
  cameraMode: CameraMode;
  // Warp state
  isWarping: boolean;
  warpProgress: number;    // 0-1
  warpPhase: WarpPhase;
  warpIntensity: number;   // 0-1, for visual effects
}

interface WormholeActions {
  accelerate: () => void;
  decelerate: () => void;
  setTargetVelocity: (velocity: number) => void;
  stop: () => void;
  toggleCameraMode: () => void;
  initiateWarp: () => void;
}

interface WormholeMeta {
  infiniteCurve: InfiniteCurve;
  getGeometry: () => THREE.TubeGeometry;
  getSpeed: () => number;
  getProgress: () => number;
  geometryVersion: number;  // Increment when geometry updates
}

interface WormholeContextValue {
  state: WormholeState;
  actions: WormholeActions;
  meta: WormholeMeta;
}

// Context with null default (forces provider usage)
export const WormholeContext = createContext<WormholeContextValue | null>(null);

// Custom hook using React 19's use() (react19-no-forwardref)
export function useWormhole(): WormholeContextValue {
  const context = use(WormholeContext);
  if (!context) {
    throw new Error('useWormhole must be used within a WormholeProvider');
  }
  return context;
}

// Hook to access just the state (rerender-derived-state)
export function useWormholeState(): WormholeState {
  return useWormhole().state;
}

// Hook to access just the actions (stable references)
export function useWormholeActions(): WormholeActions {
  return useWormhole().actions;
}

// Hook to access just the meta (refs and utilities)
export function useWormholeMeta(): WormholeMeta {
  return useWormhole().meta;
}

interface WormholeProviderProps {
  children: React.ReactNode;
  onSpeedChange?: (speed: number) => void;
  onWarpStateChange?: (isWarping: boolean, warpPhase: WarpPhase, warpIntensity: number) => void;
  onActionsReady?: (actions: { stop: () => void; toggleCameraMode: () => void; initiateWarp: () => void }) => void;
}

// Easing functions for warp velocity curve
function easeInQuad(t: number): number {
  return t * t;
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

// Provider handles all state management details (state-decouple-implementation)
export function WormholeProvider({ children, onSpeedChange, onWarpStateChange, onActionsReady }: WormholeProviderProps) {
  const { camera, gl } = useThree();

  // Lazy state initialization for expensive curve computation (rerender-lazy-state-init)
  const [infiniteCurve] = useState(() => new InfiniteCurve());

  // Track geometry version for reactive updates
  const [geometryVersion, setGeometryVersion] = useState(0);

  // Use refs for transient frequent values (rerender-use-ref-transient-values)
  const stateRef = useRef<WormholeState>({
    progress: 0.001,  // Start near the beginning (absolute Z)
    velocity: NAV_CONFIG.DEFAULT_SPEED,
    targetVelocity: NAV_CONFIG.DEFAULT_SPEED,
    cameraMode: 'first-person',
    // Warp state
    isWarping: false,
    warpProgress: 0,
    warpPhase: 'idle',
    warpIntensity: 0,
  });

  // Warp timing refs
  const warpStartTime = useRef<number | null>(null);
  const warpDuration = useRef<number>(WARP_CONFIG.DEFAULT_DURATION);
  const preWarpVelocity = useRef<number>(NAV_CONFIG.DEFAULT_SPEED);
  const lastWarpEndTime = useRef<number>(0);

  // Expose state for reactive components
  const [exposedState, setExposedState] = useState<WormholeState>(stateRef.current);

  const keysPressed = useRef<Set<string>>(new Set());
  const lastGeometryCheckTime = useRef(0);

  // Stable action callbacks (rerender-functional-setstate)
  const accelerate = useCallback(() => {
    stateRef.current.targetVelocity = Math.min(
      NAV_CONFIG.MAX_SPEED,
      stateRef.current.targetVelocity + NAV_CONFIG.KEY_ACCELERATION
    );
  }, []);

  const decelerate = useCallback(() => {
    stateRef.current.targetVelocity = Math.max(
      NAV_CONFIG.MIN_SPEED,
      stateRef.current.targetVelocity - NAV_CONFIG.KEY_ACCELERATION
    );
  }, []);

  const setTargetVelocity = useCallback((velocity: number) => {
    stateRef.current.targetVelocity = Math.max(
      NAV_CONFIG.MIN_SPEED,
      Math.min(NAV_CONFIG.MAX_SPEED, velocity)
    );
  }, []);

  const stop = useCallback(() => {
    const state = stateRef.current;

    // If warping, trigger early deceleration
    if (state.isWarping && state.warpPhase !== 'decelerating') {
      state.warpPhase = 'decelerating';
      // Set warp progress to start of decel phase for smooth transition
      state.warpProgress = 1 - WARP_CONFIG.DECEL_PHASE;
      // Shorten remaining duration for early stop
      warpDuration.current = WARP_CONFIG.EARLY_DECEL_DURATION;
      warpStartTime.current = performance.now() - (state.warpProgress * warpDuration.current);
    } else if (!state.isWarping) {
      state.targetVelocity = 0;
      state.velocity = 0;
    }
  }, []);

  const toggleCameraMode = useCallback(() => {
    stateRef.current.cameraMode =
      stateRef.current.cameraMode === 'first-person' ? 'third-person' : 'first-person';
  }, []);

  const initiateWarp = useCallback(() => {
    const state = stateRef.current;
    const now = performance.now();

    // Check cooldown
    if (state.isWarping || now - lastWarpEndTime.current < WARP_CONFIG.COOLDOWN) {
      return;
    }

    // Store pre-warp velocity to return to after warp
    preWarpVelocity.current = state.targetVelocity;

    // Initialize warp state
    state.isWarping = true;
    state.warpProgress = 0;
    state.warpPhase = 'accelerating';
    state.warpIntensity = 0;
    warpStartTime.current = now;
    warpDuration.current = WARP_CONFIG.DEFAULT_DURATION;
  }, []);

  const getSpeed = useCallback(() => {
    // Returns -1 to 1 range (negative = backwards, positive = forwards)
    return stateRef.current.velocity / NAV_CONFIG.MAX_SPEED;
  }, []);

  const getProgress = useCallback(() => {
    return stateRef.current.progress;
  }, []);

  const getGeometry = useCallback(() => {
    return infiniteCurve.getGeometry();
  }, [infiniteCurve]);

  // Scroll gesture handling
  useGesture(
    {
      onWheel: ({ delta: [, dy] }) => {
        const newVelocity = stateRef.current.targetVelocity + dy * NAV_CONFIG.SCROLL_SENSITIVITY;
        setTargetVelocity(newVelocity);
      },
    },
    {
      target: gl.domElement,
      eventOptions: { passive: false },
    }
  );

  // Keyboard handling (client-event-listeners)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'w' || e.key === 's') {
        keysPressed.current.add(e.key);
      }
      // Spacebar triggers warp/boost
      if (e.code === 'Space' && !stateRef.current.isWarping) {
        e.preventDefault();
        initiateWarp();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [initiateWarp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      infiniteCurve.dispose();
    };
  }, [infiniteCurve]);

  // Frame update loop
  useFrame((_, delta) => {
    const state = stateRef.current;
    const now = performance.now();

    // Process keyboard input (only when not warping)
    if (!state.isWarping) {
      if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w')) {
        accelerate();
      }
      if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s')) {
        decelerate();
      }
    }

    // Handle warp state
    if (state.isWarping && warpStartTime.current !== null) {
      const elapsed = now - warpStartTime.current;
      state.warpProgress = Math.min(elapsed / warpDuration.current, 1);

      // Determine phase and calculate warp velocity
      const { ACCEL_PHASE, CRUISE_PHASE, WARP_MAX_VELOCITY, WARP_CRUISE_VELOCITY } = WARP_CONFIG;
      let warpVelocity: number;

      if (state.warpProgress < ACCEL_PHASE) {
        // Accelerating phase
        state.warpPhase = 'accelerating';
        const phaseProgress = state.warpProgress / ACCEL_PHASE;
        const easedProgress = easeInQuad(phaseProgress);
        warpVelocity = NAV_CONFIG.MAX_SPEED + easedProgress * (WARP_MAX_VELOCITY - NAV_CONFIG.MAX_SPEED);
        // Intensity ramps up quickly during acceleration
        state.warpIntensity = easedProgress;
      } else if (state.warpProgress < ACCEL_PHASE + CRUISE_PHASE) {
        // Cruising phase
        state.warpPhase = 'cruising';
        // Subtle oscillation during cruise for dynamic feel
        const cruiseProgress = (state.warpProgress - ACCEL_PHASE) / CRUISE_PHASE;
        const oscillation = Math.sin(cruiseProgress * Math.PI * 4) * 0.1;
        warpVelocity = WARP_CRUISE_VELOCITY + oscillation;
        // Full intensity during cruise
        state.warpIntensity = 1;
      } else {
        // Decelerating phase
        state.warpPhase = 'decelerating';
        const decelProgress = (state.warpProgress - ACCEL_PHASE - CRUISE_PHASE) / WARP_CONFIG.DECEL_PHASE;
        const easedProgress = easeOutQuad(decelProgress);
        warpVelocity = WARP_CRUISE_VELOCITY - easedProgress * (WARP_CRUISE_VELOCITY - preWarpVelocity.current);
        // Intensity fades out smoothly
        state.warpIntensity = 1 - easedProgress;
      }

      // Override velocity during warp
      state.velocity = warpVelocity;
      state.targetVelocity = warpVelocity;

      // End warp when complete
      if (state.warpProgress >= 1) {
        state.isWarping = false;
        state.warpPhase = 'idle';
        state.warpProgress = 0;
        state.warpIntensity = 0;
        state.velocity = preWarpVelocity.current;
        state.targetVelocity = preWarpVelocity.current;
        warpStartTime.current = null;
        lastWarpEndTime.current = now;
      }
    } else {
      // Normal velocity transition when not warping
      state.velocity = lerp(state.velocity, state.targetVelocity, NAV_CONFIG.LERP_FACTOR);
    }

    // Animate FOV based on warp intensity
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const targetFOV = WARP_CONFIG.FOV_NORMAL + state.warpIntensity * (WARP_CONFIG.FOV_WARP_MAX - WARP_CONFIG.FOV_NORMAL);
    perspectiveCamera.fov = lerp(perspectiveCamera.fov, targetFOV, 0.1);
    perspectiveCamera.updateProjectionMatrix();

    // Update progress (absolute Z position) - scale velocity for reasonable speed
    // Velocity is -1 to 1 normally, but can be higher during warp
    const speedScale = 50; // 50 units per second at max velocity
    state.progress += state.velocity * delta * speedScale;

    // Clamp to prevent going before the start (but allow going backwards within the tunnel)
    const minAllowedZ = infiniteCurve.getMinZ() + 10;
    if (state.progress < minAllowedZ) {
      state.progress = minAllowedZ;
      state.velocity = Math.max(0, state.velocity); // Stop backward movement at boundary
    }

    // Update the infinite curve (generate ahead, trim behind)
    infiniteCurve.update(state.progress, state.velocity);

    // Check if geometry needs update (throttled to avoid excessive state updates)
    if (now - lastGeometryCheckTime.current > 100) {
      lastGeometryCheckTime.current = now;
      if (infiniteCurve.isGeometryDirty()) {
        // Force geometry rebuild and notify components
        infiniteCurve.getGeometry();
        setGeometryVersion(v => v + 1);
      }
    }

    // Get camera position and look-ahead from the infinite curve
    const cameraZ = state.progress;
    const cameraPosition = infiniteCurve.getPointAtZ(cameraZ);
    const lookAheadZ = cameraZ + 5; // Look 5 units ahead
    const lookAtPosition = infiniteCurve.getPointAtZ(lookAheadZ);

    // Get curve for tangent calculations
    const curve = infiniteCurve.getCurve();
    const localT = infiniteCurve.zToLocalT(cameraZ);
    const clampedT = Math.max(0.001, Math.min(0.98, localT));

    // Calculate smooth wandering offset using layered sine waves (Bezier-like smooth curves)
    // These create organic, sweeping movements across the screen
    const wanderProgress = state.progress * 0.015; // Moderate progression

    // Primary wave: large, sweeping (explores edges of screen)
    const wanderX1 = Math.sin(wanderProgress * 0.9) * 3.2;
    const wanderY1 = Math.cos(wanderProgress * 0.7) * 2.4;

    // Secondary wave: medium movement layered on top
    const wanderX2 = Math.sin(wanderProgress * 1.9 + 1.5) * 1.6;
    const wanderY2 = Math.cos(wanderProgress * 1.6 + 2.3) * 1.4;

    // Tertiary wave: subtle variation for organic feel
    const wanderX3 = Math.sin(wanderProgress * 3.0 + 0.7) * 0.75;
    const wanderY3 = Math.sin(wanderProgress * 2.6 + 3.1) * 0.6;

    // Combined wander offset
    const wanderX = wanderX1 + wanderX2 + wanderX3;
    const wanderY = wanderY1 + wanderY2 + wanderY3;

    if (state.cameraMode === 'first-person') {
      // First-person: inside the tunnel with wandering offset
      const tangent = curve.getTangentAt(clampedT);
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const camUp = new THREE.Vector3().crossVectors(right, tangent).normalize();

      // Apply wander offset perpendicular to tunnel direction
      const targetPosition = cameraPosition.clone();
      targetPosition.add(right.multiplyScalar(wanderX));
      targetPosition.add(camUp.multiplyScalar(wanderY));

      camera.position.lerp(targetPosition, 0.08);

      // Look-at also wanders (less than camera for parallax effect)
      const lookWanderX = wanderX * 0.4;
      const lookWanderY = wanderY * 0.4;
      const tangentLook = curve.getTangentAt(Math.min(clampedT + 0.01, 0.99));
      const rightLook = new THREE.Vector3().crossVectors(tangentLook, up).normalize();
      const upLook = new THREE.Vector3().crossVectors(rightLook, tangentLook).normalize();

      const targetLookAt = lookAtPosition.clone();
      targetLookAt.add(rightLook.multiplyScalar(lookWanderX));
      targetLookAt.add(upLook.multiplyScalar(lookWanderY));

      // Smooth look-at
      const currentLookAt = new THREE.Vector3();
      camera.getWorldDirection(currentLookAt);
      currentLookAt.add(camera.position);
      currentLookAt.lerp(targetLookAt, 0.08);
      camera.lookAt(currentLookAt);

      // Camera roll varies with wander for immersive banking effect
      const rollFromWander = wanderX * 0.03;
      const rollFromProgress = Math.sin(state.progress * 0.12) * 0.04;
      const roll = rollFromWander + rollFromProgress;
      camera.rotation.z = lerp(camera.rotation.z, roll, 0.055);
    } else {
      // Third-person: above the tunnel with wandering
      const tangent = curve.getTangentAt(clampedT);
      const normal = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      // Position camera above with wander offset
      const abovePosition = cameraPosition.clone();
      abovePosition.y += 25 + wanderY * 3; // Height varies with wander
      abovePosition.add(binormal.multiplyScalar(8 + wanderX * 4)); // Side offset varies

      camera.position.lerp(abovePosition, 0.065);

      // Look far ahead on the curve
      const lookFarAheadZ = cameraZ + 100;
      const lookTarget = infiniteCurve.getPointAtZ(Math.min(lookFarAheadZ, infiniteCurve.getMaxZ() - 10));
      camera.lookAt(lookTarget);

      // Roll based on curve direction and wander
      const roll = binormal.x * 0.17 + wanderX * 0.03;
      camera.rotation.z = lerp(camera.rotation.z, roll, 0.055);
    }

    // Update exposed state for reactive components (throttled)
    setExposedState({ ...state });
  });

  // Notify parent of speed changes
  useEffect(() => {
    onSpeedChange?.(getSpeed());
  }, [exposedState.velocity, getSpeed, onSpeedChange]);

  // Expose actions to parent
  useEffect(() => {
    onActionsReady?.({ stop, toggleCameraMode, initiateWarp });
  }, [onActionsReady, stop, toggleCameraMode, initiateWarp]);

  // Notify parent of warp state changes
  useEffect(() => {
    onWarpStateChange?.(exposedState.isWarping, exposedState.warpPhase, exposedState.warpIntensity);
  }, [exposedState.isWarping, exposedState.warpPhase, exposedState.warpIntensity, onWarpStateChange]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: WormholeContextValue = {
    state: exposedState,
    actions: { accelerate, decelerate, setTargetVelocity, stop, toggleCameraMode, initiateWarp },
    meta: { infiniteCurve, getGeometry, getSpeed, getProgress, geometryVersion },
  };

  return (
    <WormholeContext value={contextValue}>
      {children}
    </WormholeContext>
  );
}
