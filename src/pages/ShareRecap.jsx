import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDayLabel(d, i) {
  return `Day ${i + 1}`
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

  // Group entries by date
  const entriesByDay = {}
  if (recapData?.entries) {
    recapData.entries.forEach(entry => {
      if (!entriesByDay[entry.date]) entriesByDay[entry.date] = []
      entriesByDay[entry.date].push(entry)
    })
  }

  // Sorted unique dates from actual entries (this guarantees photos always show)
  const sortedDates = Object.keys(entriesByDay).sort()

  // Build a lookup of AI captions by date
  const captionByDate = {}
  if (recap.days) {
    recap.days.forEach(d => { captionByDate[d.date] = d.caption })
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
            {isMulti && recapData?.entries && (
              <div style={styles.heroMembers}>
                {[...new Map(recapData.entries.map(e => [e.userId, e])).values()].map((m, i) => (
                  <img key={i} src={m.userPhoto} alt={m.userName} title={m.userName} style={styles.heroAvatar} />
                ))}
                <span style={styles.heroMembersText}>
                  Through {[...new Set(recapData.entries.map(e => e.userName.split(' ')[0]))].join(' & ')}'s eyes
                </span>
              </div>
            )}
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
        <div style={styles.summaryBox}>
          <p style={styles.summary}>{recap.summary}</p>
        </div>

        {/* Day rows */}
        {sortedDates.map((date, i) => {
          const dayEntries = entriesByDay[date] || []
          const aiCaption = captionByDate[date]

          return (
            <DayRow
              key={date}
              date={date}
              dayLabel={formatDayLabel(date, i)}
              dayEntries={dayEntries}
              aiCaption={aiCaption}
              isMulti={isMulti}
            />
          )
        })}

        {/* Closing */}
        <div style={styles.closingBox}>
          <p style={styles.closingMark}>~</p>
          <p style={styles.closing}>{recap.closing}</p>
        </div>

        {/* Branding */}
        <div style={styles.brandingBox}>
          <p style={styles.branding}>Made with Travel Diary</p>
          <p style={styles.brandingHint}>Capture your trips together and relive them forever</p>
        </div>
      </div>
    </div>
  )
}

