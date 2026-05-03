import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { signInWithPopup } from 'firebase/auth'
import { db, auth, provider } from '../firebase'

export default function JoinTrip({ user }) {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTrip = async () => {
      const q = query(collection(db, 'trips'), where('inviteCode', '==', inviteCode))
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        setTrip({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() })
      }
      setLoading(false)
    }
    fetchTrip()
  }, [inviteCode])

  const handleJoin = async (currentUser) => {
    if (!trip) return
    setJoining(true)
    try {
      const tripRef = doc(db, 'trips', trip.id)
      await updateDoc(tripRef, {
        members: arrayUnion(currentUser.uid),
        [`memberDetails.${currentUser.uid}`]: {
          name: currentUser.displayName,
          photo: currentUser.photoURL,
        }
      })
      navigate(`/trips/${trip.id}`)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setJoining(false)
    }
  }

  const handleSignInAndJoin = async () => {
    try {
      const result = await signInWithPopup(auth, provider)
      await handleJoin(result.user)
    } catch (err) {
      console.error(err)
      setError('Sign in failed. Please try again.')
    }
  }

  useEffect(() => {
    if (user && trip) {
      if (trip.members.includes(user.uid)) {
        navigate(`/trips/${trip.id}`)
      }
    }
  }, [user, trip])

  if (loading) return <div style={styles.center}><p>Loading...</p></div>
  if (!trip) return <div style={styles.center}><p>This invite link is invalid or has expired.</p></div>

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>Travel Diary</h1>
        {trip.coverPhotoURL && (
          <img src={trip.coverPhotoURL} alt="Trip cover" style={styles.cover} />
        )}
        <h2 style={styles.tripTitle}>{trip.title}</h2>
        <p style={styles.invitedBy}>
          {trip.createdByName.split(' ')[0]} invited you to join this trip
        </p>
        <div style={styles.memberRow}>
          {Object.values(trip.memberDetails || {}).map((m, i) => (
            <img key={i} src={m.photo} alt={m.name} title={m.name} style={styles.memberAvatar} />
          ))}
        </div>
        <p style={styles.memberCount}>{trip.members.length} {trip.members.length === 1 ? 'person' : 'people'} on this trip</p>

        {error && <p style={styles.error}>{error}</p>}

        {user ? (
          <button onClick={() => handleJoin(user)} style={styles.joinBtn} disabled={joining}>
            {joining ? 'Joining...' : 'Join this trip'}
          </button>
        ) : (
          <button onClick={handleSignInAndJoin} style={styles.joinBtn}>
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              style={{ width: 20, height: 20, marginRight: 10 }}
            />
            Sign in with Google to join
          </button>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh', backgroundColor: '#f9f6f1',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
  },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
  card: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '36px 28px',
    maxWidth: '400px', width: '100%', textAlign: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  logo: { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', marginBottom: '20px' },
  cover: { width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px', marginBottom: '16px' },
  tripTitle: { fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '6px' },
  invitedBy: { fontSize: '0.95rem', color: '#666', marginBottom: '20px' },
  memberRow: { display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' },
  memberAvatar: { width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px #eee' },
  memberCount: { fontSize: '0.85rem', color: '#999', marginBottom: '24px' },
  joinBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: '14px', backgroundColor: '#1a1a1a',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '1rem', fontWeight: '500', cursor: 'pointer',
  },
  error: { color: '#e53e3e', fontSize: '0.9rem', marginBottom: '12px' },
}
