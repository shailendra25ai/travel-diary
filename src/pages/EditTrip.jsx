import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { LocationPicker } from '../components/MapComponents'

export default function EditTrip({ user }) {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)

  useEffect(() => {
    const fetchTrip = async () => {
      const tripDoc = await getDoc(doc(db, 'trips', tripId))
      if (tripDoc.exists()) {
        const data = { id: tripDoc.id, ...tripDoc.data() }
        setTrip(data)
        setCoverPreview(data.coverPhotoURL || null)
      }
      setLoading(false)
    }
    fetchTrip()
  }, [tripId])

  if (loading) return <div style={s.center}><p>Loading...</p></div>
  if (!trip) return <div style={s.center}><p>Trip not found.</p></div>
  if (trip.createdBy !== user.uid) {
    return (
      <div style={s.center}>
        <p style={{ color: '#888' }}>Only the trip creator can edit this trip.</p>
        <button onClick={() => navigate(`/trips/${tripId}`)} style={s.linkBack}>Back to trip</button>
      </div>
    )
  }

  const update = (key, val) => setTrip(prev => ({ ...prev, [key]: val }))

  const handleCoverChange = (file) => {
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    setError('')
    if (!trip.title.trim()) return setError('Please give your trip a name.')
    if (!trip.startDate) return setError('Please pick a start date.')
    if (!trip.openEnded && !trip.endDate) return setError('Please pick an end date or mark as open-ended.')
    if (!trip.openEnded && trip.endDate < trip.startDate) return setError('End date can\'t be before start date.')

    setSaving(true)
    try {
      let coverPhotoURL = trip.coverPhotoURL || ''
      if (coverFile) {
        const storageRef = ref(storage, `covers/${user.uid}/${Date.now()}_${coverFile.name}`)
        await uploadBytes(storageRef, coverFile)
        coverPhotoURL = await getDownloadURL(storageRef)
      }

      await updateDoc(doc(db, 'trips', tripId), {
        title: trip.title.trim(),
        location: trip.location || null,
        startDate: trip.startDate,
        endDate: trip.openEnded ? '' : trip.endDate,
        openEnded: trip.openEnded || false,
        coverPhotoURL,
      })

      navigate(`/trips/${tripId}`)
    } catch (err) {
      console.error(err)
      setError('Could not save changes. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button onClick={() => navigate(`/trips/${tripId}`)} style={s.back}>← Back</button>
        <img src="/logo-wide.png" alt="Mosaic" style={s.logoBig} onClick={() => navigate('/home')} />
        <div style={{ width: 70 }} />
      </div>

      <div style={s.body}>
        <h2 style={s.heading}>Edit trip</h2>

        <div style={s.field}>
          <label style={s.label}>Trip title</label>
          <input
            type="text"
            value={trip.title}
            onChange={e => update('title', e.target.value)}
            style={s.input}
          />
        </div>

        <div style={s.field}>
          <label style={s.label}>Destination</label>
          <LocationPicker value={trip.location} onChange={loc => update('location', loc)} />
        </div>

        <div style={s.field}>
          <label style={s.label}>Start date</label>
          <input
            type="date"
            value={trip.startDate || ''}
            onChange={e => update('startDate', e.target.value)}
            style={s.input}
          />
        </div>

        <div style={s.field}>
          <label style={s.label}>End date</label>
          <input
            type="date"
            value={trip.endDate || ''}
            onChange={e => update('endDate', e.target.value)}
            disabled={trip.openEnded}
            style={{ ...s.input, opacity: trip.openEnded ? 0.4 : 1 }}
          />
          <label style={s.checkRow}>
            <input
              type="checkbox"
              checked={trip.openEnded || false}
              onChange={e => update('openEnded', e.target.checked)}
              style={{ marginRight: 8 }}
            />
            <span>Open-ended trip</span>
          </label>
        </div>

        <div style={s.field}>
          <label style={s.label}>Cover photo</label>
          {coverPreview && <img src={coverPreview} alt="Cover" style={s.preview} />}
          <input
            type="file"
            accept="image/*"
            onChange={e => handleCoverChange(e.target.files[0])}
            style={{ fontSize: '0.9rem', color: '#555', marginTop: '8px' }}
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
  center: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px', backgroundColor: '#fff', borderBottom: '1px solid #eee',
  },
  logoBig: { height: '36px', objectFit: 'contain', cursor: 'pointer' },
  back: { background: 'none', border: 'none', fontSize: '0.9rem', color: '#666', cursor: 'pointer', fontWeight: '500' },
  body: { maxWidth: '480px', margin: '0 auto', padding: '32px 20px 64px' },
  heading: { fontSize: '1.6rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '28px', fontFamily: 'Georgia, serif' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
  label: { fontSize: '0.82rem', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    padding: '14px 16px', borderRadius: '10px', border: '1.5px solid #ddd',
    fontSize: '1rem', color: '#1a1a1a', backgroundColor: '#fff', outline: 'none',
  },
  checkRow: { display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: '#555', marginTop: '4px', cursor: 'pointer' },
  preview: { width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' },
  error: { color: '#e53e3e', fontSize: '0.9rem', marginTop: '8px' },
  saveBtn: {
    width: '100%', backgroundColor: '#1a1a1a', color: '#fff',
    border: 'none', borderRadius: '12px', padding: '16px',
    fontSize: '1rem', fontWeight: '700', cursor: 'pointer', marginTop: '16px',
  },
  linkBack: { background: 'none', border: 'none', color: '#1a1a1a', fontWeight: '600', textDecoration: 'underline', cursor: 'pointer' },
}
