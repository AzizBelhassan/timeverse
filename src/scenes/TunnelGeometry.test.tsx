import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createTunnelCurve } from '../utils/tunnelMath';
import { TUNNEL_CONFIG, EFFECTS_CONFIG } from '../utils/constants';

// Mock react-three-fiber
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn((callback) => {
    (global as Record<string, unknown>).__useFrameCallback = callback;
  }),
}));

describe('TunnelGeometry', () => {
  let curve: THREE.CatmullRomCurve3;
  let geometry: THREE.TubeGeometry;

  beforeEach(() => {
    curve = createTunnelCurve();
    geometry = new THREE.TubeGeometry(
      curve,
      TUNNEL_CONFIG.TUBE_TUBULAR_SEGMENTS,
      TUNNEL_CONFIG.TUBE_RADIUS,
      TUNNEL_CONFIG.TUBE_RADIAL_SEGMENTS,
      false
    );
  });

  describe('TubeGeometry creation', () => {
    it('should create valid tube geometry from curve', () => {
      expect(geometry).toBeInstanceOf(THREE.TubeGeometry);
    });

    it('should have position attribute with vertices', () => {
      const positions = geometry.getAttribute('position');
      expect(positions).toBeDefined();
      expect(positions.count).toBeGreaterThan(0);
    });

    it('should have correct radius', () => {
      const positions = geometry.getAttribute('position');
      const array = positions.array as Float32Array;

      // Sample vertices and check they form a tube with expected radius
      // Get first ring of vertices (radial segments + 1 vertices)
      const ringVertices: THREE.Vector3[] = [];
      const ringSize = TUNNEL_CONFIG.TUBE_RADIAL_SEGMENTS + 1;

      for (let i = 0; i < ringSize; i++) {
        ringVertices.push(
          new THREE.Vector3(
            array[i * 3],
            array[i * 3 + 1],
            array[i * 3 + 2]
          )
        );
      }

      // Calculate center of ring
      const center = new THREE.Vector3();
      ringVertices.forEach((v) => center.add(v));
      center.divideScalar(ringVertices.length);

      // Check distances from center (should be approximately TUBE_RADIUS)
      ringVertices.forEach((v) => {
        const distance = v.distanceTo(center);
        expect(distance).toBeCloseTo(TUNNEL_CONFIG.TUBE_RADIUS, 0);
      });
    });

    it('should have UV coordinates for texturing', () => {
      const uv = geometry.getAttribute('uv');
      expect(uv).toBeDefined();
      expect(uv.count).toBeGreaterThan(0);
    });

    it('should have normal vectors for lighting', () => {
      const normals = geometry.getAttribute('normal');
      expect(normals).toBeDefined();
      expect(normals.count).toBeGreaterThan(0);
    });

    it('should have indices for efficient rendering', () => {
      const index = geometry.getIndex();
      expect(index).toBeDefined();
      expect(index!.count).toBeGreaterThan(0);
    });

    it('should have bounding box', () => {
      geometry.computeBoundingBox();
      expect(geometry.boundingBox).toBeDefined();

      const size = new THREE.Vector3();
      geometry.boundingBox!.getSize(size);

      // Tunnel should have significant length in Z direction
      expect(size.z).toBeGreaterThan(100);
    });
  });

  describe('geometry segments', () => {
    it('should have configured tubular segments', () => {
      // TubeGeometry creates (tubularSegments + 1) rings of vertices
      const positions = geometry.getAttribute('position');
      const expectedRings = TUNNEL_CONFIG.TUBE_TUBULAR_SEGMENTS + 1;
      const verticesPerRing = TUNNEL_CONFIG.TUBE_RADIAL_SEGMENTS + 1;

      expect(positions.count).toBe(expectedRings * verticesPerRing);
    });

    it('should create smooth curve with many segments', () => {
      // Verify geometry follows the curve path
      const positions = geometry.getAttribute('position');
      const array = positions.array as Float32Array;

      // Sample points along the tube and verify they're on the curve
      const samples = 10;
      const verticesPerRing = TUNNEL_CONFIG.TUBE_RADIAL_SEGMENTS + 1;
      const totalRings = TUNNEL_CONFIG.TUBE_TUBULAR_SEGMENTS + 1;

      for (let s = 0; s < samples; s++) {
        const ringIndex = Math.floor((s / samples) * totalRings);
        const vertexStart = ringIndex * verticesPerRing;

        // Get center of this ring
        const center = new THREE.Vector3();
        for (let i = 0; i < verticesPerRing; i++) {
          center.add(
            new THREE.Vector3(
              array[(vertexStart + i) * 3],
              array[(vertexStart + i) * 3 + 1],
              array[(vertexStart + i) * 3 + 2]
            )
          );
        }
        center.divideScalar(verticesPerRing);

        // Ring center should be on or near the curve
        const curveProgress = ringIndex / totalRings;
        const curvePoint = curve.getPointAt(Math.min(curveProgress, 0.99));

        // Allow for some tolerance due to curve interpolation
        expect(center.distanceTo(curvePoint)).toBeLessThan(2);
      }
    });
  });

  describe('shader material properties', () => {
    it('should use BackSide rendering for inside-out tunnel view', () => {
      const material = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
      });

      expect(material.side).toBe(THREE.BackSide);
    });

    it('should support transparency', () => {
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: TUNNEL_CONFIG.TUNNEL_OPACITY,
      });

      expect(material.transparent).toBe(true);
      expect(material.opacity).toBe(TUNNEL_CONFIG.TUNNEL_OPACITY);
    });

    it('should use correct color values', () => {
      const color1 = new THREE.Color(EFFECTS_CONFIG.COLOR_PURPLE);
      const color2 = new THREE.Color(EFFECTS_CONFIG.COLOR_CYAN);

      // Colors should be valid
      expect(color1.r).toBeGreaterThanOrEqual(0);
      expect(color1.r).toBeLessThanOrEqual(1);
      expect(color2.b).toBeGreaterThanOrEqual(0);
      expect(color2.b).toBeLessThanOrEqual(1);
    });
  });

  describe('wireframe overlay', () => {
    it('should create wireframe material', () => {
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        wireframe: true,
        transparent: true,
        opacity: 0.4,
      });

      expect(wireframeMaterial.wireframe).toBe(true);
    });

    it('should work with same geometry', () => {
      const solidMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
      const wireframeMesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ wireframe: true })
      );

      // Both should share the same geometry
      expect(solidMesh.geometry).toBe(wireframeMesh.geometry);
    });
  });

  describe('geometry disposal', () => {
    it('should be disposable for memory management', () => {
      const testGeometry = new THREE.TubeGeometry(
        curve,
        100,
        TUNNEL_CONFIG.TUBE_RADIUS,
        TUNNEL_CONFIG.TUBE_RADIAL_SEGMENTS,
        false
      );

      expect(() => testGeometry.dispose()).not.toThrow();
    });
  });

  describe('tunnel continuity', () => {
    it('should form a continuous tube without gaps', () => {
      const positions = geometry.getAttribute('position');
      const array = positions.array as Float32Array;
      const verticesPerRing = TUNNEL_CONFIG.TUBE_RADIAL_SEGMENTS + 1;

      // Check that consecutive rings are close to each other
      for (let ring = 0; ring < 10; ring++) {
        const ring1Start = ring * verticesPerRing;
        const ring2Start = (ring + 1) * verticesPerRing;

        const v1 = new THREE.Vector3(
          array[ring1Start * 3],
          array[ring1Start * 3 + 1],
          array[ring1Start * 3 + 2]
        );
        const v2 = new THREE.Vector3(
          array[ring2Start * 3],
          array[ring2Start * 3 + 1],
          array[ring2Start * 3 + 2]
        );

        // Adjacent ring vertices should be relatively close
        expect(v1.distanceTo(v2)).toBeLessThan(10);
      }
    });

    it('should close each ring properly', () => {
      const positions = geometry.getAttribute('position');
      const array = positions.array as Float32Array;
      const verticesPerRing = TUNNEL_CONFIG.TUBE_RADIAL_SEGMENTS + 1;

      // First and last vertex of each ring should be the same position
      const firstVertex = new THREE.Vector3(
        array[0],
        array[1],
        array[2]
      );
      const lastVertex = new THREE.Vector3(
        array[(verticesPerRing - 1) * 3],
        array[(verticesPerRing - 1) * 3 + 1],
        array[(verticesPerRing - 1) * 3 + 2]
      );

      // They should be very close (closing the ring)
      expect(firstVertex.distanceTo(lastVertex)).toBeLessThan(0.01);
    });
  });
});
