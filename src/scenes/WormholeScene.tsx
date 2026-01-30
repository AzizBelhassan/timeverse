'use client';

import { memo, useRef } from 'react';
import { Stars } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { WormholeProvider, useWormholeState } from '../contexts/WormholeContext';
import { TunnelGeometry } from './TunnelGeometry';
import { GlowRings } from './GlowRings';
import { EFFECTS_CONFIG } from '../utils/constants';


// Hoist static fog args outside component (rendering-hoist-jsx)
const FOG_ARGS: [string, number, number] = ['#0a0015', 10, 200];

// Compound component pattern (architecture-compound-components)
// Each subcomponent can be composed independently

// Background stars component - fixed skybox that follows camera
const WormholeStars = memo(function WormholeStars() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { warpIntensity } = useWormholeState();

  // Make stars follow camera position so they appear infinitely distant
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(camera.position);
    }
  });

  // During warp, increase star speed for motion effect
  const starSpeed = warpIntensity * 2;

  return (
    <group ref={groupRef}>
      {/* Distant background stars - small and numerous */}
      <Stars
        radius={300}
        depth={100}
        count={5000}
        factor={2}
        saturation={0}
        fade
        speed={starSpeed}
      />
      {/* Mid-distance stars - medium brightness */}
      <Stars
        radius={150}
        depth={80}
        count={2000}
        factor={4}
        saturation={0.1}
        fade
        speed={starSpeed * 1.5}
      />
      {/* Closer bright stars - fewer but more prominent */}
      <Stars
        radius={80}
        depth={50}
        count={500}
        factor={6}
        saturation={0.2}
        fade
        speed={starSpeed * 2}
      />
    </group>
  );
});

// Lighting setup component
const WormholeLighting = memo(function WormholeLighting() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight
        position={[0, 0, -50]}
        intensity={2}
        color={EFFECTS_CONFIG.COLOR_CYAN}
        distance={100}
      />
      <pointLight
        position={[0, 0, -150]}
        intensity={2}
        color={EFFECTS_CONFIG.COLOR_PURPLE}
        distance={100}
      />
    </>
  );
});

// Fog component
const WormholeFog = memo(function WormholeFog() {
  return <fog attach="fog" args={FOG_ARGS} />;
});

// Frame component that composes all visual elements (patterns-children-over-render-props)
function WormholeFrame({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

type WarpPhase = 'idle' | 'accelerating' | 'cruising' | 'decelerating';

interface WormholeSceneProps {
  onSpeedChange?: (speed: number) => void;
  onWarpStateChange?: (isWarping: boolean, warpPhase: WarpPhase, warpIntensity: number) => void;
  onActionsReady?: (actions: { stop: () => void; toggleCameraMode: () => void; initiateWarp: () => void }) => void;
}

// Main scene using composition pattern (architecture-avoid-boolean-props)
// Instead of boolean props, consumers compose what they need
export function WormholeScene({ onSpeedChange, onWarpStateChange, onActionsReady }: WormholeSceneProps) {
  return (
    <WormholeProvider onSpeedChange={onSpeedChange} onWarpStateChange={onWarpStateChange} onActionsReady={onActionsReady}>
      <Wormhole.Frame>
        <Wormhole.Stars />
        <Wormhole.Lighting />
        <Wormhole.Tunnel />
        <Wormhole.Rings />
        <Wormhole.Fog />
      </Wormhole.Frame>
    </WormholeProvider>
  );
}

// Export as compound component (patterns-explicit-variants)
// Allows consumers to compose custom scenes
export const Wormhole = {
  Provider: WormholeProvider,
  Frame: WormholeFrame,
  Stars: WormholeStars,
  Lighting: WormholeLighting,
  Tunnel: TunnelGeometry,
  Rings: GlowRings,
  Fog: WormholeFog,
};

// Explicit variant: Minimal scene without particles (patterns-explicit-variants)
export function MinimalWormholeScene({ onSpeedChange }: WormholeSceneProps) {
  return (
    <WormholeProvider onSpeedChange={onSpeedChange}>
      <Wormhole.Frame>
        <Wormhole.Stars />
        <Wormhole.Lighting />
        <Wormhole.Tunnel />
        <Wormhole.Rings />
        <Wormhole.Fog />
      </Wormhole.Frame>
    </WormholeProvider>
  );
}

// Explicit variant: Performance-focused scene (patterns-explicit-variants)
export function PerformanceWormholeScene({ onSpeedChange }: WormholeSceneProps) {
  return (
    <WormholeProvider onSpeedChange={onSpeedChange}>
      <Wormhole.Frame>
        <Wormhole.Lighting />
        <Wormhole.Tunnel />
        <Wormhole.Fog />
      </Wormhole.Frame>
    </WormholeProvider>
  );
}
