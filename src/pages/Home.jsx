import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

export default function Home({ user }) {
  const handleSignOut = async () => {
    await signOut(auth)
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>Travel Diary</h1>
        <div style={styles.userRow}>
          <img src={user.photoURL} alt={user.displayName} style={styles.avatar} />
          <button onClick={handleSignOut} style={styles.signOutBtn}>Sign out</button>
        </div>
      </div>
      <div style={styles.body}>
        <h2 style={styles.welcome}>Welcome, {user.displayName.split(' ')[0]} 👋</h2>
        <p style={styles.hint}>Your trips will appear here. Let's create your first one.</p>
        <button style={styles.createBtn}>+ New Trip</button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9f6f1',
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #eee',
  },
  logo: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Georgia, serif',
    margin: 0,
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
  },
  signOutBtn: {
    fontSize: '0.85rem',
    color: '#888',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  body: {
    padding: '48px 24px',
    textAlign: 'center',
  },
  welcome: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  hint: {
    color: '#888',
    marginBottom: '32px',
  },
  createBtn: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 28px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
}
