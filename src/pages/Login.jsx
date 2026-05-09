import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '../firebase'

export default function Login() {
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/logo.png" alt="Mosaic" style={styles.logo} />
        <h1 style={styles.title}>Mosaic</h1>
        <p style={styles.tagline}>Many pieces. One unforgettable trip.</p>
        <p style={styles.subtitle}>Capture trips together. Share them beautifully. Relive them forever.</p>
        <button onClick={handleGoogleSignIn} style={styles.button}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={{ width: 20, height: 20, marginRight: 10 }}
          />
          Sign in with Google
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f6f1',
    padding: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '48px 36px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
    maxWidth: '400px',
    width: '100%',
  },
  logo: {
    width: '72px',
    height: '72px',
    marginBottom: '20px',
    objectFit: 'contain',
  },
  title: {
    fontSize: '2.4rem',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '8px',
    fontFamily: 'Georgia, serif',
    letterSpacing: '-0.02em',
  },
  tagline: {
    fontSize: '0.85rem',
    color: '#b09070',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: '24px',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '36px',
    lineHeight: '1.6',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '14px 20px',
    backgroundColor: '#ffffff',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#333',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
  },
}
