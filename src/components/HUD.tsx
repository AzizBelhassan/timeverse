'use client';

import { useRef, memo } from 'react';

type WarpPhase = 'idle' | 'accelerating' | 'cruising' | 'decelerating';

interface HUDProps {
  speed: number;
  onStop?: () => void;
  onToggleCamera?: () => void;
  onBoost?: () => void;
  isWarping?: boolean;
  warpPhase?: WarpPhase;
}

// Hoist static styles outside component (rendering-hoist-jsx)
const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    fontFamily: "'Courier New', monospace",
    color: '#00d4ff',
    zIndex: 100,
  },
  speedContainer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    width: 200,
  },
  speedLabel: {
    fontSize: 12,
    letterSpacing: 4,
    opacity: 0.6,
    marginBottom: 4,
  },
  speedValue: {
    fontSize: 48,
    fontWeight: 'bold',
    textShadow: '0 0 20px rgba(0, 212, 255, 0.8)',
  },
  speedBar: {
    height: 4,
    background: 'rgba(0, 212, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
    position: 'relative',
  },
  speedBarCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 2,
    height: '100%',
    background: 'rgba(0, 212, 255, 0.5)',
  },
  speedFillBase: {
    position: 'absolute',
    top: 0,
    height: '100%',
    background: 'linear-gradient(90deg, #4a00e0, #00d4ff)',
    borderRadius: 2,
    transition: 'width 0.1s ease-out, left 0.1s ease-out',
    boxShadow: '0 0 10px rgba(0, 212, 255, 0.8)',
  },
  controlsHint: {
    position: 'absolute',
    bottom: 40,
    right: 40,
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'right',
  },
  key: {
    background: 'rgba(0, 212, 255, 0.2)',
    padding: '2px 6px',
    borderRadius: 3,
    border: '1px solid rgba(0, 212, 255, 0.4)',
  },
  separator: {
    margin: '0 12px',
    opacity: 0.4,
  },
  title: {
    position: 'absolute',
    top: 40,
    left: 40,
    fontSize: 14,
    letterSpacing: 8,
    opacity: 0.4,
  },
  controlPanel: {
    position: 'absolute',
    top: 40,
    right: 40,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    pointerEvents: 'auto',
  },
  button: {
    background: 'rgba(0, 212, 255, 0.1)',
    border: '1px solid rgba(0, 212, 255, 0.4)',
    borderRadius: 4,
    padding: '8px 16px',
    color: '#00d4ff',
    fontSize: 12,
    letterSpacing: 2,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Courier New', monospace",
  },
  boostButton: {
    background: 'rgba(255, 100, 0, 0.2)',
    border: '1px solid rgba(255, 150, 0, 0.6)',
    borderRadius: 4,
    padding: '8px 16px',
    color: '#ff9900',
    fontSize: 12,
    letterSpacing: 2,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Courier New', monospace",
  },
  boostButtonDisabled: {
    background: 'rgba(100, 100, 100, 0.1)',
    border: '1px solid rgba(100, 100, 100, 0.3)',
    borderRadius: 4,
    padding: '8px 16px',
    color: '#666666',
    fontSize: 12,
    letterSpacing: 2,
    cursor: 'not-allowed',
    transition: 'all 0.2s ease',
    fontFamily: "'Courier New', monospace",
  },
  boostButtonWarping: {
    background: 'rgba(255, 100, 0, 0.4)',
    border: '1px solid rgba(255, 150, 0, 0.8)',
    borderRadius: 4,
    padding: '8px 16px',
    color: '#ffcc00',
    fontSize: 12,
    letterSpacing: 2,
    cursor: 'not-allowed',
    transition: 'all 0.2s ease',
    fontFamily: "'Courier New', monospace",
    boxShadow: '0 0 15px rgba(255, 150, 0, 0.5)',
    animation: 'pulse 0.5s ease-in-out infinite alternate',
  },
} as const;

// Memoized subcomponents (rerender-memo)
const SpeedLabel = memo(function SpeedLabel() {
  return <div style={styles.speedLabel}>VELOCITY</div>;
});

const ControlsHint = memo(function ControlsHint() {
  return (
    <div style={styles.controlsHint}>
      <span style={styles.key}>↑</span> / <span style={styles.key}>SCROLL ↓</span> Speed Up
      <span style={styles.separator}>|</span>
      <span style={styles.key}>↓</span> / <span style={styles.key}>SCROLL ↑</span> Slow Down
    </div>
  );
});

const Title = memo(function Title() {
  return <div style={styles.title}>WORMHOLE TUNNEL</div>;
});

// Reusable button component
const ControlButton = memo(function ControlButton({
  onClick,
  children
}: {
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      style={styles.button}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0, 212, 255, 0.3)';
        e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 212, 255, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {children}
    </button>
  );
});

