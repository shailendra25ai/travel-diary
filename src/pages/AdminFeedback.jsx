import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import BottomNav from '../components/BottomNav'

// Owner email — only this user can view feedback
const OWNER_EMAIL = 'shailendra.25ai@gmail.com'

export default function AdminFeedback({ user }) {
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)

  const isOwner = user?.email === OWNER_EMAIL

  useEffect(() => {
    if (!isOwner) return
    const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setFeedback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [isOwner])

  if (!isOwner) {
    return (
      <div style={s.center}>
        <p style={s.notAllowed}>This page is only accessible to the Mosaic admin.</p>
        <button onClick={() => navigate('/home')} style={s.linkBtn}>← Back home</button>
      </div>
    )
  }

  const totalFeedback = feedback.length
  const avgRating = feedback.filter(f => f.rating).length > 0
    ? (feedback.filter(f => f.rating).reduce((sum, f) => sum + f.rating, 0) / feedback.filter(f => f.rating).length).toFixed(1)
    : '–'

  const formatTime = (ts) => {
    if (!ts?.toDate) return ''
    const d = ts.toDate()
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button onClick={() => navigate('/home')} style={s.back}>← Back</button>
        <h1 style={s.title}>Feedback Inbox</h1>
        <div style={{ width: 60 }} />
      </div>

      <div style={s.body}>
        <div style={s.statsRow}>
          <Stat number={totalFeedback} label="Submissions" />
          <Stat number={avgRating} label="Avg rating" />
        </div>

        {loading && <p style={s.hint}>Loading feedback...</p>}

        {!loading && feedback.length === 0 && (
          <div style={s.empty}>
            <p style={s.emptyTitle}>No feedback yet</p>
            <p style={s.emptyHint}>Once your pilot users submit feedback, it'll show up here.</p>
          </div>
        )}

        <div style={s.feedbackList}>
          {feedback.map(f => (
            <div key={f.id} style={s.card}>
              <div style={s.cardHeader}>
                <img src={f.userPhoto} alt="" style={s.avatar} />
                <div style={{ flex: 1 }}>
                  <p style={s.userName}>{f.userName}</p>
                  <p style={s.userEmail}>{f.userEmail}</p>
                </div>
                <p style={s.timestamp}>{formatTime(f.createdAt)}</p>
              </div>

              {f.rating > 0 && (
                <div style={s.ratingRow}>
                  {[1,2,3,4,5].map(n => (
                    <span key={n} style={{ color: n <= f.rating ? '#c89060' : '#ddd', fontSize: '1.1rem' }}>★</span>
                  ))}
                </div>
              )}

              {f.likes && (
                <div style={s.section}>
                  <p style={{ ...s.sectionLabel, color: '#7a8a5a' }}>💚 Likes</p>
                  <p style={s.sectionText}>{f.likes}</p>
                </div>
              )}
              {f.dislikes && (
                <div style={s.section}>
                  <p style={{ ...s.sectionLabel, color: '#c89060' }}>💭 Dislikes</p>
                  <p style={s.sectionText}>{f.dislikes}</p>
                </div>
              )}
              {f.bugs && (
                <div style={s.section}>
                  <p style={{ ...s.sectionLabel, color: '#a83a4a' }}>🐞 Bugs</p>
                  <p style={s.sectionText}>{f.bugs}</p>
                </div>
              )}

              <div style={s.metaRow}>
                <span style={s.metaTag}>Page: {f.currentPage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: '80px' }} />
      <BottomNav user={user} />
    </div>
  )
}

function Stat({ number, label }) {
  return (
    <div style={s.stat}>
      <p style={s.statNumber}>{number}</p>
      <p style={s.statLabel}>{label}</p>
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', backgroundColor: '#f9f6f1' },
  center: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px', padding: '24px', textAlign: 'center' },
  notAllowed: { color: '#888', fontSize: '1rem' },
  linkBtn: { background: 'none', border: 'none', color: '#1a1a1a', fontWeight: '600', textDecoration: 'underline', cursor: 'pointer' },

  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 20px', backgroundColor: '#fff', borderBottom: '1px solid #eee',
  },
  back: { background: 'none', border: 'none', fontSize: '0.9rem', color: '#666', cursor: 'pointer', fontWeight: '500' },
  title: { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', margin: 0 },

  body: { maxWidth: '720px', margin: '0 auto', padding: '24px 16px 64px' },

  statsRow: { display: 'flex', gap: '12px', marginBottom: '24px' },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #ebe5dc' },
  statNumber: { fontSize: '1.8rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', lineHeight: 1 },
  statLabel: { fontSize: '0.75rem', color: '#999', marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },

  empty: { textAlign: 'center', padding: '64px 16px' },
  emptyTitle: { fontSize: '1.1rem', color: '#666', fontWeight: '600', marginBottom: '8px' },
  emptyHint: { fontSize: '0.9rem', color: '#aaa' },
  hint: { fontSize: '0.9rem', color: '#aaa', textAlign: 'center', padding: '24px' },

  feedbackList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  card: { backgroundColor: '#fff', borderRadius: '14px', padding: '18px', border: '1px solid #ebe5dc' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%' },
  userName: { fontSize: '0.95rem', fontWeight: '700', color: '#1a1a1a', margin: 0 },
  userEmail: { fontSize: '0.78rem', color: '#888', margin: '2px 0 0' },
  timestamp: { fontSize: '0.75rem', color: '#aaa' },

  ratingRow: { marginBottom: '12px' },

  section: { marginBottom: '10px' },
  sectionLabel: { fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' },
  sectionText: { fontSize: '0.92rem', color: '#333', lineHeight: '1.6', whiteSpace: 'pre-wrap' },

  metaRow: { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0ebe2' },
  metaTag: { fontSize: '0.72rem', color: '#aaa', backgroundColor: '#f4ede0', padding: '3px 8px', borderRadius: '12px' },
}
