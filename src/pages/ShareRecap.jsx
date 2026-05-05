import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ShareRecap() {
  const { shareCode } = useParams()
  const [recap, setRecap] = useState(null)
  const [recapData, setRecapData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecap = async () => {
      const q = query(collection(db, 'recaps'), where('shareCode', '==', shareCode))
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data()
        setRecapData(data)
        setRecap(data.recap)
      }
      setLoading(false)
    }
    fetchRecap()
  }, [shareCode])

  if (loading) return (
    <div style={styles.center}>
      <p style={{ color: '#888' }}>Loading your trip recap...</p>
    </div>
  )

  if (!recap) return (
    <div style={styles.center}>
      <p style={{ color: '#888' }}>This recap link is invalid or has expired.</p>
    </div>
  )

  const entriesByDay = {}
  if (recapData?.entries) {
    recapData.entries.forEach(entry => {
      if (!entriesByDay[entry.date]) entriesByDay[entry.date] = []
      entriesByDay[entry.date].push(entry)
    })
  }

  const coverPhoto = recapData?.entries?.find(e => e.photoURLs?.length > 0)?.photoURLs?.[0]

  return (
    <div style={styles.container}>

      {coverPhoto && (
        <div style={{ ...styles.hero, backgroundImage: `url(${coverPhoto})` }}>
          <div style={styles.heroOverlay}>
            <p style={styles.heroTripName}>{recapData?.tripTitle}</p>
            <h1 style={styles.heroTitle}>{recap.title}</h1>
          </div>
        </div>
      )}

      {!coverPhoto && (
        <div style={styles.heroPlain}>
          <p style={styles.heroTripName}>{recapData?.tripTitle}</p>
          <h1 style={styles.heroTitleDark}>{recap.title}</h1>
        </div>
      )}

      <div style={styles.body}>

        <p style={styles.summary}>{recap.summary}</p>

        <div style={styles.divider} />

        {recap.days?.map((day, i) => {
          const dayEntries = entriesByDay[day.date] || []
          const allPhotos = dayEntries.flatMap(e => e.photoURLs || [])
          const isMulti = recapData?.mode === 'multi' && dayEntries.length > 1

          return (
            <div key={i} style={styles.daySection}>
              <p style={styles.dayDate}>{formatDate(day.date)}</p>

              {allPhotos.length > 0 && (
                <div style={styles.photoStrip}>
                  {allPhotos.slice(0, 4).map((url, j) => (
                    <img key={j} src={url} alt={`Day photo ${j + 1}`} style={{
                      ...styles.photo,
                      width: allPhotos.length === 1 ? '100%' : allPhotos.length === 2 ? 'calc(50% - 4px)' : 'calc(33.33% - 6px)',
                    }} />
                  ))}
                </div>
              )}

              <p style={styles.dayCaption}>{day.caption}</p>

              {isMulti && (
                <div style={styles.perspectivesRow}>
                  {dayEntries.map((entry, j) => (
                    <div key={j} style={styles.perspectiveCard}>
                      <div style={styles.perspectiveHeader}>
                        <img src={entry.userPhoto} alt={entry.userName} style={styles.perspectiveAvatar} />
                        <span style={styles.perspectiveName}>{entry.userName.split(' ')[0]}</span>
                      </div>
                      {entry.location && <p style={styles.perspectiveLocation}>📍 {entry.location}</p>}
                      {entry.text && (
                        <p style={styles.perspectiveText}>
                          "{entry.text.slice(0, 180)}{entry.text.length > 180 ? '...' : ''}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isMulti && dayEntries[0]?.location && (
                <p style={styles.location}>📍 {dayEntries[0].location}</p>
              )}
            </div>
          )
        })}

        <div style={styles.divider} />

        <p style={styles.closing}>{recap.closing}</p>

        <div style={styles.brandingBox}>
          <p style={styles.branding}>Made with Travel Diary</p>
          <p style={styles.brandingHint}>Capture your trips together and relive them forever</p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f9f6f1', fontFamily: 'system-ui, sans-serif' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '24px', textAlign: 'center' },

  hero: {
    width: '100%', height: '420px', backgroundSize: 'cover',
    backgroundPosition: 'center', position: 'relative',
  },
  heroOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '32px 24px',
  },
  heroTripName: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' },
  heroTitle: { fontSize: '2.2rem', fontWeight: '700', color: '#fff', fontFamily: 'Georgia, serif', lineHeight: '1.2', margin: 0 },

  heroPlain: {
    backgroundColor: '#1a1a1a', padding: '48px 24px',
    textAlign: 'center',
  },
  heroTripName: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' },
  heroTitleDark: { fontSize: '2rem', fontWeight: '700', color: '#fff', fontFamily: 'Georgia, serif', lineHeight: '1.3', margin: 0 },

  body: { maxWidth: '640px', margin: '0 auto', padding: '40px 20px' },
  summary: { fontSize: '1.1rem', color: '#333', lineHeight: '1.9', marginBottom: '32px', fontStyle: 'italic' },
  divider: { height: '1px', backgroundColor: '#e5e0d8', margin: '32px 0' },

  daySection: { marginBottom: '40px' },
  dayDate: { fontSize: '0.75rem', fontWeight: '700', color: '#b09070', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' },

  photoStrip: { display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' },
  photo: { height: '220px', objectFit: 'cover', borderRadius: '10px', flex: '1 1 auto' },

  dayCaption: { fontSize: '1.05rem', color: '#333', lineHeight: '1.8', marginBottom: '16px' },
  location: { fontSize: '0.85rem', color: '#999', marginTop: '8px' },

  perspectivesRow: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' },
  perspectiveCard: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '16px',
    border: '1px solid #eee',
  },
  perspectiveHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  perspectiveAvatar: { width: '32px', height: '32px', borderRadius: '50%' },
  perspectiveName: { fontWeight: '600', fontSize: '0.9rem', color: '#1a1a1a' },
  perspectiveLocation: { fontSize: '0.8rem', color: '#999', marginBottom: '8px' },
  perspectiveText: { fontSize: '0.9rem', color: '#555', lineHeight: '1.6', fontStyle: 'italic' },

  closing: { fontSize: '1.05rem', color: '#555', fontStyle: 'italic', lineHeight: '1.9', marginBottom: '48px', textAlign: 'center' },

  brandingBox: { textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #e5e0d8' },
  branding: { fontSize: '0.9rem', fontWeight: '600', color: '#bbb', marginBottom: '4px' },
  brandingHint: { fontSize: '0.8rem', color: '#ccc' },
}
