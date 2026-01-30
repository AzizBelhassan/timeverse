'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGesture } from '@use-gesture/react';
import * as THREE from 'three';
import { NAV_CONFIG } from '../utils/constants';
import { getCameraTransform, lerp } from '../utils/tunnelMath';

interface NavigationState {
  progress: number;
  velocity: number;
  targetVelocity: number;
}

export function useTunnelNavigation(curve: THREE.CatmullRomCurve3) {
  const { camera, gl } = useThree();

  const stateRef = useRef<NavigationState>({
    progress: 0.001,
    velocity: NAV_CONFIG.DEFAULT_SPEED,
    targetVelocity: NAV_CONFIG.DEFAULT_SPEED,
  });

  const keysPressed = useRef<Set<string>>(new Set());

  // Handle scroll wheel input
  const bind = useGesture(
    {
      onWheel: ({ delta: [, dy] }) => {
        const state = stateRef.current;
        // Scroll down = speed up, scroll up = slow down
        state.targetVelocity += dy * NAV_CONFIG.SCROLL_SENSITIVITY;
        state.targetVelocity = Math.max(
          NAV_CONFIG.MIN_SPEED,
          Math.min(NAV_CONFIG.MAX_SPEED, state.targetVelocity)
        );
      },
    },
    {
      target: gl.domElement,
      eventOptions: { passive: false },
    }
  );

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'w' || e.key === 's') {
        keysPressed.current.add(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update camera position each frame
  useFrame((_, delta) => {
    const state = stateRef.current;

    // Process keyboard input
    if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w')) {
      state.targetVelocity += NAV_CONFIG.KEY_ACCELERATION;
    }
    if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s')) {
      state.targetVelocity -= NAV_CONFIG.KEY_ACCELERATION;
    }

    // Clamp target velocity
    state.targetVelocity = Math.max(
      NAV_CONFIG.MIN_SPEED,
      Math.min(NAV_CONFIG.MAX_SPEED, state.targetVelocity)
    );

    // Smooth velocity transition
    state.velocity = lerp(state.velocity, state.targetVelocity, NAV_CONFIG.LERP_FACTOR);

    // Update progress along curve
    state.progress += state.velocity * delta * 0.1;

    // Loop the tunnel when reaching the end
    if (state.progress >= 0.95) {
      state.progress = 0.001;
    }

    // Get camera transform from curve
    const transform = getCameraTransform(
      curve,
      state.progress,
      NAV_CONFIG.LOOK_AHEAD_DISTANCE
    );

    // Apply smooth camera movement
    camera.position.lerp(transform.position, 0.1);

    // Smooth look-at
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.add(camera.position);
    currentLookAt.lerp(transform.lookAt, 0.1);
    camera.lookAt(currentLookAt);

    // Subtle camera roll for immersion
    const roll = Math.sin(state.progress * Math.PI * 4) * 0.05;
    camera.rotation.z = lerp(camera.rotation.z, roll, 0.05);
  });

  // Get current speed as a normalized value (0-1)
  const getSpeed = useCallback(() => {
    return (stateRef.current.velocity - NAV_CONFIG.MIN_SPEED) /
           (NAV_CONFIG.MAX_SPEED - NAV_CONFIG.MIN_SPEED);
  }, []);

  // Get current progress (0-1)
  const getProgress = useCallback(() => {
    return stateRef.current.progress;
  }, []);

  return {
    bind,
    getSpeed,
    getProgress,
    stateRef,
  };
}
