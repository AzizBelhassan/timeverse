'use client';

import { useState, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { WormholeScene } from './scenes/WormholeScene';
import { HUD } from './components/HUD';
import './index.css';

type WarpPhase = 'idle' | 'accelerating' | 'cruising' | 'decelerating';

// Hoist static camera config outside component (rendering-hoist-jsx)
const CAMERA_CONFIG = {
  fov: 75,
  near: 0.1,
  far: 1000,
  position: [0, 0, 5] as [number, number, number],
};

const GL_CONFIG = {
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance' as const,
};

const CANVAS_STYLE = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: '#0a0015',
};

function App() {
  // Lazy state initialization (rerender-lazy-state-init)
  const [speed, setSpeed] = useState(() => 0.15);
  const [dpr, setDpr] = useState(() => 1.5);
  const [actions, setActions] = useState<{ stop: () => void; toggleCameraMode: () => void; initiateWarp: () => void } | null>(null);
  const [isWarping, setIsWarping] = useState(false);
  const [warpPhase, setWarpPhase] = useState<WarpPhase>('idle');

  // Stable callbacks (rerender-functional-setstate)
  const handleDecline = useCallback(() => setDpr(1), []);
  const handleIncline = useCallback(() => setDpr(1.5), []);
  const handleActionsReady = useCallback((a: { stop: () => void; toggleCameraMode: () => void; initiateWarp: () => void }) => setActions(a), []);
  const handleWarpStateChange = useCallback((warping: boolean, phase: WarpPhase) => {
    setIsWarping(warping);
    setWarpPhase(phase);
  }, []);

  return (
    <>
      <Canvas
        camera={CAMERA_CONFIG}
        dpr={dpr}
        gl={GL_CONFIG}
        style={CANVAS_STYLE}
      >
        <PerformanceMonitor
          onDecline={handleDecline}
          onIncline={handleIncline}
        >
          <Suspense fallback={null}>
            <WormholeScene
              onSpeedChange={setSpeed}
              onActionsReady={handleActionsReady}
              onWarpStateChange={handleWarpStateChange}
            />
          </Suspense>
        </PerformanceMonitor>
      </Canvas>
      <HUD
        speed={speed}
        onStop={actions?.stop}
        onToggleCamera={actions?.toggleCameraMode}
        onBoost={actions?.initiateWarp}
        isWarping={isWarping}
        warpPhase={warpPhase}
      />
    </>
  );
}

export default App;