// Boost button with special styling
const BoostButton = memo(function BoostButton({
  onClick,
  isWarping,
  warpPhase,
}: {
  onClick?: () => void;
  isWarping?: boolean;
  warpPhase?: WarpPhase;
}) {
  const getWarpLabel = () => {
    if (!isWarping) return 'BOOST';
    switch (warpPhase) {
      case 'accelerating': return 'ACCELERATING...';
      case 'cruising': return 'WARPING...';
      case 'decelerating': return 'SLOWING...';
      default: return 'WARPING...';
    }
  };

  const baseStyle = isWarping ? styles.boostButtonWarping : styles.boostButton;

  return (
    <button
      style={baseStyle}
      onClick={isWarping ? undefined : onClick}
      disabled={isWarping}
      onMouseEnter={(e) => {
        if (!isWarping) {
          e.currentTarget.style.background = 'rgba(255, 100, 0, 0.4)';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 150, 0, 0.6)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isWarping) {
          e.currentTarget.style.background = 'rgba(255, 100, 0, 0.2)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {getWarpLabel()}
    </button>
  );
});

// Control panel with buttons
const ControlPanel = memo(function ControlPanel({
  onStop,
  onToggleCamera,
  onBoost,
  isWarping,
  warpPhase,
}: {
  onStop?: () => void;
  onToggleCamera?: () => void;
  onBoost?: () => void;
  isWarping?: boolean;
  warpPhase?: WarpPhase;
}) {
  return (
    <div style={styles.controlPanel}>
      <BoostButton onClick={onBoost} isWarping={isWarping} warpPhase={warpPhase} />
      <ControlButton onClick={onStop}>■ STOP</ControlButton>
      <ControlButton onClick={onToggleCamera}>⎚ CAMERA</ControlButton>
    </div>
  );
});

// Main HUD component using composition (architecture-compound-components)
export const HUD = memo(function HUD({ speed, onStop, onToggleCamera, onBoost, isWarping, warpPhase }: HUDProps) {
  // Use ref for transient display value (rerender-use-ref-transient-values)
  // Derive state during render instead of useEffect (rerender-derived-state-no-effect)
  const displaySpeedRef = useRef(0);

  // Snap to 0 when speed is 0, otherwise lerp for smooth transitions
  if (speed === 0) {
    displaySpeedRef.current = 0;
  } else {
    displaySpeedRef.current = displaySpeedRef.current + (speed - displaySpeedRef.current) * 0.1;
  }

  // Speed now ranges from -1 to 1, display as -100% to 100%
  // During warp, speed can exceed 100%, so we cap display at reasonable max
  const speedPercent = Math.round(displaySpeedRef.current * 100);
  const displayPercent = Math.min(Math.abs(speedPercent), 999); // Cap at 999% for display
  // Bar shows from center (50%) outward, so width is half of speedPercent
  // At 100% speed, bar fills half the container (50% width from center to edge)
  const barWidth = Math.min(Math.abs(speedPercent), 100) / 2;
  const barLeft = speedPercent >= 0 ? 50 : 50 - barWidth;

  return (
    <div style={styles.container}>
      <div style={styles.speedContainer}>
        <SpeedLabel />
        <div style={{
          ...styles.speedValue,
          // Glow effect during warp
          textShadow: isWarping
            ? '0 0 30px rgba(255, 150, 0, 0.8), 0 0 60px rgba(255, 100, 0, 0.5)'
            : '0 0 20px rgba(0, 212, 255, 0.8)',
          color: isWarping ? '#ffcc00' : '#00d4ff',
        }}>
          {speedPercent >= 0 ? '' : '-'}{displayPercent}%
        </div>
        <div style={styles.speedBar}>
          <div style={styles.speedBarCenter} />
          <div
            style={{
              ...styles.speedFillBase,
              width: `${barWidth}%`,
              left: `${barLeft}%`,
              // Orange gradient during warp
              background: isWarping
                ? 'linear-gradient(90deg, #ff6600, #ffcc00)'
                : 'linear-gradient(90deg, #4a00e0, #00d4ff)',
              boxShadow: isWarping
                ? '0 0 15px rgba(255, 150, 0, 0.8)'
                : '0 0 10px rgba(0, 212, 255, 0.8)',
            }}
          />
        </div>
      </div>
      <ControlPanel
        onStop={onStop}
        onToggleCamera={onToggleCamera}
        onBoost={onBoost}
        isWarping={isWarping}
        warpPhase={warpPhase}
      />
      <ControlsHint />
      <Title />
    </div>
  );
});

// Export compound components for custom HUD layouts (patterns-explicit-variants)
export const HUDComponents = {
  Container: memo(function HUDContainer({ children }: { children: React.ReactNode }) {
    return <div style={styles.container}>{children}</div>;
  }),
  SpeedLabel,
  ControlsHint,
  ControlPanel,
  Title,
};
