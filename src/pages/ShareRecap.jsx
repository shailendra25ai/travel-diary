import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { jsPDF } from 'jspdf'

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ShareRecap() {
  const { shareCode } = useParams()
  const [recap, setRecap] = useState(null)
  const [recapData, setRecapData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

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

  if (loading) return <div style={s.center}><p style={{ color: '#888' }}>Loading your trip recap...</p></div>
  if (!recap) return <div style={s.center}><p style={{ color: '#888' }}>This recap link is invalid or has expired.</p></div>

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadPDF = () => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const margin = 20, pageWidth = 210
    const contentWidth = pageWidth - margin * 2
    let y = margin
    const addText = (text, fontSize, fontStyle, color, lhMult = 1.4) => {
      pdf.setFontSize(fontSize)
      pdf.setFont('helvetica', fontStyle)
      pdf.setTextColor(...color)
      const lines = pdf.splitTextToSize(text, contentWidth)
      const lh = fontSize * 0.352778 * lhMult
      if (y + lines.length * lh > 280) { pdf.addPage(); y = margin }
      pdf.text(lines, margin, y)
      y += lines.length * lh + 2
    }
    addText(recap.title, 22, 'bold', [26, 26, 26]); y += 2
    addText(recapData.tripTitle, 12, 'normal', [150, 150, 150]); y += 8
    pdf.setDrawColor(220, 220, 220); pdf.line(margin, y, pageWidth - margin, y); y += 8
    addText(recap.summary, 11, 'normal', [60, 60, 60]); y += 10
    if (recap.days?.length > 0) {
      recap.days.forEach(day => {
        addText(formatDate(day.date), 9, 'bold', [180, 150, 120]); y += 1
        addText(day.caption, 11, 'normal', [60, 60, 60]); y += 8
      })
    }
    pdf.setDrawColor(220, 220, 220); pdf.line(margin, y, pageWidth - margin, y); y += 8
    addText(recap.closing, 11, 'italic', [80, 80, 80]); y += 16
    addText('Made with Travel Diary', 8, 'normal', [200, 200, 200])
    pdf.save(`${recapData.tripTitle} — Travel Diary Recap.pdf`)
  }

  // Build day data with photos and AI captions
  const entriesByDay = {}
  recapData?.entries?.forEach(e => {
    if (!entriesByDay[e.date]) entriesByDay[e.date] = []
    entriesByDay[e.date].push(e)
  })
  const sortedDates = Object.keys(entriesByDay).sort()
  const captionByDate = {}
  recap.days?.forEach(d => { captionByDate[d.date] = d.caption })
  const isMulti = recapData?.mode === 'multi'
  const template = recapData?.template || 'magazine'

  const days = sortedDates.map((date, i) => ({
    date,
    dayLabel: `Day ${i + 1}`,
    entries: entriesByDay[date],
    aiCaption: captionByDate[date],
    photos: entriesByDay[date].flatMap(e => e.photoURLs || []),
  }))

  const allPhotos = recapData?.entries?.flatMap(e => e.photoURLs || []) || []
  const coverPhoto = allPhotos[0] || null
  const memberList = isMulti
    ? [...new Map(recapData.entries.map(e => [e.userId, e])).values()]
    : []

  const sharedProps = { recap, recapData, days, isMulti, coverPhoto, memberList }

  return (
    <div style={s.container}>

      {/* Action bar */}
      <div style={s.actionBar}>
        <p style={s.actionLogo}>Travel Diary</p>
        <div style={s.actionBtns}>
          <button onClick={handleCopyLink} style={s.actionBtn}>
            {copied ? '✓ Copied' : '🔗 Copy link'}
          </button>
          <button onClick={handleDownloadPDF} style={s.actionBtnPrimary}>
            ⬇ Download PDF
          </button>
        </div>
      </div>

      {template === 'magazine' && <MagazineTemplate {...sharedProps} />}
      {template === 'storybook' && <StorybookTemplate {...sharedProps} />}
      {template === 'polaroid' && <PolaroidTemplate {...sharedProps} />}

      <Branding />
    </div>
  )
}

