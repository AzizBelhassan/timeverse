import * as THREE from 'three';
import { INFINITE_TUNNEL_CONFIG, TUNNEL_CONFIG } from './constants';

const {
  POINT_SPACING,
  MIN_AHEAD_BUFFER,
  BEHIND_KEEP,
  PRIMARY_FREQUENCY,
  PRIMARY_AMPLITUDE,
  SECONDARY_FREQUENCY,
  SECONDARY_AMPLITUDE,
  TERTIARY_FREQUENCY,
  TERTIARY_AMPLITUDE,
  MAX_OFFSET,
  INITIAL_LENGTH,
} = INFINITE_TUNNEL_CONFIG;

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Manages an infinite procedural tunnel using a sliding window of control points.
 * Generates new points ahead of the camera and recycles points behind.
 * Uses smooth sine waves for gentle, flowing curves.
 */
export class InfiniteCurve {
  private points: THREE.Vector3[] = [];
  private phaseOffsetX: number;
  private phaseOffsetY: number;
  private minZ: number = 0;
  private maxZ: number = 0;
  private curve: THREE.CatmullRomCurve3 | null = null;
  private curveDirty: boolean = true;
  private geometry: THREE.TubeGeometry | null = null;
  private geometryDirty: boolean = true;
  private lastCurveRebuildTime: number = 0;
  private lastGeometryRebuildTime: number = 0;

  constructor(initialSeed?: number) {
    // Random phase offsets create unique but smooth curves each time
    const seed = initialSeed ?? Math.random() * 10000;
    this.phaseOffsetX = seed * 0.1;
    this.phaseOffsetY = seed * 0.17;

    // Generate initial tunnel
    this.generateAhead(INITIAL_LENGTH);
  }

  /**
   * Generate a control point at the given Z position using layered sine waves.
   * This creates smooth, flowing curves without the chaos of noise.
   */
  private generatePointAt(z: number): THREE.Vector3 {
    // X position: layered sine waves with different frequencies
    // Primary wave: large, slow sweeping curves
    const x1 = Math.sin(z * PRIMARY_FREQUENCY + this.phaseOffsetX) * PRIMARY_AMPLITUDE;
    // Secondary wave: medium variation layered on top
    const x2 = Math.sin(z * SECONDARY_FREQUENCY + this.phaseOffsetX * 1.3) * SECONDARY_AMPLITUDE;
    // Tertiary wave: subtle detail
    const x3 = Math.sin(z * TERTIARY_FREQUENCY + this.phaseOffsetX * 0.7) * TERTIARY_AMPLITUDE;

    // Y position: similar approach but with cosine and different phase offsets
    // This creates movement that doesn't directly correlate with X
    const y1 = Math.cos(z * PRIMARY_FREQUENCY * 0.7 + this.phaseOffsetY) * PRIMARY_AMPLITUDE;
    const y2 = Math.cos(z * SECONDARY_FREQUENCY * 1.2 + this.phaseOffsetY * 0.8) * SECONDARY_AMPLITUDE;
    const y3 = Math.sin(z * TERTIARY_FREQUENCY * 0.9 + this.phaseOffsetY * 1.5) * TERTIARY_AMPLITUDE;

    const x = x1 + x2 + x3;
    const y = y1 + y2 + y3;

    // Soft clamping to keep within bounds while maintaining smoothness
    return new THREE.Vector3(
      clamp(x, -MAX_OFFSET, MAX_OFFSET),
      clamp(y, -MAX_OFFSET, MAX_OFFSET),
      -z // Negative Z for forward direction
    );
  }

  /**
   * Generate points ahead up to targetZ
   */
  generateAhead(targetZ: number): boolean {
    let pointsAdded = false;

    // If no points exist, start from 0
    if (this.points.length === 0) {
      this.minZ = 0;
      this.maxZ = 0;
    }

    // Generate points up to targetZ
    while (this.maxZ < targetZ) {
      const newPoint = this.generatePointAt(this.maxZ);
      this.points.push(newPoint);
      this.maxZ += POINT_SPACING;
      pointsAdded = true;
    }

    if (pointsAdded) {
      this.curveDirty = true;
      this.geometryDirty = true;
    }

    return pointsAdded;
  }

