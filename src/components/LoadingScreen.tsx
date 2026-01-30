'use client';

import { memo } from 'react';

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
  },
  spinner: {
    width: '64px',
    height: '64px',
    border: '3px solid rgba(0, 212, 255, 0.2)',
    borderTopColor: '#00d4ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  text: {
    color: '#00d4ff',
    fontFamily: "'Courier New', monospace",
    fontSize: '14px',
    letterSpacing: '6px',
    opacity: 0.8,
  },
  subtext: {
    color: 'rgba(0, 212, 255, 0.5)',
    fontFamily: "'Courier New', monospace",
    fontSize: '11px',
    letterSpacing: '2px',
  },
} as const;

export const LoadingScreen = memo(function LoadingScreen() {
  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={styles.spinner} />
      <span style={styles.text}>LOADING</span>
      <span style={styles.subtext}>Initializing wormhole...</span>
    </div>
  );
});
