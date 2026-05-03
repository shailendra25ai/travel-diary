import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function Trip({ user }) {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrip = async () => {
      const tripDoc = await getDoc(doc(db, 'trips', tripId))
      if (tripDoc.exists()) {
        setTrip({ id: tripDoc.id, ...tripDoc.data() })
      }
      setLoading(false)
    }
    fetchTrip()
  }, [tripId])

  if (loading) return <div style={styles.center}><p>Loading trip...</p></div>
  if (!trip) return <div style={styles.center}><p>Trip not found.</p></div>

  const inviteLink = `${window.location.origin}/join/${trip.inviteCode}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    alert('Invite link copied! Share it with your travel group.')
  }

  const formatDate = (d) => {
    if (!d) return ''
    const date = new Date(d)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/home')} style={styles.back}>← Back</button>
        <h1 style={styles.logo}>Travel Diary</h1>
        <img src={user.photoURL} alt={user.displayName} style={styles.avatar} />
      </div>

      {trip.coverPhotoURL && (
        <img src={trip.coverPhotoURL} alt="Cover" style={styles.cover} />
      )}

      <div style={styles.body}>
        <h2 style={styles.tripTitle}>{trip.title}</h2>
        <p style={styles.dates}>
          {formatDate(trip.startDate)}
          {trip.openEnded ? ' · Open-ended' : trip.endDate ? ` → ${formatDate(trip.endDate)}` : ''}
        </p>

        <div style={styles.members}>
          <p style={styles.sectionLabel}>Members ({trip.members.length})</p>
          <div style={styles.memberRow}>
            {Object.values(trip.memberDetails || {}).map((m, i) => (
              <div key={i} style={styles.member}>
                <img src={m.photo} alt={m.name} style={styles.memberAvatar} />
                <span style={styles.memberName}>{m.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.inviteBox}>
          <p style={styles.sectionLabel}>Invite your travel group</p>
          <p style={styles.inviteHint}>Share this link — anyone with it can join your trip.</p>
          <div style={styles.linkRow}>
            <span style={styles.linkText}>{inviteLink}</span>
            <button onClick={handleCopyLink} style={styles.copyBtn}>Copy</button>
          </div>
        </div>

        <div style={styles.entriesPlaceholder}>
          <p style={styles.sectionLabel}>Diary entries</p>
          <p style={styles.hint}>Daily entries will appear here. Coming up next!</p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f9f6f1' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 24px', backgroundColor: '#fff', borderBottom: '1px solid #eee',
  },
  logo: { fontSize: '1.3rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', margin: 0 },
  back: { background: 'none', border: 'none', fontSize: '0.95rem', color: '#555', cursor: 'pointer' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%' },
  cover: { width: '100%', height: '220px', objectFit: 'cover' },
  body: { maxWidth: '600px', margin: '0 auto', padding: '24px' },
  tripTitle: { fontSize: '1.8rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '6px' },
  dates: { fontSize: '0.95rem', color: '#888', marginBottom: '28px' },
  sectionLabel: { fontSize: '0.8rem', fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' },
  members: { marginBottom: '28px' },
  memberRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  member: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  memberAvatar: { width: '44px', height: '44px', borderRadius: '50%' },
  memberName: { fontSize: '0.8rem', color: '#555' },
  inviteBox: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '20px',
    marginBottom: '28px', border: '1px solid #eee',
  },
  inviteHint: { fontSize: '0.9rem', color: '#666', marginBottom: '12px' },
  linkRow: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f4f4f4', borderRadius: '8px', padding: '10px 14px' },
  linkText: { fontSize: '0.8rem', color: '#555', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  copyBtn: {
    backgroundColor: '#1a1a1a', color: '#fff', border: 'none',
    borderRadius: '6px', padding: '6px 14px', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  entriesPlaceholder: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #eee', textAlign: 'center' },
  hint: { fontSize: '0.9rem', color: '#aaa', marginTop: '4px' },
}
