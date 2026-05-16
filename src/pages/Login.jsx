import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '../firebase'

const HERO_PHOTOS = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
  'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=1600&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80',
  'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=1600&q=80',
  'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1600&q=80',
]

export default function Login() {
  const [heroPhoto] = useState(() => HERO_PHOTOS[Math.floor(Math.random() * HERO_PHOTOS.length)])

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  return (
    <div style={s.container}>

      {/* HERO */}
      <div style={s.hero}>
        <div style={{ ...s.heroBg, backgroundImage: `url(${heroPhoto})` }} />
        <div style={s.heroOverlay}>
          <div style={s.heroTop}>
            <div style={s.logoRow}>
              <img src="/logo-icon.png" alt="" style={s.logoIcon} />
              <span style={s.logoText}>Mosaic</span>
            </div>
          </div>

          <div style={s.heroContent}>
            <p style={s.eyebrow}>Travel memories, kept beautifully</p>
            <h1 style={s.headline}>Many pieces.<br/>One unforgettable trip.</h1>
            <p style={s.subhead}>
              The shared trip diary for families and close friends.
              Capture every member's perspective. Get a magazine-quality recap at the end.
            </p>
            <button onClick={handleGoogleSignIn} style={s.primaryBtn}>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt=""
                style={{ width: 20, height: 20, marginRight: 10 }}
              />
              Sign in with Google to start
            </button>
            <p style={s.heroFinePrint}>Free for friends and family · No app to download</p>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section style={s.section}>
        <p style={s.sectionTag}>How it works</p>
        <h2 style={s.sectionTitle}>Three steps. That's it.</h2>

        <div style={s.steps}>
          <Step
            num="01"
            color="#c89060"
            bg="#fbeede"
            icon="🌍"
            title="Create a trip"
            text="Name it, pick where you're going, and invite your travel group with one link. No accounts needed to view."
          />
          <Step
            num="02"
            color="#7a8a5a"
            bg="#eef0e8"
            icon="✍️"
            title="Each person adds their day"
            text="Photos, words, location — every member captures their own version of the same day. Toggle between perspectives to see the trip through every eye."
          />
          <Step
            num="03"
            color="#2d4a8a"
            bg="#e3eaf5"
            icon="✨"
            title="Get a beautiful AI recap"
            text="When the trip ends, Mosaic writes a magazine-quality story. Download a PDF or share a beautiful web link on WhatsApp."
          />
        </div>
      </section>

      {/* DIFFERENTIATOR */}
      <section style={{ ...s.section, backgroundColor: '#1a1a1a', color: '#fff' }}>
        <p style={{ ...s.sectionTag, color: '#c89060' }}>What makes it different</p>
        <h2 style={{ ...s.sectionTitle, color: '#fff' }}>Same trip. Every eye.</h2>
        <p style={s.diffText}>
          Most travel apps reduce a trip to one person's highlight reel.
          Mosaic captures <em>everyone's</em>. The same beach sunset, through your eyes, your partner's,
          your best friend's. Side by side. Honest, layered, alive.
        </p>
        <p style={s.diffQuote}>
          "The trip you remember isn't the one you photographed. It's the one you lived together."
        </p>
      </section>

      {/* WHO IT'S FOR */}
      <section style={s.section}>
        <p style={s.sectionTag}>Made for</p>
        <h2 style={s.sectionTitle}>The people you actually travel with.</h2>
        <div style={s.audienceGrid}>
          <div style={s.audienceCard}>👨‍👩‍👧 Families on annual trips</div>
          <div style={s.audienceCard}>👫 Couples traveling with couples</div>
          <div style={s.audienceCard}>👯 Old friend groups reuniting</div>
          <div style={s.audienceCard}>🎉 Milestone celebrations & weddings</div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ ...s.section, ...s.finalCta }}>
        <h2 style={s.ctaTitle}>Ready for your next trip?</h2>
        <p style={s.ctaText}>Sign in with Google to create your first trip. Takes 30 seconds.</p>
        <button onClick={handleGoogleSignIn} style={s.primaryBtn}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt=""
            style={{ width: 20, height: 20, marginRight: 10 }}
          />
          Sign in with Google
        </button>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <img src="/logo-icon.png" alt="" style={s.footerIcon} />
        <p style={s.footerName}>Mosaic</p>
        <p style={s.footerTag}>Many pieces. One unforgettable trip.</p>
      </footer>
    </div>
  )
}

function Step({ num, color, bg, icon, title, text }) {
  return (
    <div style={s.stepCard}>
      <div style={{ ...s.stepIcon, backgroundColor: bg, color }}>{icon}</div>
      <p style={{ ...s.stepNum, color }}>{num}</p>
      <h3 style={s.stepTitle}>{title}</h3>
      <p style={s.stepText}>{text}</p>
    </div>
  )
}

