export default function Loading() {
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        background: '#0a0015',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(0, 212, 255, 0.2)',
          borderTopColor: '#00d4ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <span
        style={{
          color: '#00d4ff',
          fontFamily: "'Courier New', monospace",
          fontSize: '14px',
          letterSpacing: '4px',
          opacity: 0.8,
        }}
      >
        INITIALIZING
      </span>
    </div>
  );
}
