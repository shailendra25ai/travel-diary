import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

export default function EditEntry({ user }) {
  const { tripId, entryId } = useParams()
  const navigate = useNavigate()

  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [location, setLocation] = useState('')
  const [existingPhotos, setExistingPhotos] = useState([])
  const [newPhotos, setNewPhotos] = useState([])
  const [newPreviews, setNewPreviews] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchEntry = async () => {
      const entryDoc = await getDoc(doc(db, 'trips', tripId, 'entries', entryId))
      if (entryDoc.exists()) {
        const data = { id: entryDoc.id, ...entryDoc.data() }
        setEntry(data)
        setText(data.text || '')
        setLocation(data.location || '')
        setExistingPhotos(data.photoURLs || [])
      }
      setLoading(false)
    }
    fetchEntry()
  }, [tripId, entryId])

  if (loading) return <div style={s.center}><p>Loading...</p></div>
  if (!entry) return <div style={s.center}><p>Entry not found.</p></div>
  if (entry.userId !== user.uid) {
    return (
      <div style={s.center}>
        <p style={{ color: '#888' }}>You can only edit your own entries.</p>
        <button onClick={() => navigate(`/trips/${tripId}`)} style={s.linkBack}>Back to trip</button>
      </div>
    )
  }

  const handleNewPhotosChange = (e) => {
    const files = Array.from(e.target.files)
    setNewPhotos(files)
    setNewPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const handleRemoveExistingPhoto = (url) => {
    setExistingPhotos(prev => prev.filter(u => u !== url))
  }

  const handleRemoveNewPhoto = (index) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index))
    setNewPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!text.trim() && existingPhotos.length === 0 && newPhotos.length === 0) {
      setError('Please write something or keep at least one photo.')
      return
    }

    setSaving(true)
    setError('')

    try {
      // Upload any new photos
      const newPhotoURLs = []
      for (const photo of newPhotos) {
        const storageRef = ref(storage, `entries/${user.uid}/${tripId}/${Date.now()}_${photo.name}`)
        await uploadBytes(storageRef, photo)
        const url = await getDownloadURL(storageRef)
        newPhotoURLs.push(url)
      }

      // Combine kept existing photos with newly uploaded ones
      const photoURLs = [...existingPhotos, ...newPhotoURLs]

      await updateDoc(doc(db, 'trips', tripId, 'entries', entryId), {
        text: text.trim(),
        location: location.trim(),
        photoURLs,
      })

      navigate(`/trips/${tripId}`)
    } catch (err) {
      console.error(err)
      setError('Could not save changes. Please try again.')
      setSaving(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button onClick={() => navigate(`/trips/${tripId}`)} style={s.back}>← Back</button>
        <img src="/logo-wide.png" alt="Mosaic" style={s.logoBig} onClick={() => navigate('/home')} />
        <div style={{ width: 70 }} />
      </div>

      <div style={s.body}>
        <p style={s.eyebrow}>✎ &nbsp;Edit entry</p>
        <p style={s.dateLabel}>{formatDate(entry.date)}</p>
        <h2 style={s.heading}>Update your story</h2>

        <div style={s.field}>
          <label style={s.label}>What happened today?</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write about your day..."
            rows={6}
            style={s.textarea}
          />
        </div>

        <div style={s.field}>
          <label style={s.label}>Location <span style={s.optional}>(optional)</span></label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="e.g. Anjuna Beach, Goa"
            style={s.input}
          />
        </div>

        <div style={s.field}>
          <label style={s.label}>Photos</label>

          {existingPhotos.length > 0 && (
            <>
              <p style={s.subLabel}>Existing photos</p>
              <div style={s.photoGrid}>
                {existingPhotos.map((url, i) => (
                  <div key={i} style={s.photoWrap}>
                    <img src={url} alt="" style={s.photo} />
                    <button onClick={() => handleRemoveExistingPhoto(url)} style={s.photoRemove} title="Remove">✕</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {newPreviews.length > 0 && (
            <>
              <p style={s.subLabel}>New photos to add</p>
              <div style={s.photoGrid}>
                {newPreviews.map((src, i) => (
                  <div key={i} style={s.photoWrap}>
                    <img src={src} alt="" style={s.photo} />
                    <button onClick={() => handleRemoveNewPhoto(i)} style={s.photoRemove} title="Remove">✕</button>
                  </div>
                ))}
              </div>
            </>
          )}

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleNewPhotosChange}
            style={s.fileInput}
          />
        </div>

        {error && <p style={s.error}>{error}</p>}

        <button onClick={handleSave} style={s.saveBtn} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', backgroundColor: '#f9f6f1' },
  center: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px', padding: '24px', textAlign: 'center' },
  linkBack: { background: 'none', border: 'none', color: '#1a1a1a', fontWeight: '600', textDecoration: 'underline', cursor: 'pointer' },

  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px', backgroundColor: '#fff', borderBottom: '1px solid #eee',
  },
  logoBig: { height: '36px', objectFit: 'contain', cursor: 'pointer' },
  back: { background: 'none', border: 'none', fontSize: '0.9rem', color: '#666', cursor: 'pointer', fontWeight: '500' },

  body: { maxWidth: '480px', margin: '0 auto', padding: '32px 20px 64px' },

  eyebrow: {
    display: 'inline-block', fontSize: '0.72rem', fontWeight: '700',
    color: '#c89060', textTransform: 'uppercase', letterSpacing: '0.15em',
    backgroundColor: '#fbeede', padding: '5px 12px', borderRadius: '20px', marginBottom: '12px',
  },
  dateLabel: { fontSize: '0.85rem', color: '#7a8a5a', fontWeight: '600', marginBottom: '6px' },
  heading: { fontSize: '1.7rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '28px', fontFamily: 'Georgia, serif', lineHeight: '1.2' },

  field: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' },
  label: { fontSize: '0.85rem', fontWeight: '700', color: '#1a1a1a' },
  subLabel: { fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', margin: '8px 0 4px' },
  optional: { fontWeight: '400', color: '#999' },

  input: {
    padding: '14px 16px', borderRadius: '10px', border: '1.5px solid #ddd',
    fontSize: '1rem', color: '#1a1a1a', backgroundColor: '#fff', outline: 'none',
  },
  textarea: {
    padding: '14px 16px', borderRadius: '10px', border: '1.5px solid #ddd',
    fontSize: '1rem', color: '#1a1a1a', backgroundColor: '#fff',
    resize: 'vertical', fontFamily: 'inherit', outline: 'none', lineHeight: '1.6',
  },
  fileInput: { fontSize: '0.9rem', color: '#555', marginTop: '8px' },

  photoGrid: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' },
  photoWrap: { position: 'relative' },
  photo: { width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px', display: 'block' },
  photoRemove: {
    position: 'absolute', top: '-6px', right: '-6px',
    width: '24px', height: '24px', borderRadius: '50%',
    backgroundColor: '#a83a4a', color: '#fff', border: '2px solid #fff',
    cursor: 'pointer', fontSize: '0.7rem', fontWeight: '700',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  },

  error: { color: '#e53e3e', fontSize: '0.9rem', marginTop: '8px' },

  saveBtn: {
    width: '100%', background: 'linear-gradient(135deg, #c89060 0%, #b09070 100%)',
    color: '#fff', border: 'none', borderRadius: '14px', padding: '16px',
    fontSize: '1rem', fontWeight: '700', cursor: 'pointer', marginTop: '16px',
    boxShadow: '0 4px 14px rgba(200,144,96,0.3)',
  },
}
