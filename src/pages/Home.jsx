import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collection, query, where, onSnapshot, orderBy, collectionGroup, limit } from 'firebase/firestore'
import { auth, db } from '../firebase'
import BottomNav from '../components/BottomNav'

const HERO_PHOTOS = [
  // Mountain lake, golden hour
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
  // Hot air balloons over Cappadocia
  'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=1600&q=80',
  // Tropical beach with palm trees
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80',
  // Mountain valley with sunlight
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80',
  // Forest road in autumn
  'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80',
  // Desert dunes
  'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=1600&q=80',
  // Coastal cliffs at sunset
  'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1600&q=80',
  // Rice terraces
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600&q=80',
  // Northern lights
  'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=1600&q=80',
  // City skyline at golden hour
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80',
]

const TRAVEL_QUOTES = [
  { quote: "Travel is the only thing you buy that makes you richer.", author: "Anonymous" },
  { quote: "We travel not to escape life, but for life not to escape us.", author: "Anonymous" },
  { quote: "Memories made together last longer than memories made alone.", author: "Mosaic" },
  { quote: "The journey is best measured in friends, not miles.", author: "Tim Cahill" },
  { quote: "To travel is to live.", author: "Hans Christian Andersen" },
  { quote: "Life is short and the world is wide.", author: "Anonymous" },
]

function pickQuote(seed) {
  return TRAVEL_QUOTES[seed % TRAVEL_QUOTES.length]
}

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Late night,'
  if (h < 12) return 'Good morning,'
  if (h < 17) return 'Good afternoon,'
  if (h < 21) return 'Good evening,'
  return 'Good night,'
}

function getMemoryUnlocks(trips) {
  const today = new Date()
  const unlocks = []
  trips.forEach(trip => {
    if (!trip.startDate) return
    const start = new Date(trip.startDate)
    const yearsAgo = today.getFullYear() - start.getFullYear()
    if (yearsAgo < 1) return
    if (start.getMonth() === today.getMonth() && Math.abs(start.getDate() - today.getDate()) <= 3) {
      unlocks.push({ trip, yearsAgo })
    }
  })
  return unlocks.sort((a, b) => a.yearsAgo - b.yearsAgo).slice(0, 3)
}

