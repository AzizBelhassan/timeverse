import Link from 'next/link';

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
  code: {
    color: '#00d4ff',
    fontFamily: "'Courier New', monospace",
    fontSize: '72px',
    fontWeight: 'bold',
    textShadow: '0 0 30px rgba(0, 212, 255, 0.5)',
  },
  title: {
    color: 'rgba(0, 212, 255, 0.8)',
    fontFamily: "'Courier New', monospace",
    fontSize: '14px',
    letterSpacing: '6px',
  },
  link: {
    marginTop: '1rem',
    padding: '12px 24px',
    background: 'transparent',
    border: '1px solid #00d4ff',
    color: '#00d4ff',
    fontFamily: "'Courier New', monospace",
    fontSize: '12px',
    letterSpacing: '2px',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
  },
} as const;

export default function NotFound() {
  return (
    <div style={styles.container}>
      <span style={styles.code}>404</span>
      <span style={styles.title}>LOST IN THE VOID</span>
      <Link href="/" style={styles.link}>
        RETURN TO WORMHOLE
      </Link>
    </div>
  );
}
