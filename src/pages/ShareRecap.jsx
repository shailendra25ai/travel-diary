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
    <div style={styles.center}><p style={{ color: '#888' }}>Loading your trip recap...</p></div>
  )

  if (!recap) return (
    <div style={styles.center}><p style={{ color: '#888' }}>This recap link is invalid or has expired.</p></div>
  )

  const entriesByDay = {}
  if (recapData?.entries) {
    recapData.entries.forEach(entry => {
      if (!entriesByDay[entry.date]) entriesByDay[entry.date] = []
      entriesByDay[entry.date].push(entry)
    })
  }

  const allPhotos = recapData?.entries?.flatMap(e => e.photoURLs || []) || []
  const coverPhoto = allPhotos[0] || null
  const isMulti = recapData?.mode === 'multi'

  return (
    <div style={styles.container}>

      {/* Hero */}
      {coverPhoto ? (
        <div style={{ ...styles.hero, backgroundImage: `url(${coverPhoto})` }}>
          <div style={styles.heroOverlay}>
            <p style={styles.heroTripName}>{recapData?.tripTitle}</p>
            <h1 style={styles.heroTitle}>{recap.title}</h1>
          </div>
        </div>
      ) : (
        <div style={styles.heroPlain}>
          <p style={styles.heroTripNameDark}>{recapData?.tripTitle}</p>
          <h1 style={styles.heroTitleDark}>{recap.title}</h1>
        </div>
      )}

      <div style={styles.body}>

        {/* Opening summary */}
        <p style={styles.summary}>{recap.summary}</p>
        <div style={styles.divider} />

        {/* Days */}
        {recap.days?.map((day, i) => {
          const dayEntries = entriesByDay[day.date] || []
          const allDayPhotos = dayEntries.flatMap(e => e.photoURLs || [])

          return (
            <div key={i} style={styles.daySection}>
              <p style={styles.dayDate}>{formatDate(day.date)}</p>

              {/* Photos grid */}
              {allDayPhotos.length > 0 && (
                <div style={styles.photoGrid}>
                  {allDayPhotos.length === 1 && (
                    <img src={allDayPhotos[0]} alt="" style={styles.photoFull} />
                  )}
                  {allDayPhotos.length === 2 && (
                    <div style={styles.photoRow}>
                      {allDayPhotos.map((url, j) => (
                        <img key={j} src={url} alt="" style={styles.photoHalf} />
                      ))}
                    </div>
                  )}
                  {allDayPhotos.length >= 3 && (
                    <div style={styles.photoRowThree}>
                      <img src={allDayPhotos[0]} alt="" style={styles.photoMain} />
                      <div style={styles.photoSideCol}>
                        {allDayPhotos.slice(1, 3).map((url, j) => (
                          <img key={j} src={url} alt="" style={styles.photoSide} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI caption */}
              <p style={styles.dayCaption}>{day.caption}</p>

              {/* Multi-perspective: each person's card */}
              {isMulti && dayEntries.length > 1 && (
                <div style={styles.perspectiveSection}>
                  <p style={styles.perspectiveSectionLabel}>Two perspectives, one day</p>
                  <div style={styles.perspectiveGrid}>
                    {dayEntries.map((entry, j) => (
                      <div key={j} style={styles.perspectiveCard}>
                        <div style={styles.perspectiveHeader}>
                          <img src={entry.userPhoto} alt={entry.userName} style={styles.perspectiveAvatar} />
                          <div>
                            <p style={styles.perspectiveName}>{entry.userName.split(' ')[0]}</p>
                            {entry.location && <p style={styles.perspectiveLocation}>📍 {entry.location}</p>}
                          </div>
                        </div>
                        {entry.photoURLs?.length > 0 && (
                          <img src={entry.photoURLs[0]} alt="" style={styles.perspectivePhoto} />
                        )}
                        {entry.text && (
                          <p style={styles.perspectiveText}>
                            "{entry.text.length > 200 ? entry.text.slice(0, 200) + '...' : entry.text}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Single perspective location */}
              {!isMulti && dayEntries[0]?.location && (
                <p style={styles.location}>📍 {dayEntries[0].location}</p>
              )}

              <div style={styles.dayDivider} />
            </div>
          )
        })}

        {/* Closing */}
        <p style={styles.closing}>{recap.closing}</p>

        {/* Branding */}
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

  hero: { width: '100%', height: '460px', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
  heroOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.7) 100%)',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '32px 24px',
  },
  heroTripName: { fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' },
  heroTitle: { fontSize: '2.4rem', fontWeight: '700', color: '#fff', fontFamily: 'Georgia, serif', lineHeight: '1.2', margin: 0 },

  heroPlain: { backgroundColor: '#1a1a1a', padding: '56px 24px', textAlign: 'center' },
  heroTripNameDark: { fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' },
  heroTitleDark: { fontSize: '2.2rem', fontWeight: '700', color: '#fff', fontFamily: 'Georgia, serif', lineHeight: '1.3', margin: 0 },

  body: { maxWidth: '660px', margin: '0 auto', padding: '40px 20px' },

  summary: { fontSize: '1.1rem', color: '#444', lineHeight: '1.9', marginBottom: '32px', fontStyle: 'italic', textAlign: 'center' },
  divider: { height: '1px', backgroundColor: '#e5e0d8', margin: '0 0 40px' },

  daySection: { marginBottom: '16px' },
  dayDate: { fontSize: '0.75rem', fontWeight: '700', color: '#b09070', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' },

  photoGrid: { marginBottom: '16px', borderRadius: '12px', overflow: 'hidden' },
  photoFull: { width: '100%', height: '320px', objectFit: 'cover', display: 'block' },
  photoRow: { display: 'flex', gap: '4px' },
  photoHalf: { width: 'calc(50% - 2px)', height: '260px', objectFit: 'cover' },
  photoRowThree: { display: 'flex', gap: '4px' },
  photoMain: { width: '60%', height: '300px', objectFit: 'cover' },
  photoSideCol: { width: '40%', display: 'flex', flexDirection: 'column', gap: '4px' },
  photoSide: { width: '100%', height: 'calc(50% - 2px)', flex: 1, objectFit: 'cover', minHeight: '148px' },

  dayCaption: { fontSize: '1.05rem', color: '#333', lineHeight: '1.8', marginBottom: '16px' },
  location: { fontSize: '0.85rem', color: '#aaa', marginBottom: '12px' },

  perspectiveSection: { marginTop: '20px', marginBottom: '8px' },
  perspectiveSectionLabel: { fontSize: '0.72rem', fontWeight: '700', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' },
  perspectiveGrid: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  perspectiveCard: {
    flex: '1 1 260px', backgroundColor: '#fff', borderRadius: '12px',
    padding: '16px', border: '1px solid #eee',
  },
  perspectiveHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  perspectiveAvatar: { width: '34px', height: '34px', borderRadius: '50%' },
  perspectiveName: { fontWeight: '600', fontSize: '0.9rem', color: '#1a1a1a' },
  perspectiveLocation: { fontSize: '0.78rem', color: '#aaa' },
  perspectivePhoto: { width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' },
  perspectiveText: { fontSize: '0.88rem', color: '#555', lineHeight: '1.6', fontStyle: 'italic' },

  dayDivider: { height: '1px', backgroundColor: '#ede9e3', margin: '28px 0' },

  closing: { fontSize: '1.1rem', color: '#555', fontStyle: 'italic', lineHeight: '1.9', textAlign: 'center', marginBottom: '48px' },

  brandingBox: { textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #e5e0d8' },
  branding: { fontSize: '0.9rem', fontWeight: '600', color: '#ccc', marginBottom: '4px' },
  brandingHint: { fontSize: '0.8rem', color: '#ddd' },
}
