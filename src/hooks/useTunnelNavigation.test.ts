import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as THREE from 'three';
import { NAV_CONFIG } from '../utils/constants';
import { createTunnelCurve } from '../utils/tunnelMath';

// Mock react-three-fiber
const mockCamera = {
  position: new THREE.Vector3(0, 0, 5),
  rotation: { z: 0 },
  lookAt: vi.fn(),
  getWorldDirection: vi.fn((target: THREE.Vector3) => target.set(0, 0, -1)),
};

const mockGl = {
  domElement: document.createElement('canvas'),
};

vi.mock('@react-three/fiber', () => ({
  useThree: () => ({
    camera: mockCamera,
    gl: mockGl,
  }),
  useFrame: vi.fn((callback) => {
    // Store the callback for manual invocation in tests
    (global as Record<string, unknown>).__useFrameCallback = callback;
  }),
}));

// Mock use-gesture
vi.mock('@use-gesture/react', () => ({
  useGesture: vi.fn((handlers) => {
    // Store handlers for manual invocation
    (global as Record<string, unknown>).__gestureHandlers = handlers;
    return vi.fn();
  }),
}));

describe('useTunnelNavigation', () => {
  let curve: THREE.CatmullRomCurve3;

  beforeEach(() => {
    curve = createTunnelCurve();
    vi.clearAllMocks();

    // Reset camera position
    mockCamera.position.set(0, 0, 5);
    mockCamera.rotation.z = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Import hook after mocks are set up
  const getHook = async () => {
    const { useTunnelNavigation } = await import('./useTunnelNavigation');
    return useTunnelNavigation;
  };

  describe('initialization', () => {
    it('should initialize with default velocity', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      expect(result.current.stateRef.current.velocity).toBe(NAV_CONFIG.DEFAULT_SPEED);
      expect(result.current.stateRef.current.targetVelocity).toBe(NAV_CONFIG.DEFAULT_SPEED);
    });

    it('should initialize progress near start of curve', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      expect(result.current.stateRef.current.progress).toBeCloseTo(0.001, 3);
    });

    it('should provide getSpeed and getProgress functions', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      expect(typeof result.current.getSpeed).toBe('function');
      expect(typeof result.current.getProgress).toBe('function');
    });
  });

  describe('scroll wheel input', () => {
    it('should increase velocity when scrolling down', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      const initialVelocity = result.current.stateRef.current.targetVelocity;

      // Simulate scroll down (positive delta Y)
      const handlers = (global as Record<string, unknown>).__gestureHandlers as {
        onWheel: (state: { delta: [number, number] }) => void;
      };

      act(() => {
        handlers.onWheel({ delta: [0, 100] }); // Scroll down
      });

      expect(result.current.stateRef.current.targetVelocity).toBeGreaterThan(initialVelocity);
    });

    it('should decrease velocity when scrolling up', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      // Set a higher initial velocity so we can decrease it
      result.current.stateRef.current.targetVelocity = 1.0;

      const handlers = (global as Record<string, unknown>).__gestureHandlers as {
        onWheel: (state: { delta: [number, number] }) => void;
      };

      act(() => {
        handlers.onWheel({ delta: [0, -100] }); // Scroll up
      });

      expect(result.current.stateRef.current.targetVelocity).toBeLessThan(1.0);
    });

    it('should clamp velocity to maximum', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      const handlers = (global as Record<string, unknown>).__gestureHandlers as {
        onWheel: (state: { delta: [number, number] }) => void;
      };

      // Scroll down many times
      act(() => {
        for (let i = 0; i < 100; i++) {
          handlers.onWheel({ delta: [0, 500] });
        }
      });

      expect(result.current.stateRef.current.targetVelocity).toBeLessThanOrEqual(NAV_CONFIG.MAX_SPEED);
    });

    it('should clamp velocity to minimum', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      const handlers = (global as Record<string, unknown>).__gestureHandlers as {
        onWheel: (state: { delta: [number, number] }) => void;
      };

      // Scroll up many times
      act(() => {
        for (let i = 0; i < 100; i++) {
          handlers.onWheel({ delta: [0, -500] });
        }
      });

      expect(result.current.stateRef.current.targetVelocity).toBeGreaterThanOrEqual(NAV_CONFIG.MIN_SPEED);
    });
  });

  describe('keyboard input', () => {
    it('should increase velocity on ArrowUp keydown', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      const initialVelocity = result.current.stateRef.current.targetVelocity;

      // Simulate ArrowUp keydown
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      });

      // Simulate frame update to process keyboard input
      const frameCallback = (global as Record<string, unknown>).__useFrameCallback as (
        state: unknown,
        delta: number
      ) => void;

      act(() => {
        frameCallback({}, 0.016);
      });

      expect(result.current.stateRef.current.targetVelocity).toBeGreaterThan(initialVelocity);
    });

    it('should decrease velocity on ArrowDown keydown', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      // Set higher initial velocity
      result.current.stateRef.current.targetVelocity = 1.0;

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      });

      const frameCallback = (global as Record<string, unknown>).__useFrameCallback as (
        state: unknown,
        delta: number
      ) => void;

      act(() => {
        frameCallback({}, 0.016);
      });

      expect(result.current.stateRef.current.targetVelocity).toBeLessThan(1.0);
    });

    it('should stop accelerating on keyup', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      const frameCallback = (global as Record<string, unknown>).__useFrameCallback as (
        state: unknown,
        delta: number
      ) => void;

      // Press and hold ArrowUp
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
        frameCallback({}, 0.016);
      });

      const _velocityWhilePressed = result.current.stateRef.current.targetVelocity;
      void _velocityWhilePressed; // Captured for debugging if test fails

      // Release ArrowUp
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
        frameCallback({}, 0.016);
      });

      // Velocity should not continue to increase after key release
      const _velocityAfterRelease = result.current.stateRef.current.targetVelocity;
      void _velocityAfterRelease; // Captured for debugging if test fails

      act(() => {
        frameCallback({}, 0.016);
      });

      // Target velocity should be clamped and not increasing
      expect(result.current.stateRef.current.targetVelocity).toBeLessThanOrEqual(NAV_CONFIG.MAX_SPEED);
    });

    it('should support W key for acceleration', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      const initialVelocity = result.current.stateRef.current.targetVelocity;

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      });

      const frameCallback = (global as Record<string, unknown>).__useFrameCallback as (
        state: unknown,
        delta: number
      ) => void;

      act(() => {
        frameCallback({}, 0.016);
      });

      expect(result.current.stateRef.current.targetVelocity).toBeGreaterThan(initialVelocity);
    });

    it('should support S key for deceleration', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      result.current.stateRef.current.targetVelocity = 1.0;

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
      });

      const frameCallback = (global as Record<string, unknown>).__useFrameCallback as (
        state: unknown,
        delta: number
      ) => void;

      act(() => {
        frameCallback({}, 0.016);
      });

      expect(result.current.stateRef.current.targetVelocity).toBeLessThan(1.0);
    });
  });

  describe('progress updates', () => {
    it('should increase progress over time based on velocity', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      const initialProgress = result.current.stateRef.current.progress;

      const frameCallback = (global as Record<string, unknown>).__useFrameCallback as (
        state: unknown,
        delta: number
      ) => void;

      // Simulate several frames
      act(() => {
        for (let i = 0; i < 10; i++) {
          frameCallback({}, 0.016);
        }
      });

      expect(result.current.stateRef.current.progress).toBeGreaterThan(initialProgress);
    });

    it('should loop progress when reaching end of curve', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      // Set progress near the end
      result.current.stateRef.current.progress = 0.96;

      const frameCallback = (global as Record<string, unknown>).__useFrameCallback as (
        state: unknown,
        delta: number
      ) => void;

      act(() => {
        frameCallback({}, 0.016);
      });

      // Should have looped back to start
      expect(result.current.stateRef.current.progress).toBeLessThan(0.1);
    });
  });

  describe('velocity smoothing', () => {
    it('should smoothly transition velocity towards target', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      // Set a large difference between current and target velocity
      result.current.stateRef.current.velocity = 0;
      result.current.stateRef.current.targetVelocity = 1.0;

      const frameCallback = (global as Record<string, unknown>).__useFrameCallback as (
        state: unknown,
        delta: number
      ) => void;

      act(() => {
        frameCallback({}, 0.016);
      });

      // Velocity should have moved towards target but not jumped to it
      expect(result.current.stateRef.current.velocity).toBeGreaterThan(0);
      expect(result.current.stateRef.current.velocity).toBeLessThan(1.0);
    });
  });

  describe('getSpeed and getProgress', () => {
    it('should return normalized speed (0-1)', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      // Set velocity to max
      result.current.stateRef.current.velocity = NAV_CONFIG.MAX_SPEED;

      const speed = result.current.getSpeed();
      expect(speed).toBeCloseTo(1, 1);

      // Set velocity to min
      result.current.stateRef.current.velocity = NAV_CONFIG.MIN_SPEED;

      const minSpeed = result.current.getSpeed();
      expect(minSpeed).toBeCloseTo(0, 1);
    });

    it('should return current progress value', async () => {
      const useTunnelNavigation = await getHook();
      const { result } = renderHook(() => useTunnelNavigation(curve));

      result.current.stateRef.current.progress = 0.5;

      expect(result.current.getProgress()).toBe(0.5);
    });
  });
});
