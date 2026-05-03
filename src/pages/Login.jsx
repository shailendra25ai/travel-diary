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
        <h1 style={styles.title}>Travel Diary</h1>
        <p style={styles.subtitle}>Capture trips together. Relive them forever.</p>
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
    borderRadius: '16px',
    padding: '48px 40px',
    textAlign: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    maxWidth: '380px',
    width: '100%',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '8px',
    fontFamily: 'Georgia, serif',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '36px',
    lineHeight: '1.5',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '14px 20px',
    backgroundColor: '#ffffff',
    border: '1.5px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#333',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
  },
}
