import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { auth, db } from '../firebase'

export default function Home({ user }) {
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'trips'),
      where('members', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTrips(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsubscribe
  }, [user.uid])

  const handleSignOut = async () => {
    await signOut(auth)
  }

  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <img src="/logo-wide.png" alt="Mosaic" style={styles.logoBig} />
        <div style={styles.userRow}>
          <img src={user.photoURL} alt={user.displayName} style={styles.avatar} />
          <button onClick={handleSignOut} style={styles.signOutBtn}>Sign out</button>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.topRow}>
          <h2 style={styles.heading}>Your trips</h2>
          <button onClick={() => navigate('/trips/create')} style={styles.createBtn}>+ New Trip</button>
        </div>

        {loading && <p style={styles.hint}>Loading your trips...</p>}

        {!loading && trips.length === 0 && (
          <div style={styles.empty}>
            <p style={styles.emptyTagline}>Many pieces. One unforgettable trip.</p>
            <p style={styles.emptyText}>No trips yet.</p>
            <p style={styles.hint}>Create your first trip and invite your travel group.</p>
          </div>
        )}

        <div style={styles.tripGrid}>
          {trips.map(trip => (
            <div key={trip.id} style={styles.tripCard} onClick={() => navigate(`/trips/${trip.id}`)}>
              {trip.coverPhotoURL ? (
                <img src={trip.coverPhotoURL} alt={trip.title} style={styles.tripCover} />
              ) : (
                <div style={styles.tripCoverPlaceholder} />
              )}
              <div style={styles.tripInfo}>
                <h3 style={styles.tripTitle}>{trip.title}</h3>
                <p style={styles.tripDates}>
                  {formatDate(trip.startDate)}
                  {trip.openEnded ? ' · Open-ended' : trip.endDate ? ` → ${formatDate(trip.endDate)}` : ''}
                </p>
                <p style={styles.tripMembers}>{trip.members.length} {trip.members.length === 1 ? 'member' : 'members'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f9f6f1' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 24px', backgroundColor: '#fff', borderBottom: '1px solid #eee',
  },
  logo: { fontSize: '1.3rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', margin: 0 },
  logoBig: { height: '44px', objectFit: 'contain' },
  userRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%' },
  signOutBtn: { fontSize: '0.85rem', color: '#888', background: 'none', border: 'none', cursor: 'pointer' },
  body: { maxWidth: '600px', margin: '0 auto', padding: '28px 24px' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  heading: { fontSize: '1.3rem', fontWeight: '700', color: '#1a1a1a' },
  createBtn: {
    backgroundColor: '#1a1a1a', color: '#fff', border: 'none',
    borderRadius: '8px', padding: '10px 18px', fontSize: '0.9rem',
    fontWeight: '500', cursor: 'pointer',
  },
  empty: { textAlign: 'center', padding: '48px 0' },
  emptyTagline: { fontSize: '0.78rem', color: '#b09070', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '24px', fontStyle: 'italic' },
  emptyText: { fontSize: '1rem', color: '#555', marginBottom: '8px' },
  hint: { fontSize: '0.9rem', color: '#aaa' },
  tripGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  tripCard: {
    backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden',
    border: '1px solid #eee', cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  tripCover: { width: '100%', height: '160px', objectFit: 'cover' },
  tripCoverPlaceholder: { width: '100%', height: '100px', backgroundColor: '#e8e4df' },
  tripInfo: { padding: '16px' },
  tripTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' },
  tripDates: { fontSize: '0.85rem', color: '#888', marginBottom: '4px' },
  tripMembers: { fontSize: '0.8rem', color: '#aaa' },
}
