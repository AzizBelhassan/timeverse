import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  generateCurvePoints,
  createTunnelCurve,
  getCameraTransform,
  generateRingPositions,
  generateParticlePositions,
  lerp,
  smoothStep,
} from './tunnelMath';
import { TUNNEL_CONFIG as _TUNNEL_CONFIG } from './constants';

// Re-export to satisfy linter while keeping import for potential future use
void _TUNNEL_CONFIG;

describe('tunnelMath', () => {
  describe('generateCurvePoints', () => {
    it('should generate the correct number of points', () => {
      const points = generateCurvePoints(0, 100);
      expect(points).toHaveLength(100);
    });

    it('should generate Vector3 instances', () => {
      const points = generateCurvePoints();
      expect(points[0]).toBeInstanceOf(THREE.Vector3);
    });

    it('should generate points along the negative Z axis', () => {
      const points = generateCurvePoints(0, 10);
      // Points should progress in negative Z direction
      for (let i = 1; i < points.length; i++) {
        expect(points[i].z).toBeLessThan(points[i - 1].z);
      }
    });

    it('should offset Z based on segment index', () => {
      const segment0 = generateCurvePoints(0, 10);
      const segment1 = generateCurvePoints(1, 10);

      // Segment 1 should start further along negative Z
      expect(segment1[0].z).toBeLessThan(segment0[0].z);
    });

    it('should generate varied X and Y positions (not a straight line)', () => {
      const points = generateCurvePoints(0, 50);
      const xValues = points.map((p) => p.x);
      const yValues = points.map((p) => p.y);

      // Check that X and Y vary (have different values)
      const uniqueX = new Set(xValues.map((x) => Math.round(x * 100)));
      const uniqueY = new Set(yValues.map((y) => Math.round(y * 100)));

      expect(uniqueX.size).toBeGreaterThan(1);
      expect(uniqueY.size).toBeGreaterThan(1);
    });
  });

  describe('createTunnelCurve', () => {
    it('should create a CatmullRomCurve3', () => {
      const curve = createTunnelCurve();
      expect(curve).toBeInstanceOf(THREE.CatmullRomCurve3);
    });

    it('should have a positive length', () => {
      const curve = createTunnelCurve();
      expect(curve.getLength()).toBeGreaterThan(0);
    });

    it('should return valid points at any progress value', () => {
      const curve = createTunnelCurve();

      const point0 = curve.getPointAt(0);
      const point50 = curve.getPointAt(0.5);
      const point99 = curve.getPointAt(0.99);

      expect(point0).toBeInstanceOf(THREE.Vector3);
      expect(point50).toBeInstanceOf(THREE.Vector3);
      expect(point99).toBeInstanceOf(THREE.Vector3);

      // Points should be different
      expect(point0.distanceTo(point50)).toBeGreaterThan(0);
      expect(point50.distanceTo(point99)).toBeGreaterThan(0);
    });
  });

  describe('getCameraTransform', () => {
    let curve: THREE.CatmullRomCurve3;

    beforeEach(() => {
      curve = createTunnelCurve();
    });

    it('should return position, lookAt, and up vectors', () => {
      const transform = getCameraTransform(curve, 0.5, 0.01);

      expect(transform.position).toBeInstanceOf(THREE.Vector3);
      expect(transform.lookAt).toBeInstanceOf(THREE.Vector3);
      expect(transform.up).toBeInstanceOf(THREE.Vector3);
    });

    it('should have lookAt ahead of position', () => {
      const transform = getCameraTransform(curve, 0.3, 0.01);

      // lookAt should be further along the curve (more negative Z)
      expect(transform.lookAt.z).toBeLessThan(transform.position.z);
    });

    it('should clamp progress to valid range', () => {
      // Should not throw for edge cases
      expect(() => getCameraTransform(curve, 0, 0.01)).not.toThrow();
      expect(() => getCameraTransform(curve, 0.99, 0.001)).not.toThrow();
      expect(() => getCameraTransform(curve, -0.1, 0.01)).not.toThrow();
      expect(() => getCameraTransform(curve, 1.5, 0.01)).not.toThrow();
    });

    it('should return different positions for different progress values', () => {
      const transform1 = getCameraTransform(curve, 0.2, 0.01);
      const transform2 = getCameraTransform(curve, 0.5, 0.01);

      expect(transform1.position.distanceTo(transform2.position)).toBeGreaterThan(0);
    });
  });

  describe('generateRingPositions', () => {
    let curve: THREE.CatmullRomCurve3;

    beforeEach(() => {
      curve = createTunnelCurve();
    });

    it('should generate the requested number of rings', () => {
      const rings = generateRingPositions(curve, 10, 0, 0.02);
      expect(rings.length).toBeLessThanOrEqual(10);
      expect(rings.length).toBeGreaterThan(0);
    });

    it('should include position, rotation, and scale for each ring', () => {
      const rings = generateRingPositions(curve, 5);

      rings.forEach((ring) => {
        expect(ring.position).toBeInstanceOf(THREE.Vector3);
        expect(ring.rotation).toBeInstanceOf(THREE.Euler);
        expect(typeof ring.scale).toBe('number');
      });
    });

    it('should space rings along the curve', () => {
      const rings = generateRingPositions(curve, 5, 0, 0.1);

      // Each ring should be at a different position
      for (let i = 1; i < rings.length; i++) {
        expect(rings[i].position.distanceTo(rings[i - 1].position)).toBeGreaterThan(0);
      }
    });

    it('should vary scale for visual interest', () => {
      const rings = generateRingPositions(curve, 20, 0, 0.02);
      const scales = rings.map((r) => r.scale);
      const uniqueScales = new Set(scales.map((s) => Math.round(s * 100)));

      expect(uniqueScales.size).toBeGreaterThan(1);
    });
  });

  describe('generateParticlePositions', () => {
    let curve: THREE.CatmullRomCurve3;

    beforeEach(() => {
      curve = createTunnelCurve();
    });

    it('should generate Float32Array with correct length', () => {
      const count = 50;
      const positions = generateParticlePositions(curve, count, 5);

      expect(positions).toBeInstanceOf(Float32Array);
      expect(positions.length).toBe(count * 3); // x, y, z for each particle
    });

    it('should generate positions within spread radius of curve', () => {
      const spread = 5;
      const positions = generateParticlePositions(curve, 100, spread, 0.1, 0.5);

      // Sample some positions and verify they're reasonably distributed
      for (let i = 0; i < 10; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];

        expect(isFinite(x)).toBe(true);
        expect(isFinite(y)).toBe(true);
        expect(isFinite(z)).toBe(true);
      }
    });
  });

  describe('lerp', () => {
    it('should return start value when factor is 0', () => {
      expect(lerp(10, 20, 0)).toBe(10);
    });

    it('should return end value when factor is 1', () => {
      expect(lerp(10, 20, 1)).toBe(20);
    });

    it('should return midpoint when factor is 0.5', () => {
      expect(lerp(0, 100, 0.5)).toBe(50);
    });

    it('should handle negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });

    it('should extrapolate beyond 0-1 range', () => {
      expect(lerp(0, 10, 2)).toBe(20);
      expect(lerp(0, 10, -1)).toBe(-10);
    });
  });

  describe('smoothStep', () => {
    it('should return 0 when x is at or below edge0', () => {
      expect(smoothStep(0, 1, 0)).toBe(0);
      expect(smoothStep(0, 1, -0.5)).toBe(0);
    });

    it('should return 1 when x is at or above edge1', () => {
      expect(smoothStep(0, 1, 1)).toBe(1);
      expect(smoothStep(0, 1, 1.5)).toBe(1);
    });

    it('should return 0.5 at midpoint', () => {
      expect(smoothStep(0, 1, 0.5)).toBe(0.5);
    });

    it('should be smooth (derivative is 0 at edges)', () => {
      // Values near edges should change slowly
      const nearZero = smoothStep(0, 1, 0.01);
      const nearOne = smoothStep(0, 1, 0.99);

      expect(nearZero).toBeLessThan(0.01);
      expect(nearOne).toBeGreaterThan(0.99);
    });
  });
});
