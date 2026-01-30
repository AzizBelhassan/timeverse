'use client';

import { useRef, memo, useEffect, useMemo } from 'react';
import { useFrame, extend, ThreeElement } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useWormholeMeta, useWormholeState } from '../contexts/WormholeContext';
import { TUNNEL_CONFIG, EFFECTS_CONFIG } from '../utils/constants';

// Create grid lines geometry from tube geometry (rings + longitudinal lines)
function createTunnelGridGeometry(tubeGeometry: THREE.TubeGeometry): THREE.BufferGeometry {
  const positions: number[] = [];

  const tubularSegments = tubeGeometry.parameters.tubularSegments;
  const radialSegments = tubeGeometry.parameters.radialSegments;
  const posAttr = tubeGeometry.getAttribute('position');

  // Helper to get vertex index in the tube geometry
  const getVertexIndex = (tubular: number, radial: number) => {
    return tubular * (radialSegments + 1) + radial;
  };

  // Add ring lines (every few segments for performance)
  const ringStep = Math.max(1, Math.floor(tubularSegments / 80)); // ~80 rings
  for (let t = 0; t <= tubularSegments; t += ringStep) {
    for (let r = 0; r < radialSegments; r++) {
      const i1 = getVertexIndex(t, r);
      const i2 = getVertexIndex(t, r + 1);

      positions.push(
        posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1),
        posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2)
      );
    }
  }

  // Add longitudinal lines (every few radial segments)
  const longiStep = Math.max(1, Math.floor(radialSegments / 12)); // 12 longitudinal lines
  for (let r = 0; r < radialSegments; r += longiStep) {
    for (let t = 0; t < tubularSegments; t++) {
      const i1 = getVertexIndex(t, r);
      const i2 = getVertexIndex(t + 1, r);

      positions.push(
        posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1),
        posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2)
      );
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

// Hoist static color values (r3f-shaders: cache expensive operations)
const COLOR_PURPLE = new THREE.Color(EFFECTS_CONFIG.COLOR_PURPLE);
const COLOR_CYAN = new THREE.Color(EFFECTS_CONFIG.COLOR_CYAN);
const COLOR_LIGHT_GREY = new THREE.Color(0.8, 0.8, 0.8);