/* ========= MAGAZINE ========= */
function MagazineTemplate({ recap, recapData, days, isMulti, coverPhoto, memberList }) {
  return (
    <>
      {coverPhoto ? (
        <div style={{ ...s.heroMag, backgroundImage: `url(${coverPhoto})` }}>
          <div style={s.heroOverlay}>
            <p style={s.heroTripName}>{recapData?.tripTitle}</p>
            <h1 style={s.heroTitle}>{recap.title}</h1>
            {isMulti && memberList.length > 0 && (
              <div style={s.heroMembers}>
                {memberList.map((m, i) => <img key={i} src={m.userPhoto} alt={m.userName} style={s.heroAv} />)}
                <span style={s.heroMembersText}>
                  Through {memberList.map(m => m.userName.split(' ')[0]).join(' & ')}'s eyes
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={s.heroPlain}>
          <p style={s.heroTripNameDark}>{recapData?.tripTitle}</p>
          <h1 style={s.heroTitleDark}>{recap.title}</h1>
        </div>
      )}

      <div style={s.body}>
        <p style={s.summaryMag}>{recap.summary}</p>

        {days.map((day, i) => (
          <div key={day.date} style={s.dayMag}>
            <div style={s.dayMagHeader}>
              <p style={s.dayMagLabel}>{day.dayLabel}</p>
              <p style={s.dayMagDate}>{formatDate(day.date)}</p>
            </div>
            {day.aiCaption && <p style={s.dayMagCaption}>{day.aiCaption}</p>}
            {day.photos.length > 0 && <PhotoCollage photos={day.photos} />}
            {isMulti && day.entries.length > 1 && (
              <div style={s.perspGrid}>
                {day.entries.map((e, j) => <PerspCard key={j} entry={e} />)}
              </div>
            )}
            {(!isMulti || day.entries.length <= 1) && day.entries[0]?.text && (
              <SingleEntryBox entry={day.entries[0]} />
            )}
          </div>
        ))}

        <div style={s.closingBox}>
          <p style={s.closingMark}>~</p>
          <p style={s.closing}>{recap.closing}</p>
        </div>
      </div>
    </>
  )
}

/* ========= STORYBOOK ========= */
function StorybookTemplate({ recap, recapData, days, isMulti, coverPhoto, memberList }) {
  return (
    <>
      {coverPhoto ? (
        <div style={{ ...s.heroStory, backgroundImage: `url(${coverPhoto})` }}>
          <div style={s.heroStoryOverlay}>
            <p style={s.heroTripName}>{recapData?.tripTitle}</p>
            <h1 style={s.heroStoryTitle}>{recap.title}</h1>
          </div>
        </div>
      ) : (
        <div style={s.heroPlain}>
          <h1 style={s.heroTitleDark}>{recap.title}</h1>
        </div>
      )}

      <div style={s.bodyStory}>
        <p style={s.summaryStory}>{recap.summary}</p>

        {days.map((day, i) => {
          const photoFirst = i % 2 === 0
          return (
            <div key={day.date} style={s.dayStory}>
              <div style={s.dayStoryHeader}>
                <p style={s.dayStoryLabel}>{day.dayLabel}</p>
                <p style={s.dayStoryDate}>{formatDate(day.date)}</p>
              </div>
              <div style={s.storyRow}>
                {photoFirst && day.photos.length > 0 && (
                  <div style={s.storyPhotoCol}>
                    <PhotoCollage photos={day.photos} />
                  </div>
                )}
                <div style={s.storyTextCol}>
                  {day.aiCaption && <p style={s.storyCaption}>{day.aiCaption}</p>}
                  {isMulti && day.entries.length > 1 && (
                    <div style={s.storyPersp}>
                      {day.entries.map((e, j) => (
                        <div key={j} style={s.storyPerspBlock}>
                          <div style={s.storyPerspHead}>
                            <img src={e.userPhoto} alt="" style={s.storyPerspAv} />
                            <span style={s.storyPerspName}>{e.userName.split(' ')[0]}</span>
                          </div>
                          {e.text && <p style={s.storyPerspText}>"{e.text}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {(!isMulti || day.entries.length <= 1) && day.entries[0]?.text && (
                    <p style={s.storyText}>"{day.entries[0].text}"</p>
                  )}
                </div>
                {!photoFirst && day.photos.length > 0 && (
                  <div style={s.storyPhotoCol}>
                    <PhotoCollage photos={day.photos} />
                  </div>
                )}
              </div>
            </div>
          )
        })}

        <div style={s.closingBox}>
          <p style={s.closingMark}>~</p>
          <p style={s.closing}>{recap.closing}</p>
        </div>
      </div>
    </>
  )
}

/* ========= POLAROID SCRAPBOOK ========= */
function PolaroidTemplate({ recap, recapData, days, isMulti, coverPhoto, memberList }) {
  return (
    <div style={s.polaroidWrap}>
      <div style={s.polaroidHeader}>
        <p style={s.polaroidTripName}>{recapData?.tripTitle}</p>
        <h1 style={s.polaroidTitle}>{recap.title}</h1>
        <p style={s.polaroidSummary}>{recap.summary}</p>
      </div>

      <div style={s.polaroidBody}>
        {days.map((day, i) => (
          <div key={day.date} style={s.polaroidDay}>
            <div style={s.polaroidDateTag}>
              <p style={s.polaroidDateText}>{day.dayLabel} · {formatDate(day.date)}</p>
            </div>

            {day.aiCaption && (
              <div style={s.polaroidCaption}>
                <p style={s.polaroidCaptionText}>{day.aiCaption}</p>
              </div>
            )}

            <div style={s.polaroidPhotosWrap}>
              {day.photos.slice(0, 6).map((url, j) => {
                const rotations = [-5, 3, -2, 4, -3, 2]
                const rot = rotations[j % rotations.length]
                return (
                  <div key={j} style={{ ...s.polaroid, transform: `rotate(${rot}deg)` }}>
                    <img src={url} alt="" style={s.polaroidImg} />
                  </div>
                )
              })}
            </div>

            {isMulti && day.entries.length > 1 && (
              <div style={s.polaroidPersp}>
                {day.entries.map((e, j) => (
                  <div key={j} style={s.polaroidNote}>
                    <div style={s.polaroidNoteHead}>
                      <img src={e.userPhoto} alt="" style={s.polaroidNoteAv} />
                      <span style={s.polaroidNoteName}>{e.userName.split(' ')[0]}</span>
                    </div>
                    {e.text && <p style={s.polaroidNoteText}>"{e.text}"</p>}
                  </div>
                ))}
              </div>
            )}
            {(!isMulti || day.entries.length <= 1) && day.entries[0]?.text && (
              <div style={s.polaroidNote}>
                <div style={s.polaroidNoteHead}>
                  <img src={day.entries[0].userPhoto} alt="" style={s.polaroidNoteAv} />
                  <span style={s.polaroidNoteName}>{day.entries[0].userName.split(' ')[0]}</span>
                </div>
                <p style={s.polaroidNoteText}>"{day.entries[0].text}"</p>
              </div>
            )}
          </div>
        ))}

        <div style={s.polaroidClose}>
          <p style={s.closing}>{recap.closing}</p>
        </div>
      </div>
    </div>
  )
}

/* ========= SHARED COMPONENTS ========= */
function PhotoCollage({ photos }) {
  const count = photos.length
  if (count === 1) return <div style={s.collage}><img src={photos[0]} alt="" style={s.cFull} /></div>
  if (count === 2) return (
    <div style={s.collage}>
      <div style={s.cRow}>
        <img src={photos[0]} alt="" style={s.cHalf} />
        <img src={photos[1]} alt="" style={s.cHalf} />
      </div>
    </div>
  )
  if (count === 3) return (
    <div style={s.collage}>
      <img src={photos[0]} alt="" style={s.cTopWide} />
      <div style={s.cRow}>
        <img src={photos[1]} alt="" style={s.cHalf} />
        <img src={photos[2]} alt="" style={s.cHalf} />
      </div>
    </div>
  )
  return (
    <div style={s.collage}>
      <div style={s.cRow}><img src={photos[0]} alt="" style={s.cHalf} /><img src={photos[1]} alt="" style={s.cHalf} /></div>
      <div style={s.cRow}><img src={photos[2]} alt="" style={s.cHalf} /><img src={photos[3]} alt="" style={s.cHalf} /></div>
      {count > 4 && <p style={s.morePhotos}>+ {count - 4} more</p>}
    </div>
  )
}

function PerspCard({ entry }) {
  return (
    <div style={s.perspCard}>
      <div style={s.perspHead}>
        <img src={entry.userPhoto} alt="" style={s.perspAv} />
        <div>
          <p style={s.perspName}>{entry.userName.split(' ')[0]}</p>
          {entry.location && <p style={s.perspLoc}>📍 {entry.location}</p>}
        </div>
      </div>
      {entry.photoURLs?.[0] && <img src={entry.photoURLs[0]} alt="" style={s.perspPhoto} />}
      {entry.text && <p style={s.perspText}>"{entry.text}"</p>}
    </div>
  )
}

function SingleEntryBox({ entry }) {
  return (
    <div style={s.singleBox}>
      <div style={s.singleHead}>
        <img src={entry.userPhoto} alt="" style={s.singleAv} />
        <span style={s.singleName}>{entry.userName.split(' ')[0]}</span>
        {entry.location && <span style={s.singleLoc}>· 📍 {entry.location}</span>}
      </div>
      <p style={s.singleText}>"{entry.text}"</p>
    </div>
  )
}

function Branding() {
  return (
    <div style={s.brandingWrap}>
      <p style={s.branding}>Made with Travel Diary</p>
      <p style={s.brandingHint}>Capture your trips together and relive them forever</p>
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', backgroundColor: '#faf7f2', fontFamily: 'system-ui, -apple-system, sans-serif' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '24px', textAlign: 'center' },

  /* Action bar */
  actionBar: {
    position: 'sticky', top: 0, zIndex: 10,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px', backgroundColor: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)', borderBottom: '1px solid #ebe5dc',
  },
  actionLogo: { fontSize: '1rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', margin: 0 },
  actionBtns: { display: 'flex', gap: '8px' },
  actionBtn: {
    padding: '8px 14px', backgroundColor: '#fff', border: '1.5px solid #ddd',
    borderRadius: '20px', fontSize: '0.85rem', color: '#333', cursor: 'pointer', fontWeight: '500',
  },
  actionBtnPrimary: {
    padding: '8px 14px', backgroundColor: '#1a1a1a', border: 'none',
    borderRadius: '20px', fontSize: '0.85rem', color: '#fff', cursor: 'pointer', fontWeight: '600',
  },

  /* MAGAZINE template */
  heroMag: { width: '100%', height: '500px', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
  heroOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.85) 100%)',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '40px 24px',
  },
  heroTripName: { fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px', fontWeight: '500' },
  heroTitle: { fontSize: '2.6rem', fontWeight: '700', color: '#fff', fontFamily: 'Georgia, serif', lineHeight: '1.15', margin: 0, maxWidth: '700px' },
  heroMembers: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', flexWrap: 'wrap' },
  heroAv: { width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #fff' },
  heroMembersText: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', marginLeft: '4px' },

  heroPlain: { backgroundColor: '#1a1a1a', padding: '64px 24px', textAlign: 'center' },
  heroTripNameDark: { fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' },
  heroTitleDark: { fontSize: '2.4rem', fontWeight: '700', color: '#fff', fontFamily: 'Georgia, serif', lineHeight: '1.2', margin: 0 },

  body: { maxWidth: '720px', margin: '0 auto', padding: '0 16px' },
  summaryMag: { fontSize: '1.15rem', color: '#444', lineHeight: '1.85', fontStyle: 'italic', fontFamily: 'Georgia, serif', textAlign: 'center', padding: '48px 8px 32px', borderBottom: '1px solid #ebe5dc' },

  dayMag: { padding: '40px 0', borderBottom: '1px solid #ebe5dc' },
  dayMagHeader: { display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  dayMagLabel: { fontSize: '1.4rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif' },
  dayMagDate: { fontSize: '0.78rem', fontWeight: '600', color: '#b09070', textTransform: 'uppercase', letterSpacing: '0.1em' },
  dayMagCaption: { fontSize: '1.05rem', color: '#333', lineHeight: '1.85', marginBottom: '24px' },

  /* STORYBOOK template */
  heroStory: { width: '100%', height: '420px', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
  heroStoryOverlay: {
    position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(60,40,20,0.1) 0%, rgba(60,40,20,0.7) 100%)',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '40px 24px', textAlign: 'center', alignItems: 'center',
  },
  heroStoryTitle: { fontSize: '2.4rem', fontWeight: '700', color: '#fff', fontFamily: 'Georgia, serif', lineHeight: '1.2', margin: 0 },

  bodyStory: { maxWidth: '900px', margin: '0 auto', padding: '0 16px' },
  summaryStory: { fontSize: '1.15rem', color: '#5a4830', lineHeight: '1.85', fontStyle: 'italic', fontFamily: 'Georgia, serif', textAlign: 'center', padding: '48px 24px 40px', maxWidth: '600px', margin: '0 auto' },

  dayStory: { padding: '32px 0', borderBottom: '1px dashed #d8cfc0' },
  dayStoryHeader: { textAlign: 'center', marginBottom: '24px' },
  dayStoryLabel: { fontSize: '1.5rem', fontWeight: '700', color: '#5a4830', fontFamily: 'Georgia, serif', marginBottom: '4px' },
  dayStoryDate: { fontSize: '0.78rem', fontWeight: '600', color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.1em' },

  storyRow: { display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' },
  storyPhotoCol: { flex: '1 1 320px' },
  storyTextCol: { flex: '1 1 280px' },
  storyCaption: { fontSize: '1.05rem', color: '#444', lineHeight: '1.85', fontFamily: 'Georgia, serif', marginBottom: '16px' },
  storyText: { fontSize: '0.95rem', color: '#666', lineHeight: '1.8', fontStyle: 'italic' },
  storyPersp: { display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' },
  storyPerspBlock: { borderLeft: '3px solid #c89060', paddingLeft: '14px' },
  storyPerspHead: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  storyPerspAv: { width: '26px', height: '26px', borderRadius: '50%' },
  storyPerspName: { fontSize: '0.85rem', fontWeight: '700', color: '#5a4830' },
  storyPerspText: { fontSize: '0.92rem', color: '#666', lineHeight: '1.7', fontStyle: 'italic' },

  /* POLAROID template */
  polaroidWrap: { backgroundColor: '#f0e8d8', minHeight: '100vh', backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(200,144,96,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(200,144,96,0.08) 0%, transparent 50%)' },
  polaroidHeader: { textAlign: 'center', padding: '60px 24px 32px' },
  polaroidTripName: { fontSize: '0.78rem', color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '10px' },
  polaroidTitle: { fontSize: '2.4rem', fontWeight: '700', color: '#3a2a1a', fontFamily: 'Georgia, serif', lineHeight: '1.2', marginBottom: '20px' },
  polaroidSummary: { fontSize: '1.05rem', color: '#5a4830', lineHeight: '1.85', fontStyle: 'italic', fontFamily: 'Georgia, serif', maxWidth: '560px', margin: '0 auto' },

  polaroidBody: { maxWidth: '760px', margin: '0 auto', padding: '0 16px 48px' },
  polaroidDay: { padding: '40px 0', borderBottom: '1px dashed #c89060' },
  polaroidDateTag: { display: 'inline-block', backgroundColor: '#fff', padding: '6px 14px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', marginBottom: '20px', transform: 'rotate(-1deg)' },
  polaroidDateText: { fontSize: '0.85rem', color: '#5a4830', fontWeight: '600', fontFamily: 'Georgia, serif' },

  polaroidCaption: { backgroundColor: '#fff8e8', padding: '16px 18px', borderRadius: '4px', marginBottom: '24px', borderLeft: '3px solid #c89060', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  polaroidCaptionText: { fontSize: '1rem', color: '#3a2a1a', lineHeight: '1.8', fontFamily: 'Georgia, serif', fontStyle: 'italic' },

  polaroidPhotosWrap: {
    display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center',
    padding: '20px 0 32px',
  },
  polaroid: {
    backgroundColor: '#fff', padding: '10px 10px 36px', boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
    transition: 'transform 0.2s',
  },
  polaroidImg: { width: '180px', height: '180px', objectFit: 'cover', display: 'block' },

  polaroidPersp: { display: 'flex', flexDirection: 'column', gap: '12px' },
  polaroidNote: {
    backgroundColor: '#fff', padding: '14px 16px', borderRadius: '2px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)', borderLeft: '3px solid #c89060',
  },
  polaroidNoteHead: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  polaroidNoteAv: { width: '28px', height: '28px', borderRadius: '50%' },
  polaroidNoteName: { fontSize: '0.88rem', fontWeight: '700', color: '#5a4830' },
  polaroidNoteText: { fontSize: '0.95rem', color: '#3a2a1a', lineHeight: '1.7', fontStyle: 'italic', fontFamily: 'Georgia, serif' },

  polaroidClose: { textAlign: 'center', padding: '40px 16px' },

  /* Photo collage */
  collage: { display: 'flex', flexDirection: 'column', gap: '4px', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' },
  cRow: { display: 'flex', gap: '4px' },
  cFull: { width: '100%', height: '380px', objectFit: 'cover', display: 'block' },
  cTopWide: { width: '100%', height: '260px', objectFit: 'cover', display: 'block' },
  cHalf: { width: 'calc(50% - 2px)', height: '220px', objectFit: 'cover', flex: 1, display: 'block' },
  morePhotos: { fontSize: '0.8rem', color: '#aaa', textAlign: 'center', marginTop: '4px' },

  /* Perspective cards (magazine) */
  perspGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '8px' },
  perspCard: { backgroundColor: '#fff', borderRadius: '14px', padding: '18px', border: '1px solid #ebe5dc' },
  perspHead: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  perspAv: { width: '38px', height: '38px', borderRadius: '50%' },
  perspName: { fontWeight: '700', fontSize: '0.95rem', color: '#1a1a1a' },
  perspLoc: { fontSize: '0.78rem', color: '#aaa', marginTop: '2px' },
  perspPhoto: { width: '100%', height: '180px', objectFit: 'cover', borderRadius: '10px', marginBottom: '12px' },
  perspText: { fontSize: '0.92rem', color: '#444', lineHeight: '1.7', fontStyle: 'italic' },

  /* Single entry box */
  singleBox: { backgroundColor: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #ebe5dc', marginTop: '8px' },
  singleHead: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' },
  singleAv: { width: '32px', height: '32px', borderRadius: '50%' },
  singleName: { fontWeight: '600', fontSize: '0.9rem', color: '#1a1a1a' },
  singleLoc: { fontSize: '0.8rem', color: '#aaa' },
  singleText: { fontSize: '0.95rem', color: '#444', lineHeight: '1.7', fontStyle: 'italic' },

  /* Closing */
  closingBox: { padding: '56px 8px', textAlign: 'center' },
  closingMark: { fontSize: '1.5rem', color: '#b09070', marginBottom: '16px', fontFamily: 'Georgia, serif' },
  closing: { fontSize: '1.1rem', color: '#444', fontStyle: 'italic', lineHeight: '1.85', fontFamily: 'Georgia, serif', maxWidth: '560px', margin: '0 auto' },

  /* Branding */
  brandingWrap: { textAlign: 'center', padding: '28px 16px 48px', backgroundColor: '#fff', borderTop: '1px solid #ebe5dc' },
  branding: { fontSize: '0.95rem', fontWeight: '700', color: '#bbb', marginBottom: '4px', fontFamily: 'Georgia, serif' },
  brandingHint: { fontSize: '0.8rem', color: '#ccc' },
}