function DayRow({ date, dayLabel, dayEntries, aiCaption, isMulti }) {
  const allPhotos = dayEntries.flatMap(e => e.photoURLs || [])
  const showMultiCards = isMulti && dayEntries.length > 1

  return (
    <div style={styles.dayRow}>

      {/* Day header */}
      <div style={styles.dayHeader}>
        <p style={styles.dayLabel}>{dayLabel}</p>
        <p style={styles.dayDate}>{formatDate(date)}</p>
      </div>

      {/* AI caption first - sets the scene */}
      {aiCaption && (
        <p style={styles.aiCaption}>{aiCaption}</p>
      )}

      {/* All photos for this day - stacked / collage */}
      {allPhotos.length > 0 && (
        <PhotoCollage photos={allPhotos} />
      )}

      {/* Multi-perspective cards */}
      {showMultiCards && (
        <div style={styles.perspectivesWrap}>
          <p style={styles.perspectivesLabel}>Both perspectives</p>
          <div style={styles.perspectivesGrid}>
            {dayEntries.map((entry, j) => (
              <PerspectiveCard key={j} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {/* Single perspective: just show their text */}
      {!showMultiCards && dayEntries[0]?.text && (
        <div style={styles.singleEntryBox}>
          <div style={styles.singleEntryHeader}>
            <img src={dayEntries[0].userPhoto} alt={dayEntries[0].userName} style={styles.singleAvatar} />
            <span style={styles.singleName}>{dayEntries[0].userName.split(' ')[0]}</span>
            {dayEntries[0].location && <span style={styles.singleLocation}>· 📍 {dayEntries[0].location}</span>}
          </div>
          <p style={styles.singleText}>"{dayEntries[0].text}"</p>
        </div>
      )}
    </div>
  )
}

function PhotoCollage({ photos }) {
  const count = photos.length

  if (count === 1) {
    return (
      <div style={styles.collageWrap}>
        <img src={photos[0]} alt="" style={styles.photoSingle} />
      </div>
    )
  }

  if (count === 2) {
    return (
      <div style={styles.collageWrap}>
        <div style={styles.row}>
          <img src={photos[0]} alt="" style={styles.photoHalf} />
          <img src={photos[1]} alt="" style={styles.photoHalf} />
        </div>
      </div>
    )
  }

  if (count === 3) {
    return (
      <div style={styles.collageWrap}>
        <img src={photos[0]} alt="" style={styles.photoTopWide} />
        <div style={styles.row}>
          <img src={photos[1]} alt="" style={styles.photoHalf} />
          <img src={photos[2]} alt="" style={styles.photoHalf} />
        </div>
      </div>
    )
  }

  // 4+
  return (
    <div style={styles.collageWrap}>
      <div style={styles.row}>
        <img src={photos[0]} alt="" style={styles.photoHalf} />
        <img src={photos[1]} alt="" style={styles.photoHalf} />
      </div>
      <div style={styles.row}>
        <img src={photos[2]} alt="" style={styles.photoHalf} />
        {count >= 4
          ? <img src={photos[3]} alt="" style={styles.photoHalf} />
          : <div style={{ ...styles.photoHalf, backgroundColor: '#eee' }} />
        }
      </div>
      {count > 4 && (
        <p style={styles.morePhotos}>+ {count - 4} more</p>
      )}
    </div>
  )
}

function PerspectiveCard({ entry }) {
  return (
    <div style={styles.perspectiveCard}>
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
        <p style={styles.perspectiveText}>"{entry.text}"</p>
      )}
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#faf7f2', fontFamily: 'system-ui, -apple-system, sans-serif' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '24px', textAlign: 'center' },

  hero: { width: '100%', height: '500px', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
  heroOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.85) 100%)',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '40px 24px',
  },
  heroTripName: { fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px', fontWeight: '500' },
  heroTitle: { fontSize: '2.6rem', fontWeight: '700', color: '#fff', fontFamily: 'Georgia, serif', lineHeight: '1.15', margin: 0, maxWidth: '700px' },
  heroMembers: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' },
  heroAvatar: { width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #fff' },
  heroMembersText: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', marginLeft: '4px' },

  heroPlain: { backgroundColor: '#1a1a1a', padding: '64px 24px', textAlign: 'center' },
  heroTripNameDark: { fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' },
  heroTitleDark: { fontSize: '2.4rem', fontWeight: '700', color: '#fff', fontFamily: 'Georgia, serif', lineHeight: '1.2', margin: 0 },

  body: { maxWidth: '720px', margin: '0 auto', padding: '0 16px' },

  summaryBox: { padding: '48px 8px 24px', textAlign: 'center', borderBottom: '1px solid #ebe5dc', marginBottom: '8px' },
  summary: { fontSize: '1.15rem', color: '#444', lineHeight: '1.85', fontStyle: 'italic', fontFamily: 'Georgia, serif', maxWidth: '560px', margin: '0 auto' },

  dayRow: { padding: '40px 0', borderBottom: '1px solid #ebe5dc' },

  dayHeader: { display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '20px', paddingLeft: '4px' },
  dayLabel: { fontSize: '1.4rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', margin: 0 },
  dayDate: { fontSize: '0.78rem', fontWeight: '600', color: '#b09070', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 },

  aiCaption: { fontSize: '1.05rem', color: '#333', lineHeight: '1.85', marginBottom: '24px', padding: '0 4px' },

  collageWrap: { display: 'flex', flexDirection: 'column', gap: '4px', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' },
  row: { display: 'flex', gap: '4px' },
  photoSingle: { width: '100%', height: '380px', objectFit: 'cover', display: 'block' },
  photoTopWide: { width: '100%', height: '280px', objectFit: 'cover', display: 'block' },
  photoHalf: { width: 'calc(50% - 2px)', height: '240px', objectFit: 'cover', flex: 1, display: 'block' },
  morePhotos: { fontSize: '0.8rem', color: '#aaa', textAlign: 'center', marginTop: '4px' },

  perspectivesWrap: { marginTop: '8px' },
  perspectivesLabel: { fontSize: '0.72rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px', textAlign: 'center' },
  perspectivesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' },

  perspectiveCard: {
    backgroundColor: '#fff', borderRadius: '14px', padding: '18px',
    border: '1px solid #ebe5dc', display: 'flex', flexDirection: 'column', gap: '12px',
  },
  perspectiveHeader: { display: 'flex', alignItems: 'center', gap: '10px' },
  perspectiveAvatar: { width: '38px', height: '38px', borderRadius: '50%' },
  perspectiveName: { fontWeight: '700', fontSize: '0.95rem', color: '#1a1a1a', margin: 0 },
  perspectiveLocation: { fontSize: '0.78rem', color: '#aaa', margin: 0, marginTop: '2px' },
  perspectivePhoto: { width: '100%', height: '180px', objectFit: 'cover', borderRadius: '10px' },
  perspectiveText: { fontSize: '0.92rem', color: '#444', lineHeight: '1.7', fontStyle: 'italic', margin: 0 },

  singleEntryBox: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '16px',
    border: '1px solid #ebe5dc',
  },
  singleEntryHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' },
  singleAvatar: { width: '32px', height: '32px', borderRadius: '50%' },
  singleName: { fontWeight: '600', fontSize: '0.9rem', color: '#1a1a1a' },
  singleLocation: { fontSize: '0.8rem', color: '#aaa' },
  singleText: { fontSize: '0.95rem', color: '#444', lineHeight: '1.7', fontStyle: 'italic', margin: 0 },

  closingBox: { padding: '56px 8px', textAlign: 'center' },
  closingMark: { fontSize: '1.5rem', color: '#b09070', marginBottom: '16px', fontFamily: 'Georgia, serif' },
  closing: { fontSize: '1.1rem', color: '#444', fontStyle: 'italic', lineHeight: '1.85', fontFamily: 'Georgia, serif', maxWidth: '560px', margin: '0 auto' },

  brandingBox: { textAlign: 'center', padding: '24px 0 48px', borderTop: '1px solid #ebe5dc' },
  branding: { fontSize: '0.95rem', fontWeight: '700', color: '#bbb', marginBottom: '4px', fontFamily: 'Georgia, serif' },
  brandingHint: { fontSize: '0.8rem', color: '#ccc' },
}