  /**
   * Remove points behind minZ (keeping some buffer for smooth transitions)
   */
  trimBehind(cameraZ: number): boolean {
    const trimThreshold = cameraZ - BEHIND_KEEP;

    // Count how many points to remove
    let removeCount = 0;
    for (const point of this.points) {
      // Point Z is negative, cameraZ is positive, so compare absolute values
      if (Math.abs(point.z) < trimThreshold) {
        removeCount++;
      } else {
        break;
      }
    }

    if (removeCount > 0 && this.points.length - removeCount >= 4) {
      // Keep at least 4 points for valid CatmullRom curve
      this.points.splice(0, removeCount);
      this.minZ = Math.abs(this.points[0].z);
      this.curveDirty = true;
      this.geometryDirty = true;
      return true;
    }

    return false;
  }

  /**
   * Get the current curve (rebuilds if dirty, with throttling)
   */
  getCurve(): THREE.CatmullRomCurve3 {
    const now = performance.now();

    if (this.curveDirty && now - this.lastCurveRebuildTime > INFINITE_TUNNEL_CONFIG.CURVE_REBUILD_THROTTLE) {
      this.rebuildCurve();
      this.lastCurveRebuildTime = now;
    }

    return this.curve!;
  }

  /**
   * Force rebuild the curve (used for initial setup)
   */
  private rebuildCurve(): void {
    if (this.points.length < 4) {
      console.warn('InfiniteCurve: Not enough points to rebuild curve');
      return;
    }

    this.curve = new THREE.CatmullRomCurve3(this.points, false, 'catmullrom', 0.5);
    this.curveDirty = false;
  }

  /**
   * Get the geometry (rebuilds if dirty, with throttling)
   */
  getGeometry(): THREE.TubeGeometry {
    const now = performance.now();

    // Ensure curve is up to date first
    this.getCurve();

    if (this.geometryDirty && now - this.lastGeometryRebuildTime > INFINITE_TUNNEL_CONFIG.GEOMETRY_REBUILD_THROTTLE) {
      this.rebuildGeometry();
      this.lastGeometryRebuildTime = now;
    }

    return this.geometry!;
  }

  /**
   * Force rebuild the geometry
   */
  private rebuildGeometry(): void {
    if (!this.curve) {
      console.warn('InfiniteCurve: No curve available for geometry rebuild');
      return;
    }

    // Dispose old geometry to prevent memory leak
    if (this.geometry) {
      this.geometry.dispose();
    }

    // Calculate tubular segments based on curve length
    const curveLength = this.maxZ - this.minZ;
    const tubularSegments = Math.ceil(curveLength * 0.8); // ~0.8 segments per unit

    this.geometry = new THREE.TubeGeometry(
      this.curve,
      tubularSegments,
      TUNNEL_CONFIG.TUBE_RADIUS,
      TUNNEL_CONFIG.TUBE_RADIAL_SEGMENTS,
      false
    );

    this.geometryDirty = false;
  }

  /**
   * Check if geometry needs update (for external polling)
   */
  isGeometryDirty(): boolean {
    return this.geometryDirty;
  }

  /**
   * Convert absolute Z position to local t parameter (0-1 within current curve)
   */
  zToLocalT(z: number): number {
    const curveLength = this.maxZ - this.minZ;
    if (curveLength <= 0) return 0;

    // Z is relative to current curve window
    const relativeZ = z - this.minZ;
    return clamp(relativeZ / curveLength, 0.001, 0.999);
  }

  /**
   * Get point at absolute Z position
   */
  getPointAtZ(z: number): THREE.Vector3 {
    const t = this.zToLocalT(z);
    return this.getCurve().getPointAt(t);
  }

  /**
   * Get tangent at absolute Z position
   */
  getTangentAtZ(z: number): THREE.Vector3 {
    const t = this.zToLocalT(z);
    return this.getCurve().getTangentAt(t);
  }

  /**
   * Get the current minimum Z (oldest point)
   */
  getMinZ(): number {
    return this.minZ;
  }

  /**
   * Get the current maximum Z (newest point)
   */
  getMaxZ(): number {
    return this.maxZ;
  }

  /**
   * Get the total curve length
   */
  getCurveLength(): number {
    return this.maxZ - this.minZ;
  }

  /**
   * Update the curve based on camera position.
   * Call this every frame to manage generation and cleanup.
   * @param cameraZ The camera's current Z position (absolute, positive value)
   * @param velocity Current velocity (used to calculate ahead buffer)
   */
  update(cameraZ: number, velocity: number): void {
    // Calculate dynamic ahead buffer based on velocity
    const speedFactor = Math.abs(velocity);
    const aheadBuffer = Math.max(MIN_AHEAD_BUFFER, speedFactor * 400);

    // Generate ahead
    this.generateAhead(cameraZ + aheadBuffer);

    // Trim behind
    this.trimBehind(cameraZ);
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    this.curve = null;
    this.points = [];
  }
}
