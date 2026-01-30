'use client';

import { useRef, useMemo, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWormholeState, useWormholeMeta } from '../contexts/WormholeContext';
import { EFFECTS_CONFIG, WARP_CONFIG } from '../utils/constants';

// Hoist static values outside component (rendering-hoist-jsx, js-cache-property-access)
const RING_GEOMETRY = new THREE.TorusGeometry(
  EFFECTS_CONFIG.RING_BASE_RADIUS,
  EFFECTS_CONFIG.RING_TUBE_RADIUS,
  8,
  64
);

const RING_MATERIAL = new THREE.MeshBasicMaterial({
  color: new THREE.Color(EFFECTS_CONFIG.RING_COLOR_PRIMARY),
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
});

const COLOR_NEAR = new THREE.Color(EFFECTS_CONFIG.RING_COLOR_PRIMARY); // Cyan when close
const COLOR_FAR = new THREE.Color(0x0044ff); // Blue when far
const COLOR_WARP = new THREE.Color(0xffffff); // White/bright during warp
const UP_VECTOR = new THREE.Vector3(0, 0, 1);
const MAX_DISTANCE = 100; // Distance at which rings are fully blue
const RING_Z_SPACING = 10; // Z units between rings

// Memoized component (rerender-memo)
export const GlowRings = memo(function GlowRings() {
  const { progress, warpIntensity } = useWormholeState();
  const { infiniteCurve } = useWormholeMeta();
  const { camera } = useThree();

  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);

  // During warp, use more rings for denser effect
  const ringCount = EFFECTS_CONFIG.RING_COUNT * WARP_CONFIG.RING_DENSITY_MULTIPLIER;

  // Reusable objects to avoid allocation in render loop (js-cache-function-results)
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);

  useFrame(() => {
    if (!instancedMeshRef.current) return;

    const mesh = instancedMeshRef.current;
    const cameraPos = camera.position;
    const currentZ = progress;
    const maxZ = infiniteCurve.getMaxZ();

    // Adjust spacing based on warp intensity (denser during warp)
    const currentSpacing = RING_Z_SPACING - warpIntensity * (RING_Z_SPACING - WARP_CONFIG.RING_SPACING_WARP);

    // Single loop for all ring updates (js-combine-iterations)
    for (let i = 0; i < ringCount; i++) {
      // Calculate ring Z position (ahead of camera)
      const ringZ = currentZ + i * currentSpacing;

      // Skip if beyond generated curve
      if (ringZ >= maxZ - 10) {
        // Hide ring by scaling to zero
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      try {
        const position = infiniteCurve.getPointAtZ(ringZ);
        const tangent = infiniteCurve.getTangentAtZ(ringZ);

        dummy.position.copy(position);

        quaternion.setFromUnitVectors(UP_VECTOR, tangent);
        dummy.quaternion.copy(quaternion);

        dummy.scale.setScalar(1.0);

        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        // Color based on distance from camera (far = blue, near = cyan)
        // During warp, shift toward white/bright
        const distance = position.distanceTo(cameraPos);
        const colorMix = Math.min(distance / MAX_DISTANCE, 1);
        tempColor.lerpColors(COLOR_NEAR, COLOR_FAR, colorMix);
        // Blend toward white during warp
        tempColor.lerp(COLOR_WARP, warpIntensity * 0.6);
        mesh.setColorAt(i, tempColor);
      } catch {
        // Hide ring on error
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[RING_GEOMETRY, RING_MATERIAL, ringCount]}
      frustumCulled={false}
    />
  );
});
