import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { jsPDF } from 'jspdf'

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function generateShareCode() {
  return Math.random().toString(36).substring(2, 10)
}

export default function GenerateRecap({ user }) {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [entries, setEntries] = useState([])
  const [mode, setMode] = useState('single')
  const [step, setStep] = useState('choose')
  const [recap, setRecap] = useState(null)
  const [shareCode, setShareCode] = useState('')
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
      setError('No diary entries found. Add some entries before generating a recap.')
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
      setShareCode(code)

      await addDoc(collection(db, 'recaps'), {
        tripId,
        tripTitle: trip.title,
        mode,
        recap: data.recap,
        entries,
        shareCode: code,
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: serverTimestamp(),
      })

      setRecap(data.recap)
      setStep('done')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong. Please try again.')
      setStep('choose')
    }
  }

  const handleDownloadPDF = () => {
    if (!recap) return
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const margin = 20
    const pageWidth = 210
    const contentWidth = pageWidth - margin * 2
    let y = margin

    const addText = (text, fontSize, fontStyle, color, lineHeightMult = 1.4) => {
      pdf.setFontSize(fontSize)
      pdf.setFont('helvetica', fontStyle)
      pdf.setTextColor(...color)
      const lines = pdf.splitTextToSize(text, contentWidth)
      const lineHeight = fontSize * 0.352778 * lineHeightMult
      if (y + lines.length * lineHeight > 280) {
        pdf.addPage()
        y = margin
      }
      pdf.text(lines, margin, y)
      y += lines.length * lineHeight + 2
    }

    const addSpacer = (mm = 6) => { y += mm }

    addText(recap.title, 22, 'bold', [26, 26, 26])
    addSpacer(2)
    addText(trip.title, 12, 'normal', [150, 150, 150])
    addSpacer(8)

    pdf.setDrawColor(220, 220, 220)
    pdf.line(margin, y, pageWidth - margin, y)
    addSpacer(8)

    addText(recap.summary, 11, 'normal', [60, 60, 60])
    addSpacer(10)

    if (recap.days && recap.days.length > 0) {
      recap.days.forEach(day => {
        addText(formatDate(day.date), 9, 'bold', [180, 150, 120])
        addSpacer(1)
        addText(day.caption, 11, 'normal', [60, 60, 60])
        addSpacer(8)
      })
    }

    pdf.setDrawColor(220, 220, 220)
    pdf.line(margin, y, pageWidth - margin, y)
    addSpacer(8)

    addText(recap.closing, 11, 'italic', [80, 80, 80])
    addSpacer(16)

    addText(`Made with Travel Diary`, 8, 'normal', [200, 200, 200])

    pdf.save(`${trip.title} — Travel Diary Recap.pdf`)
  }

  const shareLink = `${window.location.origin}/share/${shareCode}`

  if (!trip) return <div style={styles.center}><p>Loading...</p></div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(`/trips/${tripId}`)} style={styles.back}>← Back</button>
        <h1 style={styles.logo}>Travel Diary</h1>
        <div style={{ width: 60 }} />
      </div>

      <div style={styles.body}>

        {step === 'choose' && (
          <>
            <h2 style={styles.heading}>Generate trip recap</h2>
            <p style={styles.subheading}>{trip.title}</p>

            <p style={styles.sectionLabel}>Choose a style</p>

            <div style={styles.modeRow}>
              <div
                style={{ ...styles.modeCard, ...(mode === 'single' ? styles.modeCardActive : {}) }}
                onClick={() => setMode('single')}
              >
                <p style={styles.modeTitle}>Single perspective</p>
                <p style={styles.modeDesc}>Your journey, your voice. A personal recap of the trip from your point of view.</p>
              </div>
              <div
                style={{ ...styles.modeCard, ...(mode === 'multi' ? styles.modeCardActive : {}) }}
                onClick={() => setMode('multi')}
              >
                <p style={styles.modeTitle}>Multi-perspective</p>
                <p style={styles.modeDesc}>Everyone's story woven together. See how the same trip looked through different eyes.</p>
              </div>
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button onClick={handleGenerate} style={styles.generateBtn}>
              Generate recap with AI ✨
            </button>
          </>
        )}

        {step === 'generating' && (
          <div style={styles.loadingBox}>
            <p style={styles.loadingTitle}>Claude is writing your recap...</p>
            <p style={styles.loadingHint}>Reading your entries and crafting something beautiful. This takes about 10–20 seconds.</p>
          </div>
        )}

        {step === 'done' && recap && (
          <>
            <h2 style={styles.heading}>Your recap is ready</h2>

            <div style={styles.recapPreview}>
              <h3 style={styles.recapTitle}>{recap.title}</h3>
              <p style={styles.recapText}>{recap.summary}</p>
              {recap.days?.map((day, i) => (
                <div key={i} style={styles.recapDay}>
                  <p style={styles.recapDayDate}>{formatDate(day.date)}</p>
                  <p style={styles.recapDayCaption}>{day.caption}</p>
                </div>
              ))}
              <p style={styles.recapClosing}>{recap.closing}</p>
              <p style={styles.recapBranding}>Made with Travel Diary</p>
            </div>

            <button onClick={handleDownloadPDF} style={styles.downloadBtn}>
              Download PDF
            </button>

            <div style={styles.shareBox}>
              <p style={styles.shareLabel}>Share a public link</p>
              <p style={styles.shareHint}>Anyone with this link can view the recap — no login needed.</p>
              <div style={styles.linkRow}>
                <span style={styles.linkText}>{shareLink}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(shareLink); alert('Link copied!') }}
                  style={styles.copyBtn}
                >
                  Copy
                </button>
              </div>
            </div>
          </>
        )}
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
  body: { maxWidth: '520px', margin: '0 auto', padding: '32px 24px' },
  heading: { fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' },
  subheading: { fontSize: '0.95rem', color: '#888', marginBottom: '28px' },
  sectionLabel: { fontSize: '0.8rem', fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' },
  modeRow: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' },
  modeCard: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '18px',
    border: '2px solid #eee', cursor: 'pointer',
  },
  modeCardActive: { border: '2px solid #1a1a1a' },
  modeTitle: { fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' },
  modeDesc: { fontSize: '0.88rem', color: '#666', lineHeight: '1.5' },
  generateBtn: {
    width: '100%', backgroundColor: '#1a1a1a', color: '#fff',
    border: 'none', borderRadius: '8px', padding: '14px',
    fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
  },
  loadingBox: { textAlign: 'center', padding: '60px 0' },
  loadingTitle: { fontSize: '1.2rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '12px' },
  loadingHint: { fontSize: '0.9rem', color: '#888', lineHeight: '1.6' },
  recapPreview: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '24px',
    border: '1px solid #eee', marginBottom: '20px',
  },
  recapTitle: { fontSize: '1.3rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '12px' },
  recapText: { fontSize: '0.95rem', color: '#444', lineHeight: '1.7', marginBottom: '20px' },
  recapDay: { marginBottom: '16px' },
  recapDayDate: { fontSize: '0.8rem', fontWeight: '700', color: '#b09070', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' },
  recapDayCaption: { fontSize: '0.95rem', color: '#444', lineHeight: '1.6' },
  recapClosing: { fontSize: '0.95rem', color: '#666', fontStyle: 'italic', lineHeight: '1.7', marginTop: '16px', marginBottom: '16px' },
  recapBranding: { fontSize: '0.75rem', color: '#ccc', textAlign: 'center', marginTop: '8px' },
  downloadBtn: {
    width: '100%', backgroundColor: '#1a1a1a', color: '#fff',
    border: 'none', borderRadius: '8px', padding: '14px',
    fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginBottom: '16px',
  },
  shareBox: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #eee',
  },
  shareLabel: { fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' },
  shareHint: { fontSize: '0.88rem', color: '#888', marginBottom: '12px' },
  linkRow: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f4f4f4', borderRadius: '8px', padding: '10px 14px' },
  linkText: { fontSize: '0.8rem', color: '#555', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  copyBtn: {
    backgroundColor: '#1a1a1a', color: '#fff', border: 'none',
    borderRadius: '6px', padding: '6px 14px', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  error: { color: '#e53e3e', fontSize: '0.9rem', marginBottom: '16px' },
}