const s = {
  container: { backgroundColor: '#faf7f2', minHeight: '100vh' },

  /* HERO */
  hero: { position: 'relative', minHeight: '92vh', overflow: 'hidden', backgroundColor: '#1a1a1a' },
  heroBg: {
    position: 'absolute', inset: 0,
    backgroundSize: 'cover', backgroundPosition: 'center',
    animation: 'kenBurns 30s ease-in-out infinite alternate',
  },
  heroOverlay: {
    position: 'relative', minHeight: '92vh',
    background: 'linear-gradient(to bottom, rgba(20,15,10,0.4) 0%, rgba(20,15,10,0.55) 40%, rgba(20,15,10,0.92) 100%)',
    display: 'flex', flexDirection: 'column',
  },
  heroTop: { padding: '20px 24px' },
  logoRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: { width: '36px', height: '36px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' },
  logoText: {
    fontSize: '1.4rem', fontWeight: '700', color: '#fff',
    fontFamily: 'Georgia, serif', textShadow: '0 2px 6px rgba(0,0,0,0.4)',
  },

  heroContent: {
    flex: 1, padding: '32px 24px 64px',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    maxWidth: '640px', animation: 'fadeSlideUp 0.7s ease-out',
  },
  eyebrow: {
    display: 'inline-block', alignSelf: 'flex-start',
    fontSize: '0.78rem', fontWeight: '700', color: '#f0d9b8',
    textTransform: 'uppercase', letterSpacing: '0.18em',
    marginBottom: '20px', textShadow: '0 2px 6px rgba(0,0,0,0.4)',
  },
  headline: {
    fontSize: 'clamp(2.2rem, 6vw, 3.4rem)', color: '#fff',
    fontFamily: 'Georgia, serif', fontWeight: '700', lineHeight: '1.05',
    textShadow: '0 2px 14px rgba(0,0,0,0.4)', marginBottom: '20px',
  },
  subhead: {
    fontSize: '1.05rem', color: 'rgba(255,255,255,0.92)', lineHeight: '1.7',
    maxWidth: '480px', marginBottom: '32px',
    textShadow: '0 1px 6px rgba(0,0,0,0.4)',
  },

  primaryBtn: {
    display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center',
    padding: '15px 28px', backgroundColor: '#fff', color: '#1a1a1a',
    border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '700',
    cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
  },
  heroFinePrint: { fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginTop: '14px' },

  /* SECTIONS */
  section: { padding: '72px 24px', maxWidth: '960px', margin: '0 auto' },
  sectionTag: {
    fontSize: '0.78rem', fontWeight: '700', color: '#c89060',
    textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px', textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontFamily: 'Georgia, serif',
    fontWeight: '700', color: '#1a1a1a', textAlign: 'center', lineHeight: '1.2', marginBottom: '48px',
  },

  /* HOW IT WORKS */
  steps: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' },
  stepCard: {
    backgroundColor: '#fff', borderRadius: '18px', padding: '28px 24px',
    border: '1px solid #ebe5dc', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  stepIcon: {
    width: '56px', height: '56px', borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.8rem', marginBottom: '16px',
  },
  stepNum: {
    fontSize: '0.78rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px',
  },
  stepTitle: { fontSize: '1.25rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', marginBottom: '10px' },
  stepText: { fontSize: '0.95rem', color: '#555', lineHeight: '1.7' },

  /* DIFFERENTIATOR */
  diffText: {
    fontSize: '1.1rem', color: 'rgba(255,255,255,0.85)', lineHeight: '1.9',
    textAlign: 'center', maxWidth: '700px', margin: '0 auto 32px',
  },
  diffQuote: {
    fontSize: '1rem', color: '#c89060', fontStyle: 'italic',
    textAlign: 'center', maxWidth: '600px', margin: '0 auto',
    fontFamily: 'Georgia, serif', lineHeight: '1.7',
  },

  /* AUDIENCE */
  audienceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' },
  audienceCard: {
    backgroundColor: '#fff', borderRadius: '14px', padding: '20px',
    border: '1px solid #ebe5dc', fontSize: '1rem', color: '#1a1a1a',
    fontWeight: '600', textAlign: 'center', fontFamily: 'Georgia, serif',
  },

  /* FINAL CTA */
  finalCta: { textAlign: 'center', backgroundColor: '#fbeede' },
  ctaTitle: { fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontFamily: 'Georgia, serif', fontWeight: '700', color: '#1a1a1a', marginBottom: '14px' },
  ctaText: { fontSize: '1rem', color: '#5a4830', marginBottom: '28px', lineHeight: '1.7' },

  /* FOOTER */
  footer: {
    textAlign: 'center', padding: '48px 24px', borderTop: '1px solid #ebe5dc',
    backgroundColor: '#faf7f2',
  },
  footerIcon: { width: '40px', height: '40px', objectFit: 'contain', marginBottom: '10px' },
  footerName: { fontSize: '1.1rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', marginBottom: '4px' },
  footerTag: { fontSize: '0.85rem', color: '#b09070', fontStyle: 'italic' },
}
