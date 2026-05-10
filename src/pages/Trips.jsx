import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc, getDocs } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { TripsMap } from '../components/MapComponents'
import BottomNav from '../components/BottomNav'

export default function Trips({ user }) {
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')

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

  const handleSignOut = async () => { await signOut(auth) }

  const handleDeleteTrip = async (e, trip) => {
    e.stopPropagation()
    if (trip.createdBy !== user.uid) {
      alert('Only the trip creator can delete this trip.')
      return
    }
    const confirmed = window.confirm(`Delete "${trip.title}"? This will remove all entries and recaps for this trip. This cannot be undone.`)
    if (!confirmed) return

    try {
      const entriesSnap = await getDocs(collection(db, 'trips', trip.id, 'entries'))
      await Promise.all(entriesSnap.docs.map(d => deleteDoc(d.ref)))
      await deleteDoc(doc(db, 'trips', trip.id))
    } catch (err) {
      console.error(err)
      alert('Could not delete the trip. Please try again.')
    }
  }

  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <img src="/logo-wide.png" alt="Mosaic" style={styles.logoBig} onClick={() => navigate('/home')} />
        <div style={styles.userRow}>
          <img src={user.photoURL} alt={user.displayName} style={styles.avatar} />
          <button onClick={handleSignOut} style={styles.signOutBtn}>Sign out</button>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.headerBlock}>
          <p style={styles.eyebrow}>✈ &nbsp;My Journeys</p>
          <div style={styles.topRow}>
            <h2 style={styles.heading}>Your trips</h2>
            <button onClick={() => navigate('/trips/create')} style={styles.createBtn}>+ New Trip</button>
          </div>
          <p style={styles.subheading}>Every journey, beautifully kept.</p>
        </div>

        {!loading && trips.length > 0 && (
          <div style={styles.viewToggle}>
            <button onClick={() => setView('list')} style={view === 'list' ? styles.toggleActive : styles.toggleInactive}>☰ List</button>
            <button onClick={() => setView('map')} style={view === 'map' ? styles.toggleActive : styles.toggleInactive}>🌍 Map</button>
          </div>
        )}

        {loading && <p style={styles.hint}>Loading your trips...</p>}

        {!loading && trips.length === 0 && (
          <div style={styles.empty}>
            <p style={styles.emptyTagline}>Many pieces. One unforgettable trip.</p>
            <p style={styles.emptyText}>No trips yet.</p>
            <p style={styles.hint}>Create your first trip and invite your travel group.</p>
          </div>
        )}

        {view === 'map' && trips.length > 0 && (
          <TripsMap trips={trips} onPinClick={(id) => navigate(`/trips/${id}`)} />
        )}

        {view === 'list' && (
          <div style={styles.tripGrid}>
            {trips.map(trip => (
              <div key={trip.id} style={styles.tripCard} onClick={() => navigate(`/trips/${trip.id}`)}>
                {trip.coverPhotoURL ? (
                  <div style={styles.tripCoverWrap}>
                    <div style={{ ...styles.tripCoverBlur, backgroundImage: `url(${trip.coverPhotoURL})` }} />
                    <img src={trip.coverPhotoURL} alt={trip.title} style={styles.tripCoverImg} />
                  </div>
                ) : (
                  <div style={styles.tripCoverPlaceholder} />
                )}
                <div style={styles.tripInfo}>
                  <div style={styles.tripTopRow}>
                    <h3 style={styles.tripTitle}>{trip.title}</h3>
                    {trip.createdBy === user.uid && (
                      <button onClick={(e) => handleDeleteTrip(e, trip)} style={styles.deleteBtn} title="Delete trip">🗑</button>
                    )}
                  </div>
                  {trip.location?.name && <p style={styles.tripLocation}>📍 {trip.location.name}</p>}
                  <p style={styles.tripDates}>
                    {formatDate(trip.startDate)}
                    {trip.openEnded ? ' · Open-ended' : trip.endDate ? ` → ${formatDate(trip.endDate)}` : ''}
                  </p>
                  <p style={styles.tripMembers}>{trip.members.length} {trip.members.length === 1 ? 'member' : 'members'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: '80px' }} />
      <BottomNav />
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f9f6f1' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 24px', backgroundColor: '#fff', borderBottom: '1px solid #eee',
  },
  logoBig: { height: '44px', objectFit: 'contain', cursor: 'pointer' },
  userRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%' },
  signOutBtn: { fontSize: '0.85rem', color: '#888', background: 'none', border: 'none', cursor: 'pointer' },
  body: { maxWidth: '720px', margin: '0 auto', padding: '28px 20px' },
  headerBlock: { marginBottom: '24px' },
  eyebrow: {
    display: 'inline-block', fontSize: '0.72rem', fontWeight: '700',
    color: '#c89060', textTransform: 'uppercase', letterSpacing: '0.15em',
    backgroundColor: '#fbeede', padding: '5px 12px', borderRadius: '20px',
    marginBottom: '12px',
  },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  heading: { fontSize: '1.85rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', lineHeight: '1.2' },
  subheading: { fontSize: '0.95rem', color: '#7a8a5a', fontStyle: 'italic', fontWeight: '500' },
  createBtn: {
    background: 'linear-gradient(135deg, #c89060 0%, #b09070 100%)',
    color: '#fff', border: 'none',
    borderRadius: '20px', padding: '10px 18px', fontSize: '0.88rem',
    fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: '0 3px 10px rgba(200,144,96,0.3)',
  },
  viewToggle: {
    display: 'flex', gap: '4px', backgroundColor: '#ede9e3',
    borderRadius: '10px', padding: '4px', marginBottom: '20px',
  },
  toggleActive: {
    flex: 1, padding: '8px', border: 'none', borderRadius: '8px',
    backgroundColor: '#fff', fontWeight: '700', fontSize: '0.9rem',
    color: '#c89060', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  toggleInactive: {
    flex: 1, padding: '8px', border: 'none', borderRadius: '8px',
    backgroundColor: 'transparent', fontWeight: '500', fontSize: '0.9rem',
    color: '#888', cursor: 'pointer',
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
  tripCoverWrap: { position: 'relative', width: '100%', height: '200px', overflow: 'hidden', backgroundColor: '#1a1a1a' },
  tripCoverBlur: {
    position: 'absolute', inset: '-10px',
    backgroundSize: 'cover', backgroundPosition: 'center',
    filter: 'blur(28px) brightness(0.75) saturate(1.1)',
    transform: 'scale(1.1)',
  },
  tripCoverImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' },
  tripCoverPlaceholder: { width: '100%', height: '100px', backgroundColor: '#e8e4df' },
  tripInfo: { padding: '16px' },
  tripTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px', gap: '8px' },
  tripTitle: { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a1a', flex: 1, fontFamily: 'Georgia, serif' },
  deleteBtn: {
    background: 'none', border: 'none', fontSize: '1rem',
    cursor: 'pointer', padding: '4px 8px', borderRadius: '6px',
    color: '#888', opacity: 0.6,
  },
  tripLocation: { fontSize: '0.85rem', color: '#b09070', fontWeight: '600', marginBottom: '4px' },
  tripDates: { fontSize: '0.85rem', color: '#888', marginBottom: '4px' },
  tripMembers: { fontSize: '0.8rem', color: '#aaa' },
}
