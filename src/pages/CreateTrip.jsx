import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { LocationPicker } from '../components/MapComponents'

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 10)
}

const TOTAL_STEPS = 5

export default function CreateTrip({ user }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [trip, setTrip] = useState({
    title: '',
    location: null,
    startDate: '',
    endDate: '',
    openEnded: false,
    coverFile: null,
    coverPreview: null,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (key, val) => setTrip(prev => ({ ...prev, [key]: val }))

  const handleCoverChange = (file) => {
    if (file) {
      update('coverFile', file)
      update('coverPreview', URL.createObjectURL(file))
    }
  }

  const goNext = () => {
    setError('')
    if (step === 1 && !trip.title.trim()) return setError('Please give your trip a name.')
    if (step === 2 && !trip.location) return setError('Please pick a destination.')
    if (step === 3 && !trip.startDate) return setError('Please pick a start date.')
    if (step === 3 && !trip.openEnded && !trip.endDate) return setError('Please pick an end date or mark it as open-ended.')
    if (step === 3 && !trip.openEnded && trip.endDate < trip.startDate) return setError('End date can\'t be before start date.')
    setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }

  const goBack = () => {
    setError('')
    setStep(s => Math.max(s - 1, 1))
  }

  const handleCreate = async () => {
    setSaving(true)
    setError('')
    try {
      let coverPhotoURL = ''
      if (trip.coverFile) {
        const storageRef = ref(storage, `covers/${user.uid}/${Date.now()}_${trip.coverFile.name}`)
        await uploadBytes(storageRef, trip.coverFile)
        coverPhotoURL = await getDownloadURL(storageRef)
      }

      const inviteCode = generateInviteCode()

      const tripRef = await addDoc(collection(db, 'trips'), {
        title: trip.title.trim(),
        location: trip.location,
        startDate: trip.startDate,
        endDate: trip.openEnded ? '' : trip.endDate,
        openEnded: trip.openEnded,
        coverPhotoURL,
        inviteCode,
        createdBy: user.uid,
        createdByName: user.displayName,
        createdByPhoto: user.photoURL,
        members: [user.uid],
        memberDetails: {
          [user.uid]: { name: user.displayName, photo: user.photoURL }
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
    <div style={s.container}>
      <div style={s.header}>
        <button onClick={() => step === 1 ? navigate('/home') : goBack()} style={s.back}>
          {step === 1 ? '✕ Cancel' : '← Back'}
        </button>
        <img src="/logo-wide.png" alt="Mosaic" style={s.logoBig} />
        <div style={{ width: 70 }} />
      </div>

      {/* Progress bar */}
      <div style={s.progressWrap}>
        <div style={s.progressTrack}>
          <div style={{ ...s.progressBar, width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
        <p style={s.progressText}>Step {step} of {TOTAL_STEPS}</p>
      </div>

      <div style={s.body}>
        {step === 1 && (
          <Step heading="What's this trip called?" hint="Give it a name your group will recognise.">
            <input
              type="text"
              autoFocus
              value={trip.title}
              onChange={e => update('title', e.target.value)}
              placeholder="e.g. Goa with the gang"
              style={s.bigInput}
              onKeyDown={e => e.key === 'Enter' && goNext()}
            />
          </Step>
        )}

        {step === 2 && (
          <Step heading="Where are you going?" hint="Search for a city, country, or place.">
            <LocationPicker value={trip.location} onChange={loc => update('location', loc)} />
          </Step>
        )}

        {step === 3 && (
          <Step heading="When are you traveling?" hint="Dates help us organise your daily entries.">
            <div style={s.dateGroup}>
              <div style={s.dateField}>
                <label style={s.dateLabel}>Start date</label>
                <input
                  type="date"
                  value={trip.startDate}
                  onChange={e => update('startDate', e.target.value)}
                  style={s.dateInput}
                />
              </div>
              <div style={s.dateField}>
                <label style={s.dateLabel}>End date</label>
                <input
                  type="date"
                  value={trip.endDate}
                  onChange={e => update('endDate', e.target.value)}
                  disabled={trip.openEnded}
                  style={{ ...s.dateInput, opacity: trip.openEnded ? 0.4 : 1 }}
                />
              </div>
            </div>
            <label style={s.checkRow}>
              <input
                type="checkbox"
                checked={trip.openEnded}
                onChange={e => update('openEnded', e.target.checked)}
                style={{ marginRight: 8 }}
              />
              <span>This trip is open-ended (no fixed end date)</span>
            </label>
          </Step>
        )}

        {step === 4 && (
          <Step heading="Add a cover photo" hint="Optional — you can do this later.">
            <label htmlFor="coverUpload" style={s.dropZone}>
              {trip.coverPreview ? (
                <img src={trip.coverPreview} alt="Cover" style={s.coverPreview} />
              ) : (
                <>
                  <div style={s.dropIcon}>📷</div>
                  <p style={s.dropText}>Tap to choose a photo</p>
                  <p style={s.dropHint}>or drag and drop</p>
                </>
              )}
            </label>
            <input
              id="coverUpload"
              type="file"
              accept="image/*"
              onChange={e => handleCoverChange(e.target.files[0])}
              style={{ display: 'none' }}
            />
            {trip.coverPreview && (
              <button onClick={() => { update('coverFile', null); update('coverPreview', null) }} style={s.linkBtn}>
                Remove photo
              </button>
            )}
          </Step>
        )}

        {step === 5 && (
          <Step heading="All set?" hint="Quick review before we create your trip.">
            <div style={s.reviewCard}>
              {trip.coverPreview && <img src={trip.coverPreview} alt="" style={s.reviewCover} />}
              <div style={s.reviewBody}>
                <p style={s.reviewLabel}>Trip name</p>
                <p style={s.reviewValue}>{trip.title}</p>
                <p style={s.reviewLabel}>Destination</p>
                <p style={s.reviewValue}>📍 {trip.location?.name}</p>
                <p style={s.reviewLabel}>Dates</p>
                <p style={s.reviewValue}>
                  {trip.startDate} {trip.openEnded ? '· Open-ended' : trip.endDate ? `→ ${trip.endDate}` : ''}
                </p>
              </div>
            </div>
          </Step>
        )}

        {error && <p style={s.error}>{error}</p>}

        <div style={s.btnRow}>
          {step < TOTAL_STEPS && (
            <button onClick={goNext} style={s.continueBtn}>
              {step === 4 && !trip.coverFile ? 'Skip & continue' : 'Continue'}
            </button>
          )}
          {step === TOTAL_STEPS && (
            <button onClick={handleCreate} style={s.continueBtn} disabled={saving}>
              {saving ? 'Creating...' : 'Create my trip ✨'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Step({ heading, hint, children }) {
  return (
    <div style={s.step}>
      <h2 style={s.heading}>{heading}</h2>
      {hint && <p style={s.hint}>{hint}</p>}
      <div style={s.stepContent}>{children}</div>
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', backgroundColor: '#f9f6f1', display: 'flex', flexDirection: 'column' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px', backgroundColor: '#fff', borderBottom: '1px solid #eee',
  },
  logoBig: { height: '36px', objectFit: 'contain' },
  back: { background: 'none', border: 'none', fontSize: '0.9rem', color: '#666', cursor: 'pointer', fontWeight: '500' },

  progressWrap: { padding: '16px 20px 0', maxWidth: '480px', margin: '0 auto', width: '100%' },
  progressTrack: { width: '100%', height: '4px', backgroundColor: '#ede9e3', borderRadius: '2px', overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#1a1a1a', borderRadius: '2px', transition: 'width 0.3s' },
  progressText: { fontSize: '0.75rem', color: '#999', marginTop: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' },

  body: { maxWidth: '480px', margin: '0 auto', padding: '32px 20px 48px', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' },
  step: { display: 'flex', flexDirection: 'column', flex: 1 },
  heading: { fontSize: '1.7rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px', fontFamily: 'Georgia, serif', lineHeight: '1.25' },
  hint: { fontSize: '0.95rem', color: '#888', marginBottom: '32px', lineHeight: '1.5' },
  stepContent: { display: 'flex', flexDirection: 'column', gap: '16px' },

  bigInput: {
    width: '100%', padding: '16px 18px', borderRadius: '12px',
    border: '1.5px solid #ddd', fontSize: '1.1rem',
    color: '#1a1a1a', backgroundColor: '#fff', outline: 'none',
    fontFamily: 'inherit',
  },

  dateGroup: { display: 'flex', flexDirection: 'column', gap: '14px' },
  dateField: { display: 'flex', flexDirection: 'column', gap: '6px' },
  dateLabel: { fontSize: '0.8rem', fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' },
  dateInput: {
    width: '100%', padding: '14px 16px', borderRadius: '10px',
    border: '1.5px solid #ddd', fontSize: '1rem',
    color: '#1a1a1a', backgroundColor: '#fff', outline: 'none',
  },
  checkRow: { display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: '#555', marginTop: '4px', cursor: 'pointer' },

  dropZone: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '220px', padding: '32px', borderRadius: '14px',
    border: '2px dashed #ccc', backgroundColor: '#fff', cursor: 'pointer',
    overflow: 'hidden',
  },
  dropIcon: { fontSize: '2.5rem', marginBottom: '12px', opacity: 0.5 },
  dropText: { fontSize: '1rem', color: '#555', fontWeight: '600' },
  dropHint: { fontSize: '0.85rem', color: '#aaa', marginTop: '4px' },
  coverPreview: { width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px' },
  linkBtn: { background: 'none', border: 'none', color: '#888', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline', alignSelf: 'flex-start' },

  reviewCard: { backgroundColor: '#fff', borderRadius: '14px', overflow: 'hidden', border: '1px solid #eee' },
  reviewCover: { width: '100%', height: '160px', objectFit: 'cover' },
  reviewBody: { padding: '20px' },
  reviewLabel: { fontSize: '0.72rem', fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '14px' },
  reviewValue: { fontSize: '1rem', color: '#1a1a1a', marginTop: '2px' },

  error: { color: '#e53e3e', fontSize: '0.9rem', marginTop: '12px' },

  btnRow: { marginTop: 'auto', paddingTop: '32px' },
  continueBtn: {
    width: '100%', backgroundColor: '#1a1a1a', color: '#fff',
    border: 'none', borderRadius: '12px', padding: '16px',
    fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
  },
}
