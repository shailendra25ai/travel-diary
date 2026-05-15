import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, onSnapshot, orderBy, query, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { MapDisplay } from '../components/MapComponents'

function getDaysBetween(startDate, endDate) {
  const days = []
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : new Date()
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d).toISOString().split('T')[0])
  }
  return days
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })
}

function formatLongDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Trip({ user }) {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [view, setView] = useState('timeline')

  useEffect(() => {
    const fetchTrip = async () => {
      const tripDoc = await getDoc(doc(db, 'trips', tripId))
      if (tripDoc.exists()) {
        setTrip({ id: tripDoc.id, ...tripDoc.data() })
      }
      setLoading(false)
    }
    fetchTrip()
  }, [tripId])

  useEffect(() => {
    const q = query(collection(db, 'trips', tripId, 'entries'), orderBy('createdAt', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsubscribe
  }, [tripId])

  if (loading) return <div style={styles.center}><p>Loading trip...</p></div>
  if (!trip) return <div style={styles.center}><p>Trip not found.</p></div>

  const inviteLink = `${window.location.origin}/join/${trip.inviteCode}`
  const handleInvite = async () => {
    const shareData = {
      title: `Join "${trip.title}" on Mosaic`,
      text: `${trip.createdByName?.split(' ')[0] || 'A friend'} invited you to "${trip.title}" on Mosaic — add your perspective to the trip.`,
      url: inviteLink,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // User cancelled — no action needed
        if (err.name !== 'AbortError') console.error(err)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(inviteLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Clipboard not available:', err)
      }
    }
  }

  const days = getDaysBetween(trip.startDate, trip.openEnded ? null : trip.endDate)
  const today = new Date().toISOString().split('T')[0]
  const visibleDays = trip.openEnded ? days.filter(d => d <= today) : days

  const entriesByDay = {}
  entries.forEach(entry => {
    if (!entriesByDay[entry.date]) entriesByDay[entry.date] = []
    entriesByDay[entry.date].push(entry)
  })

  const myEntryDates = new Set(entries.filter(e => e.userId === user.uid).map(e => e.date))

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/home')} style={styles.back}>← Back</button>
        <img src="/logo-wide.png" alt="Mosaic" style={styles.logoBig} onClick={() => navigate('/home')} />
        <img src={user.photoURL} alt={user.displayName} style={styles.avatar} />
      </div>

      {trip.coverPhotoURL && (
        <div style={styles.coverWrap}>
          <div style={{ ...styles.coverBlur, backgroundImage: `url(${trip.coverPhotoURL})` }} />
          <img src={trip.coverPhotoURL} alt="Cover" style={styles.coverImg} />
        </div>
      )}

      <div style={styles.body}>
        <p style={styles.eyebrow}>✦ &nbsp;Trip</p>
        <div style={styles.titleRow}>
          <h2 style={styles.tripTitle}>{trip.title}</h2>
          {trip.createdBy === user.uid && (
            <button onClick={() => navigate(`/trips/${tripId}/edit`)} style={styles.editBtn} title="Edit trip">
              ✎ Edit
            </button>
          )}
        </div>
        {trip.location?.name && (
          <p style={styles.location}>📍 {trip.location.name}</p>
        )}
        <p style={styles.dates}>
          {formatDate(trip.startDate)}
          {trip.openEnded ? ' · Open-ended' : trip.endDate ? ` → ${formatDate(trip.endDate)}` : ''}
        </p>

        <div style={styles.memberRow}>
          {Object.values(trip.memberDetails || {}).map((m, i) => (
            <img key={i} src={m.photo} alt={m.name} title={m.name} style={styles.memberAvatar} />
          ))}
          <button onClick={handleInvite} style={styles.inviteBtn}>
            {copied ? 'Copied!' : '↗ Invite'}
          </button>
        </div>
        <p style={styles.memberHint}>
          {trip.members.length === 1
            ? 'Invite your travel group so everyone can add their perspective.'
            : `${trip.members.length} members so far. Tap Invite to add more.`}
        </p>

        <div style={styles.viewToggle}>
          <button
            style={view === 'timeline' ? styles.toggleActive : styles.toggleInactive}
            onClick={() => setView('timeline')}
          >
            My Timeline
          </button>
          <button
            style={view === 'combined' ? styles.toggleActive : styles.toggleInactive}
            onClick={() => setView('combined')}
          >
            Everyone
          </button>
        </div>
        <p style={styles.hintText}>
          {view === 'timeline'
            ? 'Tap a member\'s avatar on any day to see their version of it.'
            : 'See every member\'s entries stacked together, day by day.'}
        </p>

        {trip.location?.lat && trip.location?.lng && (
          <div style={{ marginBottom: '20px' }}>
            <MapDisplay lat={trip.location.lat} lng={trip.location.lng} height={160} />
          </div>
        )}

        <button onClick={() => navigate(`/trips/${tripId}/recap`)} style={styles.recapBtn}>
          ✨ Generate AI Recap
        </button>

        <div style={styles.timeline}>
          {visibleDays.map(day => (
            <DayBlock
              key={day}
              day={day}
              dayEntries={entriesByDay[day] || []}
              userId={user.uid}
              hasMyEntry={myEntryDates.has(day)}
              onAddEntry={() => navigate(`/trips/${tripId}/entries/add?date=${day}`)}
              onEditEntry={(entryId) => navigate(`/trips/${tripId}/entries/${entryId}/edit`)}
              onDeleteEntry={async (entry) => {
                const ok = window.confirm('Delete this entry? This cannot be undone.')
                if (!ok) return
                try {
                  await deleteDoc(doc(db, 'trips', tripId, 'entries', entry.id))
                } catch (err) {
                  console.error(err)
                  alert('Could not delete the entry. Please try again.')
                }
              }}
              view={view}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function DayBlock({ day, dayEntries, userId, hasMyEntry, onAddEntry, onEditEntry, onDeleteEntry, view }) {
  const myEntry = dayEntries.find(e => e.userId === userId)
  const othersEntries = dayEntries.filter(e => e.userId !== userId)
  const allMembers = dayEntries

  const [activeMemberId, setActiveMemberId] = useState(userId)

  const activeEntry = dayEntries.find(e => e.userId === activeMemberId) || null

  if (view === 'combined') {
    return (
      <div style={styles.dayBlock}>
        <div style={styles.dayHeader}>
          <span style={styles.dayLabel}>{formatLongDate(day)}</span>
          {!hasMyEntry && (
            <button onClick={onAddEntry} style={styles.addEntryBtn}>+ Add mine</button>
          )}
        </div>
        {dayEntries.length === 0 && (
          <p style={styles.noEntry}>No entries yet for this day.</p>
        )}
        {dayEntries.map(entry => (
          <EntryCard
            key={entry.id}
            entry={entry}
            isMe={entry.userId === userId}
            onEdit={entry.userId === userId ? () => onEditEntry(entry.id) : null}
            onDelete={entry.userId === userId ? () => onDeleteEntry(entry) : null}
          />
        ))}
      </div>
    )
  }

  return (
    <div style={styles.dayBlock}>
      <div style={styles.dayHeader}>
        <span style={styles.dayLabel}>{formatLongDate(day)}</span>
        {!hasMyEntry && (
          <button onClick={onAddEntry} style={styles.addEntryBtn}>+ Add my entry</button>
        )}
      </div>

      {dayEntries.length === 0 && (
        <div style={styles.noEntryBox}>
          <p style={styles.noEntry}>No entries yet for this day.</p>
          {!hasMyEntry && (
            <p style={styles.noEntryHint}>Be the first to capture this day — tap <strong>+ Add my entry</strong> above.</p>
          )}
        </div>
      )}

      {dayEntries.length > 0 && (
        <>
          {dayEntries.length > 1 && (
            <div style={styles.perspectiveRow}>
              <span style={styles.perspectiveLabel}>Perspective:</span>
              {dayEntries.map(entry => (
                <button
                  key={entry.userId}
                  onClick={() => setActiveMemberId(entry.userId)}
                  style={{
                    ...styles.perspectiveAvatar,
                    outline: activeMemberId === entry.userId ? '2px solid #1a1a1a' : '2px solid transparent',
                  }}
                  title={entry.userId === userId ? 'You' : entry.userName.split(' ')[0]}
                >
                  <img src={entry.userPhoto} alt={entry.userName} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                </button>
              ))}
            </div>
          )}

          {activeEntry
            ? <EntryCard
                entry={activeEntry}
                isMe={activeEntry.userId === userId}
                onEdit={activeEntry.userId === userId ? () => onEditEntry(activeEntry.id) : null}
                onDelete={activeEntry.userId === userId ? () => onDeleteEntry(activeEntry) : null}
              />
            : myEntry
              ? <EntryCard
                  entry={myEntry}
                  isMe={true}
                  onEdit={() => onEditEntry(myEntry.id)}
                  onDelete={() => onDeleteEntry(myEntry)}
                />
              : <EntryCard entry={othersEntries[0]} isMe={false} />
          }
        </>
      )}
    </div>
  )
}

function EntryCard({ entry, isMe, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={styles.entryCard}>
      <div style={styles.entryHeader}>
        <img src={entry.userPhoto} alt={entry.userName} style={styles.entryAvatar} />
        <div style={{ flex: 1 }}>
          <p style={styles.entryName}>{isMe ? 'You' : entry.userName.split(' ')[0]}</p>
          {entry.location && <p style={styles.entryLocation}>📍 {entry.location}</p>}
        </div>
        {(onEdit || onDelete) && (
          <div style={styles.entryActions}>
            {onEdit && <button onClick={onEdit} style={styles.entryActionBtn} title="Edit entry">✎</button>}
            {onDelete && <button onClick={onDelete} style={{ ...styles.entryActionBtn, color: '#a83a4a' }} title="Delete entry">🗑</button>}
          </div>
        )}
      </div>

      {entry.photoURLs?.length > 0 && (
        <div style={styles.photoGrid}>
          {entry.photoURLs.map((url, i) => (
            <img key={i} src={url} alt={`Photo ${i + 1}`} style={styles.entryPhoto} />
          ))}
        </div>
      )}

      {entry.text && (
        <div>
          <p style={styles.entryText}>
            {expanded || entry.text.length <= 200
              ? entry.text
              : entry.text.slice(0, 200) + '...'}
          </p>
          {entry.text.length > 200 && (
            <button onClick={() => setExpanded(!expanded)} style={styles.readMore}>
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}
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
  avatar: { width: '32px', height: '32px', borderRadius: '50%' },
  cover: { width: '100%', height: '220px', objectFit: 'cover' },
  coverWrap: {
    position: 'relative', width: '100%', height: '280px',
    overflow: 'hidden', backgroundColor: '#1a1a1a',
  },
  coverBlur: {
    position: 'absolute', inset: '-10px',
    backgroundSize: 'cover', backgroundPosition: 'center',
    filter: 'blur(28px) brightness(0.7) saturate(1.1)',
    transform: 'scale(1.1)',
  },
  coverImg: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%', objectFit: 'contain',
  },
  body: { maxWidth: '600px', margin: '0 auto', padding: '24px' },
  eyebrow: {
    display: 'inline-block', fontSize: '0.72rem', fontWeight: '700',
    color: '#c89060', textTransform: 'uppercase', letterSpacing: '0.15em',
    backgroundColor: '#fbeede', padding: '5px 12px', borderRadius: '20px',
    marginBottom: '14px',
  },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '6px' },
  tripTitle: { fontSize: '1.9rem', fontWeight: '700', color: '#1a1a1a', flex: 1, fontFamily: 'Georgia, serif', lineHeight: '1.2' },
  editBtn: {
    fontSize: '0.82rem', color: '#7a8a5a', backgroundColor: '#eef0e8',
    border: 'none', borderRadius: '20px', padding: '6px 14px', cursor: 'pointer',
    fontWeight: '700', whiteSpace: 'nowrap', marginTop: '8px',
  },
  dates: { fontSize: '0.95rem', color: '#888', marginBottom: '16px' },
  location: { fontSize: '0.95rem', color: '#b09070', marginBottom: '6px', fontWeight: '600' },
  memberRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' },
  memberHint: { fontSize: '0.78rem', color: '#7a8a5a', fontStyle: 'italic', marginBottom: '20px' },
  memberAvatar: { width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px #eee' },
  recapBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #c89060 0%, #b09070 50%, #2d4a8a 100%)',
    color: '#fff', border: 'none', borderRadius: '14px', padding: '16px',
    fontSize: '1rem', fontWeight: '700', cursor: 'pointer', marginBottom: '24px',
    boxShadow: '0 6px 18px rgba(200,144,96,0.28)', letterSpacing: '0.02em',
  },
  inviteBtn: {
    fontSize: '0.8rem', color: '#2d4a8a', backgroundColor: '#e3eaf5',
    border: 'none', borderRadius: '20px', padding: '7px 14px', cursor: 'pointer',
    fontWeight: '700',
  },
  viewToggle: {
    display: 'flex', backgroundColor: '#ede9e3', borderRadius: '10px',
    padding: '4px', marginBottom: '8px', gap: '4px',
  },
  hintText: {
    fontSize: '0.78rem', color: '#7a8a5a', fontStyle: 'italic',
    marginBottom: '20px', paddingLeft: '4px',
  },
  toggleActive: {
    flex: 1, padding: '8px', border: 'none', borderRadius: '8px',
    backgroundColor: '#fff', fontWeight: '700', fontSize: '0.9rem',
    color: '#c89060', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  toggleInactive: {
    flex: 1, padding: '8px', border: 'none', borderRadius: '8px',
    backgroundColor: 'transparent', fontWeight: '500', fontSize: '0.9rem',
    color: '#888', cursor: 'pointer',
  },
  timeline: { display: 'flex', flexDirection: 'column', gap: '28px' },
  dayBlock: { display: 'flex', flexDirection: 'column', gap: '12px' },
  dayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dayLabel: { fontSize: '0.82rem', fontWeight: '700', color: '#b09070', textTransform: 'uppercase', letterSpacing: '0.1em' },
  addEntryBtn: {
    fontSize: '0.8rem', color: '#fff',
    background: 'linear-gradient(135deg, #c89060 0%, #b09070 100%)',
    border: 'none', borderRadius: '20px', padding: '7px 16px', cursor: 'pointer',
    fontWeight: '700', boxShadow: '0 2px 8px rgba(200,144,96,0.3)',
  },
  noEntry: { fontSize: '0.9rem', color: '#aaa', fontStyle: 'italic' },
  noEntryBox: {
    backgroundColor: '#fbfaf6', borderRadius: '12px', padding: '16px 18px',
    border: '1px dashed #e5dfd0', textAlign: 'center',
  },
  noEntryHint: { fontSize: '0.85rem', color: '#7a8a5a', marginTop: '6px' },
  perspectiveRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  perspectiveLabel: { fontSize: '0.78rem', color: '#b09070', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' },
  perspectiveAvatar: {
    width: '32px', height: '32px', borderRadius: '50%', padding: 0,
    border: 'none', cursor: 'pointer', outlineOffset: '2px', background: 'none',
  },
  entryCard: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '16px',
    border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '12px',
  },
  entryHeader: { display: 'flex', alignItems: 'center', gap: '10px' },
  entryAvatar: { width: '36px', height: '36px', borderRadius: '50%' },
  entryActions: { display: 'flex', gap: '4px' },
  entryActionBtn: {
    background: 'none', border: 'none', fontSize: '0.95rem',
    color: '#999', cursor: 'pointer', padding: '6px 8px',
    borderRadius: '6px', opacity: 0.7,
  },
  entryName: { fontSize: '0.98rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif' },
  entryLocation: { fontSize: '0.8rem', color: '#b09070', fontWeight: '500' },
  photoGrid: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  entryPhoto: { width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' },
  entryText: { fontSize: '0.95rem', color: '#444', lineHeight: '1.6' },
  readMore: { background: 'none', border: 'none', color: '#888', fontSize: '0.85rem', cursor: 'pointer', padding: 0, marginTop: '4px' },
}
