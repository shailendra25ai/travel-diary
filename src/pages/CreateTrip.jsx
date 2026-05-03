import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 10)
}

export default function CreateTrip({ user }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [openEnded, setOpenEnded] = useState(false)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleCoverChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setError('Please enter a trip title.'); return }
    if (!startDate) { setError('Please enter a start date.'); return }
    if (!openEnded && !endDate) { setError('Please enter an end date or mark the trip as open-ended.'); return }

    setSaving(true)
    setError('')

    try {
      let coverPhotoURL = ''
      if (coverFile) {
        const storageRef = ref(storage, `covers/${user.uid}/${Date.now()}_${coverFile.name}`)
        await uploadBytes(storageRef, coverFile)
        coverPhotoURL = await getDownloadURL(storageRef)
      }

      const inviteCode = generateInviteCode()

      const tripRef = await addDoc(collection(db, 'trips'), {
        title: title.trim(),
        startDate,
        endDate: openEnded ? '' : endDate,
        openEnded,
        coverPhotoURL,
        inviteCode,
        createdBy: user.uid,
        createdByName: user.displayName,
        createdByPhoto: user.photoURL,
        members: [user.uid],
        memberDetails: {
          [user.uid]: {
            name: user.displayName,
            photo: user.photoURL,
          }
        },
        createdAt: serverTimestamp(),
      })

      navigate(`/trips/${tripRef.id}`)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/home')} style={styles.back}>← Back</button>
        <h1 style={styles.logo}>Travel Diary</h1>
        <div style={{ width: 60 }} />
      </div>

      <div style={styles.body}>
        <h2 style={styles.heading}>Create a new trip</h2>

        <form onSubmit={handleSubmit} style={styles.form}>

          <div style={styles.field}>
            <label style={styles.label}>Trip title</label>
            <input
              style={styles.input}
              type="text"
              placeholder="e.g. Goa with the gang"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Start date</label>
            <input
              style={styles.input}
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>End date</label>
            <input
              style={styles.input}
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              disabled={openEnded}
            />
            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                checked={openEnded}
                onChange={e => setOpenEnded(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Open-ended (no fixed end date)
            </label>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Cover photo <span style={styles.optional}>(optional)</span></label>
            {coverPreview && (
              <img src={coverPreview} alt="Cover preview" style={styles.preview} />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              style={styles.fileInput}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.submitBtn} disabled={saving}>
            {saving ? 'Creating trip...' : 'Create trip'}
          </button>

        </form>
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
  back: { background: 'none', border: 'none', fontSize: '0.95rem', color: '#555', cursor: 'pointer' },
  body: { maxWidth: '480px', margin: '0 auto', padding: '32px 24px' },
  heading: { fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '28px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.9rem', fontWeight: '600', color: '#333' },
  optional: { fontWeight: '400', color: '#999' },
  input: {
    padding: '12px 14px', borderRadius: '8px', border: '1.5px solid #ddd',
    fontSize: '1rem', color: '#1a1a1a', backgroundColor: '#fff', outline: 'none',
  },
  checkLabel: { fontSize: '0.9rem', color: '#555', display: 'flex', alignItems: 'center' },
  fileInput: { fontSize: '0.9rem', color: '#555' },
  preview: { width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' },
  error: { color: '#e53e3e', fontSize: '0.9rem' },
  submitBtn: {
    backgroundColor: '#1a1a1a', color: '#fff', border: 'none',
    borderRadius: '8px', padding: '14px', fontSize: '1rem',
    fontWeight: '600', cursor: 'pointer', marginTop: '8px',
  },
}
