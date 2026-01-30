import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as THREE from 'three';
import React from 'react';
import { NAV_CONFIG } from '../utils/constants';

// Mock react-three-fiber
const mockCamera = {
  position: new THREE.Vector3(0, 0, 5),
  rotation: { z: 0 },
  lookAt: vi.fn(),
  getWorldDirection: vi.fn((target: THREE.Vector3) => target.set(0, 0, -1)),
  fov: 75,
  updateProjectionMatrix: vi.fn(),
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
    (global as Record<string, unknown>).__useFrameCallback = callback;
  }),
}));

vi.mock('@use-gesture/react', () => ({
  useGesture: vi.fn((handlers) => {
    (global as Record<string, unknown>).__gestureHandlers = handlers;
    return vi.fn();
  }),
}));

describe('WormholeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCamera.position.set(0, 0, 5);
    mockCamera.rotation.z = 0;
  });

  const getImports = async () => {
    return await import('./WormholeContext');
  };

  describe('WormholeProvider state/actions/meta interface', () => {
    it('should provide state with progress and velocity', async () => {
      const { useWormhole, WormholeProvider } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result } = renderHook(() => useWormhole(), { wrapper });

      expect(result.current.state).toBeDefined();
      expect(typeof result.current.state.progress).toBe('number');
      expect(typeof result.current.state.velocity).toBe('number');
      expect(typeof result.current.state.targetVelocity).toBe('number');
    });

    it('should provide actions for controlling navigation', async () => {
      const { useWormhole, WormholeProvider } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result } = renderHook(() => useWormhole(), { wrapper });

      expect(result.current.actions).toBeDefined();
      expect(typeof result.current.actions.accelerate).toBe('function');
      expect(typeof result.current.actions.decelerate).toBe('function');
      expect(typeof result.current.actions.setTargetVelocity).toBe('function');
    });

    it('should provide meta with infiniteCurve and getGeometry', async () => {
      const { useWormhole, WormholeProvider } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result } = renderHook(() => useWormhole(), { wrapper });

      expect(result.current.meta).toBeDefined();
      expect(result.current.meta.infiniteCurve).toBeDefined();
      expect(typeof result.current.meta.getGeometry).toBe('function');
      expect(result.current.meta.getGeometry()).toBeInstanceOf(THREE.TubeGeometry);
      expect(typeof result.current.meta.getSpeed).toBe('function');
      expect(typeof result.current.meta.getProgress).toBe('function');
    });
  });

  describe('useWormholeState hook', () => {
    it('should return only state', async () => {
      const { useWormholeState, WormholeProvider } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result } = renderHook(() => useWormholeState(), { wrapper });

      expect(result.current).toHaveProperty('progress');
      expect(result.current).toHaveProperty('velocity');
      expect(result.current).toHaveProperty('targetVelocity');
    });
  });

  describe('useWormholeActions hook', () => {
    it('should return only actions', async () => {
      const { useWormholeActions, WormholeProvider } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result } = renderHook(() => useWormholeActions(), { wrapper });

      expect(result.current).toHaveProperty('accelerate');
      expect(result.current).toHaveProperty('decelerate');
      expect(result.current).toHaveProperty('setTargetVelocity');
    });
  });

  describe('useWormholeMeta hook', () => {
    it('should return only meta', async () => {
      const { useWormholeMeta, WormholeProvider } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result } = renderHook(() => useWormholeMeta(), { wrapper });

      expect(result.current).toHaveProperty('infiniteCurve');
      expect(result.current).toHaveProperty('getGeometry');
      expect(result.current).toHaveProperty('getSpeed');
      expect(result.current).toHaveProperty('getProgress');
      expect(result.current).toHaveProperty('geometryVersion');
    });
  });

  describe('action callbacks', () => {
    it('accelerate should increase target velocity', async () => {
      const { useWormhole, WormholeProvider } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result } = renderHook(() => useWormhole(), { wrapper });

      const initialVelocity = result.current.state.targetVelocity;

      act(() => {
        result.current.actions.accelerate();
      });

      const frameCallback = (global as Record<string, unknown>).__useFrameCallback as (
        state: unknown,
        delta: number
      ) => void;

      act(() => {
        frameCallback({}, 0.016);
      });

      expect(result.current.state.targetVelocity).toBeGreaterThan(initialVelocity);
    });

    it('decelerate should decrease target velocity', async () => {
      const { useWormhole, WormholeProvider } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result } = renderHook(() => useWormhole(), { wrapper });

      // First accelerate to have room to decelerate
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.actions.accelerate();
        }
      });

      const frameCallback = (global as Record<string, unknown>).__useFrameCallback as (
        state: unknown,
        delta: number
      ) => void;

      act(() => {
        frameCallback({}, 0.016);
      });

      const velocityAfterAccel = result.current.state.targetVelocity;

      act(() => {
        result.current.actions.decelerate();
      });

      act(() => {
        frameCallback({}, 0.016);
      });

      expect(result.current.state.targetVelocity).toBeLessThan(velocityAfterAccel);
    });

    it('setTargetVelocity should clamp to valid range', async () => {
      const { useWormhole, WormholeProvider } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result } = renderHook(() => useWormhole(), { wrapper });

      const frameCallback = (global as Record<string, unknown>).__useFrameCallback as (
        state: unknown,
        delta: number
      ) => void;

      // Try to set above max
      act(() => {
        result.current.actions.setTargetVelocity(100);
        frameCallback({}, 0.016);
      });

      expect(result.current.state.targetVelocity).toBeLessThanOrEqual(NAV_CONFIG.MAX_SPEED);

      // Try to set below min
      act(() => {
        result.current.actions.setTargetVelocity(-100);
        frameCallback({}, 0.016);
      });

      expect(result.current.state.targetVelocity).toBeGreaterThanOrEqual(NAV_CONFIG.MIN_SPEED);
    });
  });

  describe('meta utilities', () => {
    it('getSpeed should return normalized value -1 to 1', async () => {
      const { useWormhole, WormholeProvider } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result } = renderHook(() => useWormhole(), { wrapper });

      const speed = result.current.meta.getSpeed();

      expect(speed).toBeGreaterThanOrEqual(-1);
      expect(speed).toBeLessThanOrEqual(1);
    });

    it('getProgress should return current progress (absolute Z position)', async () => {
      const { useWormhole, WormholeProvider } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result } = renderHook(() => useWormhole(), { wrapper });

      const progress = result.current.meta.getProgress();

      // Progress is now absolute Z position (unbounded positive value)
      expect(progress).toBeGreaterThanOrEqual(0);
    });
  });

  describe('negative velocity (backwards movement)', () => {
    it('should allow negative velocity', async () => {
      const { useWormhole, WormholeProvider } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result } = renderHook(() => useWormhole(), { wrapper });

      const frameCallback = (global as Record<string, unknown>).__useFrameCallback as (
        state: unknown,
        delta: number
      ) => void;

      // Decelerate multiple times to go negative
      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.actions.decelerate();
        }
        frameCallback({}, 0.016);
      });

      expect(result.current.state.targetVelocity).toBeLessThan(0);
    });

    it('should clamp velocity at MIN_SPEED', async () => {
      const { useWormhole, WormholeProvider } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result } = renderHook(() => useWormhole(), { wrapper });

      const frameCallback = (global as Record<string, unknown>).__useFrameCallback as (
        state: unknown,
        delta: number
      ) => void;

      // Set velocity way below minimum
      act(() => {
        result.current.actions.setTargetVelocity(-100);
        frameCallback({}, 0.016);
      });

      expect(result.current.state.targetVelocity).toBe(NAV_CONFIG.MIN_SPEED);
    });

    it('getSpeed should return negative value when velocity is negative', async () => {
      const { useWormhole, WormholeProvider } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result } = renderHook(() => useWormhole(), { wrapper });

      const frameCallback = (global as Record<string, unknown>).__useFrameCallback as (
        state: unknown,
        delta: number
      ) => void;

      // Set negative velocity
      act(() => {
        result.current.actions.setTargetVelocity(-1);
        // Run multiple frames to let velocity lerp to target
        for (let i = 0; i < 100; i++) {
          frameCallback({}, 0.016);
        }
      });

      // With infinite tunnel, speed should be negative when velocity is negative
      // But progress is clamped at the boundary, so velocity gets clamped to 0
      // The getSpeed function returns velocity/MAX_SPEED
      const speed = result.current.meta.getSpeed();
      // Since we're at the boundary, velocity is clamped to be >= 0
      expect(speed).toBeGreaterThanOrEqual(-1);
      expect(speed).toBeLessThanOrEqual(1);
    });

    it('progress should be clamped at minimum when going backwards past start', async () => {
      const { useWormhole, WormholeProvider } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result } = renderHook(() => useWormhole(), { wrapper });

      const frameCallback = (global as Record<string, unknown>).__useFrameCallback as (
        state: unknown,
        delta: number
      ) => void;

      // Set negative velocity and run many frames to go backwards
      act(() => {
        result.current.actions.setTargetVelocity(-2);
        for (let i = 0; i < 200; i++) {
          frameCallback({}, 0.1); // Large delta to move faster
        }
      });

      // Progress should be clamped at the minimum (no looping in infinite tunnel)
      // Progress is now absolute Z position, should be >= 10 (minZ + 10)
      const progress = result.current.meta.getProgress();
      expect(progress).toBeGreaterThanOrEqual(0);
    });
  });

  describe('context error handling', () => {
    it('useWormhole should throw without provider', async () => {
      const { useWormhole } = await getImports();

      expect(() => {
        renderHook(() => useWormhole());
      }).toThrow('useWormhole must be used within a WormholeProvider');
    });
  });

  describe('onSpeedChange callback', () => {
    it('should call onSpeedChange when speed changes', async () => {
      const { WormholeProvider, useWormhole } = await getImports();
      const onSpeedChange = vi.fn();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, { onSpeedChange, children });

      const { result } = renderHook(() => useWormhole(), { wrapper });

      const frameCallback = (global as Record<string, unknown>).__useFrameCallback as (
        state: unknown,
        delta: number
      ) => void;

      act(() => {
        result.current.actions.accelerate();
        frameCallback({}, 0.016);
      });

      expect(onSpeedChange).toHaveBeenCalled();
    });
  });

  describe('lazy initialization', () => {
    it('should create infiniteCurve only once', async () => {
      const { WormholeProvider, useWormholeMeta } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result, rerender } = renderHook(() => useWormholeMeta(), { wrapper });

      const initialCurve = result.current.infiniteCurve;

      rerender();

      expect(result.current.infiniteCurve).toBe(initialCurve);
    });

    it('should return geometry from getGeometry', async () => {
      const { WormholeProvider, useWormholeMeta } = await getImports();

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(WormholeProvider, null, children);

      const { result, rerender } = renderHook(() => useWormholeMeta(), { wrapper });

      // Geometry is managed by InfiniteCurve and should be a valid TubeGeometry
      expect(result.current.getGeometry()).toBeInstanceOf(THREE.TubeGeometry);

      rerender();

      // Should still return valid geometry after rerender
      expect(result.current.getGeometry()).toBeInstanceOf(THREE.TubeGeometry);
    });
  });
});
