'use client';

import { useEffect } from 'react';

const styles = {
  container: {
    width: '100%',
    height: '100vh',
    background: '#0a0015',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column' as const,
    gap: '1.5rem',
    padding: '2rem',
  },
  title: {
    color: '#ff4757',
    fontFamily: "'Courier New', monospace",
    fontSize: '18px',
    letterSpacing: '4px',
  },
  message: {
    color: 'rgba(255, 71, 87, 0.7)',
    fontFamily: "'Courier New', monospace",
    fontSize: '13px',
    textAlign: 'center' as const,
    maxWidth: '400px',
    lineHeight: 1.6,
  },
  button: {
    marginTop: '1rem',
    padding: '12px 24px',
    background: 'transparent',
    border: '1px solid #00d4ff',
    color: '#00d4ff',
    fontFamily: "'Courier New', monospace",
    fontSize: '12px',
    letterSpacing: '2px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
} as const;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    console.error('Wormhole Error:', error);
  }, [error]);

  return (
    <div style={styles.container}>
      <span style={styles.title}>WORMHOLE COLLAPSED</span>
      <p style={styles.message}>
        Something went wrong while rendering the wormhole.
        This may be due to WebGL not being supported or a graphics driver issue.
      </p>
      <button
        onClick={reset}
        style={styles.button}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        TRY AGAIN
      </button>
    </div>
  );
}