// Create custom shader material with shaderMaterial (r3f-shaders: recommended pattern)
// This enables HMR for shader development via the key prop
const TunnelShaderMaterial = shaderMaterial(
  {
    time: 0,
    color1: COLOR_PURPLE,
    color2: COLOR_CYAN,
    opacity: TUNNEL_CONFIG.TUNNEL_OPACITY,
    warpIntensity: 0,
  },
  // Vertex shader
  `
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      vPosition = position;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader with warp radial stretch and helicoidal effect
  `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float opacity;
    uniform float warpIntensity;

    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      // Calculate radial distortion from center for warp effect
      vec2 toCenter = vUv - vec2(0.5);
      float dist = length(toCenter);
      float stretchFactor = 1.0 + warpIntensity * dist * 2.0;
      vec2 stretchedUV = vec2(0.5) + toCenter * stretchFactor;

      // Use stretched UV for gradient calculation
      float gradient = sin(stretchedUV.x * 10.0 + time) * 0.5 + 0.5;
      vec3 color = mix(color1, color2, gradient);

      // Helicoidal (spiral) effect during warp
      // vUv.x is the angular position around the tube (0-1)
      // vPosition.z is the position along the tunnel
      float twistRate = 0.15;  // How tight the spiral is
      float spiralSpeed = 8.0; // How fast it rotates
      float spiralCount = 4.0; // Number of spiral arms

      // Create spiral pattern: angle + z*twist - time*speed
      float spiralAngle = vUv.x * 6.28318 * spiralCount + vPosition.z * twistRate - time * spiralSpeed * warpIntensity;
      float spiral = sin(spiralAngle) * 0.5 + 0.5;

      // Sharp spiral bands
      float spiralBand = pow(spiral, 3.0) * warpIntensity;

      // Secondary faster spiral for more detail
      float spiral2Angle = vUv.x * 6.28318 * 8.0 - vPosition.z * twistRate * 0.5 + time * spiralSpeed * 1.5 * warpIntensity;
      float spiral2 = pow(sin(spiral2Angle) * 0.5 + 0.5, 4.0) * warpIntensity * 0.5;

      // Speed lines effect during warp
      float speedLines = pow(sin(vPosition.z * 0.5 - time * 10.0 * warpIntensity) * 0.5 + 0.5, 4.0) * warpIntensity;

      // Increase pulse frequency and brightness during warp
      float pulseFreq = 2.0 + warpIntensity * 8.0;
      float pulse = sin(time * pulseFreq + vPosition.z * 0.1) * 0.2 + 0.8;

      // Brighten and shift toward white during warp
      vec3 warpColor = mix(color, vec3(1.0), warpIntensity * 0.3);
      warpColor += speedLines * vec3(0.5, 0.7, 1.0);

      // Add helicoidal glow - cyan/white spiral bands
      vec3 spiralColor = vec3(0.3, 0.8, 1.0); // Cyan glow
      warpColor += spiralBand * spiralColor * 1.5;
      warpColor += spiral2 * vec3(1.0, 0.9, 0.8) * 0.8; // Secondary warm spiral

      // Increase opacity during warp for more visible effect
      float finalOpacity = opacity + warpIntensity * 0.3 + spiralBand * 0.2;

      gl_FragColor = vec4(warpColor * pulse, finalOpacity);
    }
  `
);

// Extend R3F to recognize custom materials as JSX elements
extend({ TunnelShaderMaterial });

// TypeScript declarations for JSX (r3f-shaders: TypeScript support)
declare module '@react-three/fiber' {
  interface ThreeElements {
    tunnelShaderMaterial: ThreeElement<typeof TunnelShaderMaterial>;
  }
}

// Memoized component (r3f-fundamentals: isolate animated components)
export const TunnelGeometry = memo(function TunnelGeometry() {
  const { getGeometry, geometryVersion } = useWormholeMeta();
  const { warpIntensity } = useWormholeState();
  const tunnelMeshRef = useRef<THREE.Mesh>(null);
  const gridLinesRef = useRef<THREE.LineSegments>(null);
  const tunnelRef = useRef<THREE.ShaderMaterial & { time: number; warpIntensity: number }>(null);
  const timeRef = useRef(0);

  // Create grid geometry from tube geometry
  const gridGeometry = useMemo(() => {
    const tubeGeometry = getGeometry();
    return createTunnelGridGeometry(tubeGeometry);
  }, [getGeometry, geometryVersion]);

  // Update mesh geometry when it changes
  useEffect(() => {
    const geometry = getGeometry();
    if (tunnelMeshRef.current) {
      tunnelMeshRef.current.geometry = geometry;
    }
    if (gridLinesRef.current) {
      gridLinesRef.current.geometry = gridGeometry;
    }
  }, [geometryVersion, getGeometry, gridGeometry]);

  // Animate materials using ref for transient values (r3f-animation: use refs over state)
  useFrame((_, delta) => {
    timeRef.current += delta;

    // Direct property access instead of uniforms.time.value (r3f-shaders: shaderMaterial pattern)
    if (tunnelRef.current) {
      tunnelRef.current.time = timeRef.current;
      tunnelRef.current.warpIntensity = warpIntensity;
    }
  });

  // Get initial geometry
  const initialGeometry = getGeometry();

  return (
    <group>
      <mesh ref={tunnelMeshRef} geometry={initialGeometry}>
        {/* key prop enables HMR for shader development (r3f-shaders: HMR support) */}
        <tunnelShaderMaterial
          ref={tunnelRef}
          key={TunnelShaderMaterial.key}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      {/* Grid lines: rings + longitudinal lines (hidden during warp) */}
      <lineSegments ref={gridLinesRef} geometry={gridGeometry} visible={warpIntensity < 0.1}>
        <lineBasicMaterial color={COLOR_LIGHT_GREY} transparent opacity={0.25} />
      </lineSegments>
    </group>
  );
});
