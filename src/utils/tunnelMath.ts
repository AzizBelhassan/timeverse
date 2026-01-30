import * as THREE from 'three';
import { TUNNEL_CONFIG } from './constants';

/**
 * Generate control points for a procedural tunnel curve
 * Uses sine waves with varying frequencies to create organic movement
 */
export function generateCurvePoints(
  segmentIndex: number = 0,
  pointCount: number = TUNNEL_CONFIG.CURVE_SEGMENTS
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const startZ = segmentIndex * TUNNEL_CONFIG.SEGMENT_LENGTH;

  for (let i = 0; i < pointCount; i++) {
    const t = i / pointCount;
    const z = startZ + t * TUNNEL_CONFIG.CURVE_LENGTH;

    // Multiple sine waves for organic movement
    const x =
      Math.sin(z * TUNNEL_CONFIG.CURVE_FREQUENCY) * TUNNEL_CONFIG.CURVE_AMPLITUDE +
      Math.sin(z * TUNNEL_CONFIG.CURVE_FREQUENCY * 2.3) * (TUNNEL_CONFIG.CURVE_AMPLITUDE * 0.3);

    const y =
      Math.cos(z * TUNNEL_CONFIG.CURVE_FREQUENCY * 0.7) * TUNNEL_CONFIG.CURVE_AMPLITUDE +
      Math.sin(z * TUNNEL_CONFIG.CURVE_FREQUENCY * 1.5) * (TUNNEL_CONFIG.CURVE_AMPLITUDE * 0.4);

    points.push(new THREE.Vector3(x, y, -z));
  }

  return points;
}

/**
 * Create a CatmullRomCurve3 from generated points
 */
export function createTunnelCurve(segmentIndex: number = 0): THREE.CatmullRomCurve3 {
  const points = generateCurvePoints(segmentIndex);
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
}

/**
 * Get camera position and look-at point along the curve
 */
export function getCameraTransform(
  curve: THREE.CatmullRomCurve3,
  progress: number,
  lookAheadDistance: number
): { position: THREE.Vector3; lookAt: THREE.Vector3; up: THREE.Vector3 } {
  // Clamp progress to valid range
  const clampedProgress = Math.max(0, Math.min(0.99, progress));
  const lookAheadProgress = Math.min(0.999, clampedProgress + lookAheadDistance);

  const position = curve.getPointAt(clampedProgress);
  const lookAt = curve.getPointAt(lookAheadProgress);

  // Calculate up vector using Frenet-Serret frame
  const tangent = curve.getTangentAt(clampedProgress);
  const normal = new THREE.Vector3(0, 1, 0);
  const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
  const up = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

  return { position, lookAt, up };
}

/**
 * Generate positions for glow rings along the curve
 */
export function generateRingPositions(
  curve: THREE.CatmullRomCurve3,
  count: number,
  startProgress: number = 0,
  spacing: number = 0.02
): Array<{ position: THREE.Vector3; rotation: THREE.Euler; scale: number }> {
  const rings: Array<{ position: THREE.Vector3; rotation: THREE.Euler; scale: number }> = [];

  for (let i = 0; i < count; i++) {
    const t = startProgress + i * spacing;
    if (t >= 0.99) break;

    const position = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);

    // Calculate rotation to align ring perpendicular to curve
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);

    // Vary scale for visual interest
    const scale = 0.8 + Math.sin(t * Math.PI * 10) * 0.2;

    rings.push({ position, rotation: euler, scale });
  }

  return rings;
}

/**
 * Generate particle positions within the tunnel
 */
export function generateParticlePositions(
  curve: THREE.CatmullRomCurve3,
  count: number,
  spread: number,
  startProgress: number = 0,
  endProgress: number = 0.9
): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const t = startProgress + Math.random() * (endProgress - startProgress);
    const curvePoint = curve.getPointAt(Math.min(t, 0.99));

    // Add random offset within the tunnel
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * spread;

    positions[i * 3] = curvePoint.x + Math.cos(angle) * radius;
    positions[i * 3 + 1] = curvePoint.y + Math.sin(angle) * radius;
    positions[i * 3 + 2] = curvePoint.z;
  }

  return positions;
}

/**
 * Linear interpolation helper
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/**
 * Smooth step function for easing
 */
export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