export default function Home({ user }) {
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroPhoto] = useState(() => HERO_PHOTOS[Math.floor(Math.random() * HERO_PHOTOS.length)])

  useEffect(() => {
    const q = query(
      collection(db, 'trips'),
      where('members', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setTrips(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [user.uid])

  const handleSignOut = async () => { await signOut(auth) }

  // Stats
  const tripsWithLocation = trips.filter(t => t.location?.country)
  const uniqueCountries = new Set(tripsWithLocation.map(t => t.location.country))
  const totalDays = trips.reduce((sum, t) => {
    if (!t.startDate) return sum
    const start = new Date(t.startDate)
    const end = t.endDate ? new Date(t.endDate) : start
    return sum + Math.max(1, Math.ceil((end - start) / 86400000) + 1)
  }, 0)

  // Featured trip = most recent trip with cover photo
  const featuredTrip = trips.find(t => t.coverPhotoURL)

  // Memory unlocks
  const memories = getMemoryUnlocks(trips)

  // Quote of the day (deterministic by date)
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  const todayQuote = pickQuote(dayOfYear)

  const firstName = user.displayName?.split(' ')[0] || 'traveler'

  // Today's status
  const today = new Date().toISOString().split('T')[0]
  const currentTrip = trips.find(t => {
    const s = t.startDate
    const e = t.endDate || t.startDate
    return today >= s && (today <= e || t.openEnded)
  })
  const upcomingTrip = trips
    .filter(t => t.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0]

  return (
    <div style={s.container}>
      {/* HERO */}
      <div style={s.hero}>
        <div style={{ ...s.heroBg, backgroundImage: `url(${heroPhoto})` }} />
        <div style={s.heroOverlay}>
          <div style={s.heroTop}>
            <div style={s.heroLogoRow} onClick={() => navigate('/home')}>
              <img src="/logo-icon.png" alt="" style={s.heroLogoIcon} />
              <span style={s.heroLogoText}>Mosaic</span>
            </div>
            <button onClick={handleSignOut} style={s.signOutBtn} title="Sign out">
              <img src={user.photoURL} alt={user.displayName} style={s.avatar} />
            </button>
          </div>

          <div style={s.heroContent}>
            <p style={s.greeting}>{greeting()}</p>
            <h1 style={s.greetingName}>{firstName}.</h1>
            <p style={s.tagline}>Many pieces. One unforgettable trip.</p>
          </div>
        </div>
      </div>

      <div style={s.body}>

        {/* Today's status */}
        {currentTrip && (
          <div style={s.statusCard} onClick={() => navigate(`/trips/${currentTrip.id}`)}>
            <div style={s.statusBadge}>● Currently traveling</div>
            <p style={s.statusTitle}>{currentTrip.title}</p>
            {currentTrip.location?.name && <p style={s.statusLoc}>📍 {currentTrip.location.name}</p>}
            <p style={s.statusHint}>Tap to add today's diary →</p>
          </div>
        )}

        {!currentTrip && upcomingTrip && (
          <div style={s.statusCard} onClick={() => navigate(`/trips/${upcomingTrip.id}`)}>
            <div style={{ ...s.statusBadge, backgroundColor: '#c89060' }}>↗ Upcoming</div>
            <p style={s.statusTitle}>{upcomingTrip.title}</p>
            {upcomingTrip.location?.name && <p style={s.statusLoc}>📍 {upcomingTrip.location.name}</p>}
            <p style={s.statusHint}>
              {Math.ceil((new Date(upcomingTrip.startDate) - new Date()) / 86400000)} days to go →
            </p>
          </div>
        )}

        {/* Memory Unlocks */}
        {memories.length > 0 && (
          <section style={s.section}>
            <p style={s.sectionLabel}>✨ On this day</p>
            {memories.map(({ trip, yearsAgo }) => (
              <SmartPhotoCard
                key={trip.id}
                photoURL={trip.coverPhotoURL}
                onClick={() => navigate(`/trips/${trip.id}`)}
              >
                <p style={s.memoryYears}>{yearsAgo} {yearsAgo === 1 ? 'year' : 'years'} ago</p>
                <h3 style={s.memoryTitle}>{trip.title}</h3>
                {trip.location?.name && <p style={s.memoryLoc}>📍 {trip.location.name}</p>}
                <p style={s.memoryCta}>Relive this trip →</p>
              </SmartPhotoCard>
            ))}
          </section>
        )}

        {/* Featured trip card (if no memory unlocks) */}
        {memories.length === 0 && featuredTrip && (
          <section style={s.section}>
            <p style={s.sectionLabel}>★ Featured</p>
            <SmartPhotoCard
              photoURL={featuredTrip.coverPhotoURL}
              onClick={() => navigate(`/trips/${featuredTrip.id}`)}
            >
              <h3 style={s.memoryTitle}>{featuredTrip.title}</h3>
              {featuredTrip.location?.name && <p style={s.memoryLoc}>📍 {featuredTrip.location.name}</p>}
              <p style={s.memoryCta}>Open trip →</p>
            </SmartPhotoCard>
          </section>
        )}

        {/* Quote of the day */}
        <div style={s.quoteCard}>
          <p style={s.quoteMark}>“</p>
          <p style={s.quoteText}>{todayQuote.quote}</p>
          <p style={s.quoteAuthor}>— {todayQuote.author}</p>
        </div>

        {/* Stats */}
        {trips.length > 0 && (
          <section style={s.section}>
            <p style={s.sectionLabel}>Your journey so far</p>
            <div style={s.statsGrid}>
              <Stat number={trips.length} label={trips.length === 1 ? 'Trip' : 'Trips'} />
              <Stat number={uniqueCountries.size} label={uniqueCountries.size === 1 ? 'Country' : 'Countries'} />
              <Stat number={totalDays} label="Days" />
            </div>
          </section>
        )}

        {/* CTAs */}
        <section style={s.actionsRow}>
          <button onClick={() => navigate('/trips/create')} style={s.primaryAction}>
            + Start a new trip
          </button>
          {trips.length > 0 && (
            <button onClick={() => navigate('/trips')} style={s.secondaryAction}>
              See all trips →
            </button>
          )}
        </section>

        {/* Empty state */}
        {!loading && trips.length === 0 && (
          <div style={s.emptyState}>
            <div style={s.emptyEmoji}>🧳</div>
            <p style={s.emptyHeading}>Your story starts here.</p>
            <p style={s.emptyText}>
              Capture trips with the people who matter. Watch them become beautiful, shareable memories.
            </p>
            <div style={s.emptyArrow}>↓ Start with your first trip ↓</div>
          </div>
        )}

      </div>

      <div style={{ height: '80px' }} /> {/* spacer for bottom nav */}
      <BottomNav user={user} />
    </div>
  )
}

function SmartPhotoCard({ photoURL, onClick, children }) {
  return (
    <div style={s.smartCard} onClick={onClick}>
      {photoURL ? (
        <>
          <div style={{ ...s.smartCardBlurBg, backgroundImage: `url(${photoURL})` }} />
          <img src={photoURL} alt="" style={s.smartCardImg} />
        </>
      ) : (
        <div style={s.smartCardFallback} />
      )}
      <div style={s.smartCardOverlay}>{children}</div>
    </div>
  )
}

function Stat({ number, label }) {
  return (
    <div style={s.stat}>
      <p style={s.statNumber}>{number}</p>
      <p style={s.statLabel}>{label}</p>
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', backgroundColor: '#faf7f2' },

  /* HERO */
  hero: {
    position: 'relative', minHeight: '420px',
    overflow: 'hidden', backgroundColor: '#1a1a1a',
  },
  heroBg: {
    position: 'absolute', inset: 0,
    backgroundSize: 'cover', backgroundPosition: 'center',
    animation: 'kenBurns 30s ease-in-out infinite alternate',
  },
  heroOverlay: {
    position: 'relative', minHeight: '420px',
    background: 'linear-gradient(to bottom, rgba(20,15,10,0.35) 0%, rgba(20,15,10,0.5) 50%, rgba(20,15,10,0.85) 100%)',
    display: 'flex', flexDirection: 'column',
  },
  heroTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 20px',
  },
  heroLogoRow: {
    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
  },
  heroLogoIcon: { width: '34px', height: '34px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' },
  heroLogoText: {
    fontSize: '1.4rem', fontWeight: '700', color: '#fff',
    fontFamily: 'Georgia, serif', letterSpacing: '0.01em',
    textShadow: '0 2px 6px rgba(0,0,0,0.4)',
  },
  signOutBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },

  heroContent: {
    padding: '40px 24px 56px', flex: 1, display: 'flex',
    flexDirection: 'column', justifyContent: 'flex-end',
    animation: 'fadeSlideUp 0.6s ease-out',
  },
  greeting: { fontSize: '1.05rem', color: 'rgba(255,255,255,0.9)', fontWeight: '500', textShadow: '0 2px 6px rgba(0,0,0,0.4)' },
  greetingName: {
    fontSize: '2.8rem', color: '#fff', fontFamily: 'Georgia, serif',
    fontWeight: '700', lineHeight: '1.1', marginTop: '4px',
    textShadow: '0 2px 12px rgba(0,0,0,0.4)',
  },
  tagline: {
    fontSize: '0.98rem', color: '#f0d9b8', fontStyle: 'italic',
    marginTop: '14px', fontFamily: 'Georgia, serif',
    textShadow: '0 2px 6px rgba(0,0,0,0.4)', letterSpacing: '0.01em',
  },

  /* BODY */
  body: { maxWidth: '720px', margin: '0 auto', padding: '24px 16px 48px' },

  /* Status card */
  statusCard: {
    backgroundColor: '#fff', borderRadius: '14px', padding: '18px 20px',
    border: '1px solid #ebe5dc', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    cursor: 'pointer', marginBottom: '20px',
  },
  statusBadge: {
    display: 'inline-block', backgroundColor: '#7a8a5a', color: '#fff',
    padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem',
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px',
  },
  statusTitle: { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', marginBottom: '4px' },
  statusLoc: { fontSize: '0.9rem', color: '#666', marginBottom: '8px' },
  statusHint: { fontSize: '0.85rem', color: '#b09070', fontWeight: '600' },

  /* Sections */
  section: { marginBottom: '24px' },
  sectionLabel: { fontSize: '0.72rem', fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' },

  /* Smart photo card (handles any aspect ratio) */
  smartCard: {
    position: 'relative', height: '280px', borderRadius: '16px',
    overflow: 'hidden', cursor: 'pointer', backgroundColor: '#1a1a1a',
    boxShadow: '0 6px 20px rgba(0,0,0,0.12)', marginBottom: '12px',
  },
  smartCardBlurBg: {
    position: 'absolute', inset: '-10px',
    backgroundSize: 'cover', backgroundPosition: 'center',
    filter: 'blur(28px) brightness(0.7) saturate(1.1)',
    transform: 'scale(1.1)',
  },
  smartCardImg: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%', objectFit: 'contain',
  },
  smartCardFallback: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(135deg, #c89060 0%, #2d4a8a 100%)',
  },
  smartCardOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(0,0,0,0.85) 100%)',
    padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
  },
  memoryYears: { fontSize: '0.78rem', color: '#c89060', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' },
  memoryTitle: { fontSize: '1.6rem', color: '#fff', fontFamily: 'Georgia, serif', fontWeight: '700', lineHeight: '1.2' },
  memoryLoc: { fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', marginTop: '6px' },
  memoryCta: { fontSize: '0.85rem', color: '#fff', fontWeight: '600', marginTop: '12px' },

  /* Quote */
  quoteCard: {
    backgroundColor: '#fff', borderRadius: '14px', padding: '24px',
    border: '1px solid #ebe5dc', textAlign: 'center', marginBottom: '24px',
  },
  quoteMark: { fontSize: '2.5rem', color: '#c89060', fontFamily: 'Georgia, serif', lineHeight: '0.5', marginBottom: '4px' },
  quoteText: { fontSize: '1rem', color: '#444', lineHeight: '1.7', fontStyle: 'italic', fontFamily: 'Georgia, serif' },
  quoteAuthor: { fontSize: '0.78rem', color: '#999', marginTop: '12px', fontWeight: '600' },

  /* Stats */
  statsGrid: { display: 'flex', gap: '10px' },
  stat: {
    flex: 1, backgroundColor: '#fff', borderRadius: '12px',
    padding: '16px 12px', textAlign: 'center', border: '1px solid #ebe5dc',
  },
  statNumber: { fontSize: '1.8rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', lineHeight: 1 },
  statLabel: { fontSize: '0.72rem', color: '#999', marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },

  /* CTAs */
  actionsRow: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' },
  primaryAction: {
    backgroundColor: '#1a1a1a', color: '#fff', border: 'none',
    borderRadius: '12px', padding: '16px', fontSize: '1rem',
    fontWeight: '700', cursor: 'pointer',
  },
  secondaryAction: {
    backgroundColor: 'transparent', color: '#1a1a1a',
    border: '1.5px solid #1a1a1a', borderRadius: '12px',
    padding: '14px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer',
  },

  /* Empty state */
  emptyState: { textAlign: 'center', padding: '40px 16px' },
  emptyEmoji: { fontSize: '3rem', marginBottom: '16px' },
  emptyHeading: { fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', marginBottom: '8px' },
  emptyText: { fontSize: '0.95rem', color: '#666', lineHeight: '1.7', maxWidth: '420px', margin: '0 auto 28px' },
  emptyArrow: { fontSize: '0.85rem', fontWeight: '700', color: '#c89060', letterSpacing: '0.1em' },
}
