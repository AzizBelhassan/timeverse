'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { createTunnelCurve } from '../utils/tunnelMath';
import { TUNNEL_CONFIG } from '../utils/constants';

interface TunnelSegment {
  curve: THREE.CatmullRomCurve3;
  geometry: THREE.TubeGeometry;
  startZ: number;
}

export function useProceduralTunnel() {
  const segmentIndexRef = useRef(0);

  // Create the main tunnel curve
  const curve = useMemo(() => {
    return createTunnelCurve(0);
  }, []);

  // Create tube geometry from the curve
  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(
      curve,
      TUNNEL_CONFIG.TUBE_TUBULAR_SEGMENTS,
      TUNNEL_CONFIG.TUBE_RADIUS,
      TUNNEL_CONFIG.TUBE_RADIAL_SEGMENTS,
      false
    );
  }, [curve]);

  // Get the total length of the curve for progress calculations
  const curveLength = useMemo(() => {
    return curve.getLength();
  }, [curve]);

  // Function to extend the tunnel (for future infinite scrolling)
  const extendTunnel = (): TunnelSegment => {
    segmentIndexRef.current += 1;
    const newCurve = createTunnelCurve(segmentIndexRef.current);
    const newGeometry = new THREE.TubeGeometry(
      newCurve,
      TUNNEL_CONFIG.TUBE_TUBULAR_SEGMENTS,
      TUNNEL_CONFIG.TUBE_RADIUS,
      TUNNEL_CONFIG.TUBE_RADIAL_SEGMENTS,
      false
    );

    return {
      curve: newCurve,
      geometry: newGeometry,
      startZ: segmentIndexRef.current * TUNNEL_CONFIG.SEGMENT_LENGTH,
    };
  };

  return {
    curve,
    geometry,
    curveLength,
    extendTunnel,
  };
}
