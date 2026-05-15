import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

function generateShareCode() {
  return Math.random().toString(36).substring(2, 10)
}

const TEMPLATES = [
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'Editorial layout. Big photos, polished captions, clean typography.',
    icon: '📰',
    accent: '#5a4830',
  },
  {
    id: 'storybook',
    name: 'Storybook',
    description: 'Photos and stories side-by-side, alternating like a storybook.',
    icon: '📖',
    accent: '#7a5a3a',
  },
  {
    id: 'polaroid',
    name: 'Polaroid Scrapbook',
    description: 'Casual and warm — photos as polaroids with handwritten-style notes.',
    icon: '📸',
    accent: '#c89060',
  },
  {
    id: 'splitpov',
    name: 'Split POV ⭐',
    description: 'Same day, two views. Side-by-side comparison — perfect for multi-perspective trips.',
    icon: '👥',
    accent: '#2d4a8a',
  },
  {
    id: 'stories',
    name: 'Stories',
    description: 'Vertical Instagram Story-style cards. Made to screenshot and share to social.',
    icon: '📱',
    accent: '#a83a6a',
  },
]

export default function GenerateRecap({ user }) {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [entries, setEntries] = useState([])
  const [mode, setMode] = useState('single')
  const [template, setTemplate] = useState('magazine')
  const [step, setStep] = useState('choose')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const tripDoc = await getDoc(doc(db, 'trips', tripId))
      if (tripDoc.exists()) setTrip({ id: tripDoc.id, ...tripDoc.data() })

      const q = query(collection(db, 'trips', tripId, 'entries'), orderBy('date', 'asc'))
      const snapshot = await getDocs(q)
      setEntries(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    fetchData()
  }, [tripId])

  const handleGenerate = async () => {
    if (entries.length === 0) {
      setError('You need at least 1 diary entry before generating a recap. Add some entries first — the more entries, the richer your story.')
      return
    }
    setStep('generating')
    setError('')

    try {
      const response = await fetch('/api/generate-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip, entries, mode }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to generate recap')

      const code = generateShareCode()

      await addDoc(collection(db, 'recaps'), {
        tripId,
        tripTitle: trip.title,
        mode,
        template,
        recap: data.recap,
        entries,
        shareCode: code,
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: serverTimestamp(),
      })

      navigate(`/share/${code}`)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong. Please try again.')
      setStep('choose')
    }
  }

  if (!trip) return <div style={styles.center}><p>Loading...</p></div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(`/trips/${tripId}`)} style={styles.back}>← Back</button>
        <img src="/logo-wide.png" alt="Mosaic" style={styles.logoBig} onClick={() => navigate('/home')} />
        <div style={{ width: 60 }} />
      </div>

      <div style={styles.body}>

        {step === 'choose' && (
          <>
            <p style={styles.eyebrow}>✨ AI Recap</p>
            <h2 style={styles.heading}>Let's craft your story</h2>
            <p style={styles.subheading}>{trip.title}</p>

            <p style={styles.sectionLabel}>① &nbsp;Whose story?</p>
            <p style={styles.sectionHint}>Pick whose perspective the recap should be told from.</p>
            <div style={styles.modeRow}>
              <div
                style={{
                  ...styles.modeCard,
                  ...(mode === 'single'
                    ? { ...styles.cardActive, borderColor: '#c89060', boxShadow: '0 4px 14px rgba(200,144,96,0.18)' }
                    : {}),
                }}
                onClick={() => setMode('single')}
              >
                <div style={{ ...styles.modeIcon, backgroundColor: '#fbeede', color: '#c89060' }}>🚶</div>
                <p style={styles.modeTitle}>Just me</p>
                <p style={styles.modeDesc}>Your trip from your point of view.</p>
              </div>
              <div
                style={{
                  ...styles.modeCard,
                  ...(mode === 'multi'
                    ? { ...styles.cardActive, borderColor: '#2d4a8a', boxShadow: '0 4px 14px rgba(45,74,138,0.18)' }
                    : {}),
                }}
                onClick={() => setMode('multi')}
              >
                <div style={{ ...styles.modeIcon, backgroundColor: '#e3eaf5', color: '#2d4a8a' }}>👥</div>
                <p style={styles.modeTitle}>Everyone</p>
                <p style={styles.modeDesc}>Multi-perspective — woven from every member's eyes.</p>
              </div>
            </div>

            <p style={styles.sectionLabel}>② &nbsp;Pick a style</p>
            <p style={styles.sectionHint}>This is the look your shareable web page and PDF will use.</p>
            <div style={styles.templateList}>
              {TEMPLATES.map(t => (
                <div
                  key={t.id}
                  style={{
                    ...styles.templateCard,
                    ...(template === t.id
                      ? { ...styles.cardActive, borderColor: t.accent, boxShadow: `0 4px 14px ${t.accent}30` }
                      : {}),
                  }}
                  onClick={() => setTemplate(t.id)}
                >
                  <div style={{ ...styles.templateIconBox, backgroundColor: `${t.accent}18`, color: t.accent }}>
                    <span style={styles.templateIcon}>{t.icon}</span>
                  </div>
                  <div style={styles.templateInfo}>
                    <p style={{ ...styles.templateName, color: template === t.id ? t.accent : '#1a1a1a' }}>{t.name}</p>
                    <p style={styles.templateDesc}>{t.description}</p>
                  </div>
                  {template === t.id && (
                    <div style={{ ...styles.checkDot, backgroundColor: t.accent }}>✓</div>
                  )}
                </div>
              ))}
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button onClick={handleGenerate} style={styles.generateBtn}>
              ✨ &nbsp; Generate recap with AI
            </button>
          </>
        )}

        {step === 'generating' && (
          <div style={styles.loadingBox}>
            <div style={styles.spinner} />
            <p style={styles.loadingTitle}>Crafting your recap...</p>
            <p style={styles.loadingHint}>Claude is reading your entries and writing something beautiful. About 10–20 seconds.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function TemplatePreview({ templateId, accent }) {
  if (templateId === 'magazine') {
    return (
      <div style={styles.previewBox}>
        <div style={{ ...styles.previewBlock, height: 32, backgroundColor: '#ddd' }} />
        <div style={{ ...styles.previewBlock, height: 4, width: '70%' }} />
        <div style={{ ...styles.previewBlock, height: 4, width: '90%' }} />
        <div style={{ ...styles.previewBlock, height: 4, width: '50%' }} />
      </div>
    )
  }
  if (templateId === 'storybook') {
    return (
      <div style={styles.previewBox}>
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ ...styles.previewBlock, height: 26, width: '50%', backgroundColor: '#ddd', margin: 0 }} />
          <div style={{ width: '50%' }}>
            <div style={{ ...styles.previewBlock, height: 4, margin: '2px 0' }} />
            <div style={{ ...styles.previewBlock, height: 4, margin: '2px 0' }} />
            <div style={{ ...styles.previewBlock, height: 4, width: '70%', margin: '2px 0' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <div style={{ width: '50%' }}>
            <div style={{ ...styles.previewBlock, height: 4, margin: '2px 0' }} />
            <div style={{ ...styles.previewBlock, height: 4, margin: '2px 0' }} />
            <div style={{ ...styles.previewBlock, height: 4, width: '70%', margin: '2px 0' }} />
          </div>
          <div style={{ ...styles.previewBlock, height: 26, width: '50%', backgroundColor: '#ddd', margin: 0 }} />
        </div>
      </div>
    )
  }
  if (templateId === 'polaroid') {
    return (
      <div style={{ ...styles.previewBox, position: 'relative', height: 64 }}>
        <div style={{ position: 'absolute', left: 4, top: 4, width: 28, height: 32, backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transform: 'rotate(-6deg)', padding: 2 }}>
          <div style={{ width: '100%', height: '70%', backgroundColor: '#ddd' }} />
        </div>
        <div style={{ position: 'absolute', left: 30, top: 10, width: 28, height: 32, backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transform: 'rotate(4deg)', padding: 2 }}>
          <div style={{ width: '100%', height: '70%', backgroundColor: '#ccc' }} />
        </div>
      </div>
    )
  }

  if (templateId === 'splitpov') {
    return (
      <div style={styles.previewBox}>
        <div style={{ display: 'flex', gap: 2, height: '100%' }}>
          <div style={{ flex: 1, backgroundColor: '#bbb', display: 'flex', flexDirection: 'column', gap: 2, padding: 2 }}>
            <div style={{ height: '60%', backgroundColor: '#999' }} />
            <div style={{ height: 3, backgroundColor: '#fff' }} />
            <div style={{ height: 3, backgroundColor: '#fff', width: '70%' }} />
          </div>
          <div style={{ flex: 1, backgroundColor: '#777', display: 'flex', flexDirection: 'column', gap: 2, padding: 2 }}>
            <div style={{ height: '60%', backgroundColor: '#555' }} />
            <div style={{ height: 3, backgroundColor: '#fff' }} />
            <div style={{ height: 3, backgroundColor: '#fff', width: '70%' }} />
          </div>
        </div>
      </div>
    )
  }

  // stories
  return (
    <div style={{ ...styles.previewBox, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: 32, height: 56, backgroundColor: '#444', borderRadius: 6, padding: 3, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ height: 3, backgroundColor: '#fff', borderRadius: 1, marginBottom: 2 }} />
        <div style={{ height: 3, backgroundColor: '#fff', borderRadius: 1, width: '70%' }} />
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
  logoBig: { height: '44px', objectFit: 'contain', cursor: 'pointer' },
  back: { background: 'none', border: 'none', fontSize: '0.95rem', color: '#555', cursor: 'pointer' },
  body: { maxWidth: '520px', margin: '0 auto', padding: '32px 24px 64px' },
  eyebrow: {
    display: 'inline-block', fontSize: '0.72rem', fontWeight: '700',
    color: '#c89060', textTransform: 'uppercase', letterSpacing: '0.15em',
    backgroundColor: '#fbeede', padding: '5px 12px', borderRadius: '20px', marginBottom: '14px',
  },
  heading: {
    fontSize: '1.85rem', fontWeight: '700', color: '#1a1a1a',
    marginBottom: '6px', fontFamily: 'Georgia, serif', lineHeight: '1.2',
  },
  subheading: { fontSize: '0.95rem', color: '#7a8a5a', fontWeight: '600', marginBottom: '32px', fontStyle: 'italic' },
  sectionLabel: {
    fontSize: '0.85rem', fontWeight: '700', color: '#b09070',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    marginBottom: '6px', marginTop: '28px',
  },
  sectionHint: { fontSize: '0.82rem', color: '#7a8a5a', fontStyle: 'italic', marginBottom: '14px' },

  modeRow: { display: 'flex', gap: '12px', marginBottom: '8px' },
  modeCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: '14px', padding: '18px 14px',
    border: '2px solid #ebe5dc', cursor: 'pointer', textAlign: 'center',
    transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
  },
  modeIcon: {
    width: '52px', height: '52px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.6rem', margin: '0 auto 12px',
  },
  modeTitle: { fontWeight: '700', color: '#1a1a1a', marginBottom: '4px', fontFamily: 'Georgia, serif', fontSize: '1.05rem' },
  modeDesc: { fontSize: '0.82rem', color: '#777', lineHeight: '1.5' },

  templateList: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' },
  templateCard: {
    display: 'flex', gap: '14px', alignItems: 'center', position: 'relative',
    backgroundColor: '#fff', borderRadius: '14px', padding: '16px',
    border: '2px solid #ebe5dc', cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
  },
  templateIconBox: {
    width: '52px', height: '52px', borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  templateIcon: { fontSize: '1.6rem' },
  templateInfo: { flex: 1 },
  templateName: { fontWeight: '700', marginBottom: '2px', fontFamily: 'Georgia, serif', fontSize: '1.05rem' },
  templateDesc: { fontSize: '0.85rem', color: '#777', lineHeight: '1.5' },
  checkDot: {
    width: '24px', height: '24px', borderRadius: '50%',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.85rem', fontWeight: '700', flexShrink: 0,
  },

  previewBox: { width: '90px', height: '64px', backgroundColor: '#faf7f2', borderRadius: '6px', padding: '6px', flexShrink: 0, border: '1px solid #ebe5dc' },
  previewBlock: { backgroundColor: '#ccc', borderRadius: '2px', margin: '3px 0' },

  cardActive: { backgroundColor: '#fdfaf5' },

  generateBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #c89060 0%, #b09070 50%, #2d4a8a 100%)',
    color: '#fff', border: 'none', borderRadius: '14px', padding: '18px',
    fontSize: '1.05rem', fontWeight: '700', cursor: 'pointer', marginTop: '12px',
    boxShadow: '0 6px 20px rgba(200,144,96,0.3)', letterSpacing: '0.02em',
  },
  error: { color: '#e53e3e', fontSize: '0.9rem', marginBottom: '12px' },

  loadingBox: { textAlign: 'center', padding: '60px 0' },
  spinner: {
    width: 36, height: 36, border: '3px solid #eee', borderTop: '3px solid #1a1a1a',
    borderRadius: '50%', margin: '0 auto 24px', animation: 'spin 0.8s linear infinite',
  },
  loadingTitle: { fontSize: '1.1rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' },
  loadingHint: { fontSize: '0.9rem', color: '#888', lineHeight: '1.6' },
}
