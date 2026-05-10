import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export default function FeedbackWidget({ user }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [likes, setLikes] = useState('')
  const [dislikes, setDislikes] = useState('')
  const [bugs, setBugs] = useState('')
  const [rating, setRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Don't show widget on the share page (public, non-logged-in might be viewing)
  if (location.pathname.startsWith('/share/')) return null
  if (location.pathname.startsWith('/join/')) return null
  if (location.pathname === '/') return null
  if (!user) return null

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => {
      setLikes(''); setDislikes(''); setBugs(''); setRating(0); setSubmitted(false); setError('')
    }, 300)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!likes.trim() && !dislikes.trim() && !bugs.trim() && rating === 0) {
      setError('Please share at least one thing — likes, dislikes, bugs, or a rating.')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user.uid,
        userName: user.displayName,
        userEmail: user.email,
        userPhoto: user.photoURL,
        currentPage: location.pathname,
        likes: likes.trim(),
        dislikes: dislikes.trim(),
        bugs: bugs.trim(),
        rating,
        userAgent: navigator.userAgent,
        createdAt: serverTimestamp(),
      })
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setError('Could not submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button onClick={() => setOpen(true)} style={s.fab} title="Give feedback">
          💬 &nbsp;Feedback
        </button>
      )}

      {/* Backdrop + Panel */}
      {open && (
        <>
          <div style={s.backdrop} onClick={handleClose} />
          <div style={s.panel}>
            <div style={s.header}>
              <h3 style={s.title}>Share your feedback</h3>
              <button onClick={handleClose} style={s.closeBtn}>✕</button>
            </div>

            {submitted ? (
              <div style={s.successBox}>
                <div style={s.successIcon}>✓</div>
                <h4 style={s.successTitle}>Thank you!</h4>
                <p style={s.successText}>Your feedback helps make Mosaic better.</p>
                <button onClick={handleClose} style={s.doneBtn}>Done</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={s.form}>

                <p style={s.intro}>You're testing the pilot — your honest thoughts shape what comes next.</p>

                <div style={s.field}>
                  <label style={s.label}>Overall rating</label>
                  <div style={s.starsRow}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        style={{ ...s.star, color: n <= rating ? '#c89060' : '#ddd' }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div style={s.field}>
                  <label style={s.label}>💚 What did you like?</label>
                  <textarea
                    value={likes}
                    onChange={e => setLikes(e.target.value)}
                    placeholder="Things that worked well, felt great..."
                    rows={3}
                    style={s.textarea}
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>💭 What didn't work?</label>
                  <textarea
                    value={dislikes}
                    onChange={e => setDislikes(e.target.value)}
                    placeholder="Things that felt confusing or could be better..."
                    rows={3}
                    style={s.textarea}
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>🐞 Any bugs or issues?</label>
                  <textarea
                    value={bugs}
                    onChange={e => setBugs(e.target.value)}
                    placeholder="Errors, broken behaviour, anything off..."
                    rows={3}
                    style={s.textarea}
                  />
                </div>

                {error && <p style={s.error}>{error}</p>}

                <button type="submit" style={s.submitBtn} disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send feedback'}
                </button>

                <p style={s.contextHint}>
                  Sent from page: <span style={{ color: '#7a8a5a' }}>{location.pathname}</span>
                </p>
              </form>
            )}
          </div>
        </>
      )}
    </>
  )
}

const s = {
  fab: {
    position: 'fixed', right: '20px', bottom: '90px', zIndex: 40,
    background: 'linear-gradient(135deg, #c89060 0%, #b09070 100%)',
    color: '#fff', border: 'none', borderRadius: '24px',
    padding: '12px 18px', fontSize: '0.88rem', fontWeight: '700',
    cursor: 'pointer', boxShadow: '0 6px 20px rgba(200,144,96,0.4)',
    display: 'flex', alignItems: 'center',
  },
  backdrop: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 100, animation: 'fadeIn 0.2s',
  },
  panel: {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: '100%', maxWidth: '420px', backgroundColor: '#fff',
    zIndex: 101, overflowY: 'auto', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
    animation: 'slideInRight 0.3s ease-out',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px', borderBottom: '1px solid #ebe5dc',
    position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1,
  },
  title: { fontSize: '1.3rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', margin: 0 },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '1.3rem',
    color: '#888', cursor: 'pointer', padding: '4px 8px',
  },
  intro: {
    fontSize: '0.9rem', color: '#7a8a5a', fontStyle: 'italic',
    marginBottom: '24px', lineHeight: '1.5',
  },
  form: { padding: '24px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
  label: { fontSize: '0.88rem', fontWeight: '700', color: '#1a1a1a' },
  textarea: {
    padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #ddd',
    fontSize: '0.95rem', color: '#1a1a1a', backgroundColor: '#fff',
    resize: 'vertical', fontFamily: 'inherit', outline: 'none', lineHeight: '1.5',
  },
  starsRow: { display: 'flex', gap: '4px' },
  star: {
    background: 'none', border: 'none', fontSize: '2rem',
    cursor: 'pointer', padding: '0 4px', transition: 'transform 0.1s',
  },
  error: { color: '#e53e3e', fontSize: '0.88rem', marginBottom: '12px' },
  submitBtn: {
    width: '100%', background: 'linear-gradient(135deg, #c89060 0%, #b09070 100%)',
    color: '#fff', border: 'none', borderRadius: '12px',
    padding: '14px', fontSize: '1rem', fontWeight: '700',
    cursor: 'pointer', boxShadow: '0 4px 14px rgba(200,144,96,0.3)',
  },
  contextHint: {
    fontSize: '0.75rem', color: '#aaa', textAlign: 'center', marginTop: '14px',
  },

  successBox: { padding: '48px 24px', textAlign: 'center' },
  successIcon: {
    width: '64px', height: '64px', borderRadius: '50%',
    backgroundColor: '#7a8a5a', color: '#fff',
    fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
  },
  successTitle: { fontSize: '1.4rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', marginBottom: '8px' },
  successText: { fontSize: '0.95rem', color: '#666', marginBottom: '28px', lineHeight: '1.6' },
  doneBtn: {
    background: 'none', border: '1.5px solid #1a1a1a',
    color: '#1a1a1a', borderRadius: '10px', padding: '10px 24px',
    fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer',
  },
}
