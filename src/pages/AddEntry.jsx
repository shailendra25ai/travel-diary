import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

export default function AddEntry({ user }) {
  const { tripId } = useParams()
  const [searchParams] = useSearchParams()
  const date = searchParams.get('date')
  const navigate = useNavigate()

  const [text, setText] = useState('')
  const [location, setLocation] = useState('')
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files)
    setPhotos(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim() && photos.length === 0) {
      setError('Please write something or add at least one photo.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const photoURLs = []
      for (const photo of photos) {
        const storageRef = ref(storage, `entries/${user.uid}/${tripId}/${Date.now()}_${photo.name}`)
        await uploadBytes(storageRef, photo)
        const url = await getDownloadURL(storageRef)
        photoURLs.push(url)
      }

      await addDoc(collection(db, 'trips', tripId, 'entries'), {
        date,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        text: text.trim(),
        location: location.trim(),
        photoURLs,
        createdAt: serverTimestamp(),
      })

      navigate(`/trips/${tripId}`)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(`/trips/${tripId}`)} style={styles.back}>← Back</button>
        <h1 style={styles.logo}>Travel Diary</h1>
        <div style={{ width: 60 }} />
      </div>

      <div style={styles.body}>
        <p style={styles.dateLabel}>{formatDate(date)}</p>
        <h2 style={styles.heading}>Add your entry</h2>

        <form onSubmit={handleSubmit} style={styles.form}>

          <div style={styles.field}>
            <label style={styles.label}>What happened today?</label>
            <textarea
              style={styles.textarea}
              placeholder="Write about your day — what you saw, felt, experienced..."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Location <span style={styles.optional}>(optional)</span></label>
            <input
              style={styles.input}
              type="text"
              placeholder="e.g. Anjuna Beach, Goa"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Photos <span style={styles.optional}>(optional)</span></label>
            {previews.length > 0 && (
              <div style={styles.previewGrid}>
                {previews.map((src, i) => (
                  <img key={i} src={src} alt={`Preview ${i + 1}`} style={styles.previewImg} />
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotosChange}
              style={styles.fileInput}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.submitBtn} disabled={saving}>
            {saving ? 'Saving entry...' : 'Save entry'}
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
  dateLabel: { fontSize: '0.85rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' },
  heading: { fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '28px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.9rem', fontWeight: '600', color: '#333' },
  optional: { fontWeight: '400', color: '#999' },
  textarea: {
    padding: '12px 14px', borderRadius: '8px', border: '1.5px solid #ddd',
    fontSize: '1rem', color: '#1a1a1a', backgroundColor: '#fff',
    resize: 'vertical', fontFamily: 'inherit', outline: 'none', lineHeight: '1.6',
  },
  input: {
    padding: '12px 14px', borderRadius: '8px', border: '1.5px solid #ddd',
    fontSize: '1rem', color: '#1a1a1a', backgroundColor: '#fff', outline: 'none',
  },
  fileInput: { fontSize: '0.9rem', color: '#555' },
  previewGrid: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  previewImg: { width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px' },
  error: { color: '#e53e3e', fontSize: '0.9rem' },
  submitBtn: {
    backgroundColor: '#1a1a1a', color: '#fff', border: 'none',
    borderRadius: '8px', padding: '14px', fontSize: '1rem',
    fontWeight: '600', cursor: 'pointer', marginTop: '8px',
  },
}
