import { useState, useEffect } from 'react'

const STEPS = [
  {
    icon: '🌍',
    title: 'Create a trip',
    text: 'Name it, pick where you\'re going, and invite your travel group with one link.',
    accent: '#c89060',
  },
  {
    icon: '✍️',
    title: 'Capture each day',
    text: 'Everyone adds their own diary entry — words, photos, and location. Each member has their own perspective of the same trip.',
    accent: '#7a8a5a',
  },
  {
    icon: '✨',
    title: 'Generate a beautiful recap',
    text: 'When the trip ends, let AI write a magazine-quality story. Share it via WhatsApp or as a public web link.',
    accent: '#2d4a8a',
  },
]

export default function WelcomeModal({ user }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  const storageKey = `mosaic_welcomed_${user?.uid}`

  useEffect(() => {
    if (!user?.uid) return
    const welcomed = localStorage.getItem(storageKey)
    if (!welcomed) setOpen(true)
  }, [user?.uid, storageKey])

  const close = () => {
    localStorage.setItem(storageKey, '1')
    setOpen(false)
  }

  if (!open) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div style={s.backdrop} onClick={close}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <button onClick={close} style={s.skip}>Skip</button>

        <div style={s.body}>
          <div style={{ ...s.iconCircle, backgroundColor: `${current.accent}22`, color: current.accent }}>
            {current.icon}
          </div>

          <p style={{ ...s.tag, color: current.accent }}>Step {step + 1} of {STEPS.length}</p>

          <h2 style={s.title}>{current.title}</h2>
          <p style={s.text}>{current.text}</p>
        </div>

        <div style={s.dots}>
          {STEPS.map((_, i) => (
            <span key={i} style={{ ...s.dot, backgroundColor: i === step ? current.accent : '#ddd' }} />
          ))}
        </div>

        <div style={s.btnRow}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={s.backBtn}>← Back</button>
          )}
          {!isLast ? (
            <button onClick={() => setStep(s => s + 1)} style={{ ...s.nextBtn, backgroundColor: current.accent }}>
              Next
            </button>
          ) : (
            <button onClick={close} style={{ ...s.nextBtn, background: 'linear-gradient(135deg, #c89060 0%, #2d4a8a 100%)' }}>
              ✨ &nbsp; Get started
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 2000,
    background: 'rgba(20,15,10,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', animation: 'fadeIn 0.25s',
  },
  modal: {
    backgroundColor: '#fff', borderRadius: '20px',
    maxWidth: '420px', width: '100%', padding: '32px 28px 28px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.2)', position: 'relative',
    animation: 'fadeSlideUp 0.35s ease-out',
  },
  skip: {
    position: 'absolute', top: '14px', right: '16px',
    background: 'none', border: 'none', color: '#aaa',
    fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600',
  },
  body: { textAlign: 'center', padding: '12px 4px 24px' },
  iconCircle: {
    width: '88px', height: '88px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '2.6rem', margin: '0 auto 20px',
  },
  tag: {
    fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: '0.15em', marginBottom: '12px',
  },
  title: {
    fontSize: '1.7rem', fontWeight: '700', color: '#1a1a1a',
    fontFamily: 'Georgia, serif', marginBottom: '10px', lineHeight: '1.2',
  },
  text: {
    fontSize: '1rem', color: '#555', lineHeight: '1.65',
    maxWidth: '340px', margin: '0 auto',
  },
  dots: { display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', transition: 'background-color 0.2s' },
  btnRow: { display: 'flex', gap: '10px' },
  backBtn: {
    flex: 1, padding: '14px', backgroundColor: 'transparent',
    border: '1.5px solid #ddd', borderRadius: '12px',
    fontSize: '0.95rem', fontWeight: '600', color: '#555', cursor: 'pointer',
  },
  nextBtn: {
    flex: 2, padding: '14px', color: '#fff',
    border: 'none', borderRadius: '12px',
    fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
  },
}
