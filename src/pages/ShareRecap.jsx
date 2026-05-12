import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

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
  const [generatingPDF, setGeneratingPDF] = useState(false)

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

  const handleShare = async () => {
    const shareData = {
      title: `${recapData?.tripTitle || 'Trip recap'} on Mosaic`,
      text: `${recap?.title || 'A beautiful trip recap'} — made with Mosaic.`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Clipboard not available:', err)
      }
    }
  }

  const handleDownloadPDF = async () => {
    const element = document.getElementById('recap-content')
    if (!element) return

    setGeneratingPDF(true)
    try {
      // Wait for all images inside the element to fully load
      const images = Array.from(element.querySelectorAll('img'))
      await Promise.all(images.map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve()
        return new Promise(resolve => {
          img.onload = resolve
          img.onerror = resolve
          setTimeout(resolve, 5000)
        })
      }))

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#faf7f2',
        logging: false,
        imageTimeout: 20000,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`${recapData.tripTitle} — Mosaic.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('Could not generate PDF. Please try again.')
    } finally {
      setGeneratingPDF(false)
    }
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
        <img src="/logo-wide.png" alt="Mosaic" style={s.actionLogoBig} />
        <div style={s.actionBtns}>
          <button onClick={handleShare} style={s.actionBtn}>
            {copied ? '✓ Copied' : '↗ Share'}
          </button>
          <button onClick={handleDownloadPDF} style={s.actionBtnPrimary} disabled={generatingPDF}>
            {generatingPDF ? '⏳ Generating...' : '⬇ Download PDF'}
          </button>
        </div>
      </div>

      <div id="recap-content">
        {/* Brand strip with tagline at top */}
        <div style={s.brandStrip}>
          <img src="/logo-icon.png" alt="" style={s.brandStripIcon} />
          <div style={s.brandStripCol}>
            <p style={s.brandStripName}>Mosaic</p>
            <p style={s.brandStripTagline}>Many pieces. One unforgettable trip.</p>
          </div>
        </div>

        {template === 'magazine' && <MagazineTemplate {...sharedProps} />}
        {template === 'storybook' && <StorybookTemplate {...sharedProps} />}
        {template === 'polaroid' && <PolaroidTemplate {...sharedProps} />}
        {template === 'splitpov' && <SplitPOVTemplate {...sharedProps} />}
        {template === 'stories' && <StoriesTemplate {...sharedProps} />}

        <Branding />
      </div>
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
              <span style={s.dayPill}>✦ {day.dayLabel}</span>
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
                <span style={s.dayPill}>✦ {day.dayLabel}</span>
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
                    <div style={s.polaroidImgWrap}>
                      <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center',
                        filter: 'blur(20px) brightness(0.85)', transform: 'scale(1.1)',
                      }} />
                      <img src={url} alt="" style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
                      }} />
                    </div>
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

/* ========= SPLIT POV ========= */
function SplitPOVTemplate({ recap, recapData, days, isMulti, coverPhoto, memberList }) {
  return (
    <>
      {/* Hero */}
      {coverPhoto ? (
        <div style={{ ...s.heroSplit, backgroundImage: `url(${coverPhoto})` }}>
          <div style={s.heroSplitOverlay}>
            <p style={s.heroSplitTag}>{recapData?.tripTitle}</p>
            <h1 style={s.heroSplitTitle}>{recap.title}</h1>
            {isMulti && memberList.length >= 2 && (
              <div style={s.splitVs}>
                <div style={s.splitVsMember}>
                  <img src={memberList[0].userPhoto} alt="" style={s.splitVsAv} />
                  <span style={s.splitVsName}>{memberList[0].userName.split(' ')[0]}</span>
                </div>
                <span style={s.splitVsX}>·</span>
                <div style={s.splitVsMember}>
                  <img src={memberList[1].userPhoto} alt="" style={s.splitVsAv} />
                  <span style={s.splitVsName}>{memberList[1].userName.split(' ')[0]}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={s.heroPlain}><h1 style={s.heroTitleDark}>{recap.title}</h1></div>
      )}

      <div style={s.bodySplit}>
        <p style={s.summarySplit}>{recap.summary}</p>

        {days.map((day, i) => {
          // Sort members consistently (always show same order)
          const member1 = day.entries.find(e => e.userId === memberList[0]?.userId)
          const member2 = day.entries.find(e => e.userId === memberList[1]?.userId)

          return (
            <div key={day.date} style={s.splitDay}>
              <div style={s.splitDayHeader}>
                <span style={s.dayPill}>✦ {day.dayLabel}</span>
                <p style={s.splitDayTitle}>Same day. {isMulti ? 'Two views.' : 'Your view.'}</p>
                <p style={s.splitDayDate}>{formatDate(day.date)}</p>
              </div>

              {day.aiCaption && (
                <div style={s.splitCaptionBox}>
                  <p style={s.splitCaption}>{day.aiCaption}</p>
                </div>
              )}

              {isMulti && member1 && member2 ? (
                <div style={s.splitGrid}>
                  <SplitSide entry={member1} accent="left" />
                  <div style={s.splitDivider} />
                  <SplitSide entry={member2} accent="right" />
                </div>
              ) : (
                <SplitSide entry={day.entries[0]} accent="full" />
              )}
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

function SplitSide({ entry, accent }) {
  if (!entry) return null
  const photos = entry.photoURLs || []
  const accentColor = accent === 'left' ? '#2d4a8a' : accent === 'right' ? '#a83a4a' : '#1a1a1a'

  return (
    <div style={s.splitSide}>
      <div style={{ ...s.splitSideHeader, borderBottomColor: accentColor }}>
        <img src={entry.userPhoto} alt="" style={s.splitSideAv} />
        <div>
          <span style={{ ...s.splitSideTag, color: accentColor, backgroundColor: `${accentColor}18` }}>Through</span>
          <p style={s.splitSideName}>{entry.userName.split(' ')[0]}'s eyes</p>
        </div>
      </div>

      {/* Stacked photos */}
      <div style={s.splitPhotosStack}>
        {photos.slice(0, 4).map((url, i) => (
          <SmartPhoto key={i} src={url} height={260} radius={10} />
        ))}
      </div>

      {entry.location && (
        <p style={s.splitLocation}>📍 {entry.location}</p>
      )}

      {entry.text && (
        <div style={{ ...s.splitQuote, borderLeftColor: accentColor }}>
          <p style={s.splitQuoteText}>"{entry.text}"</p>
        </div>
      )}
    </div>
  )
}

/* ========= STORIES ========= */
function StoriesTemplate({ recap, recapData, days, isMulti, coverPhoto, memberList }) {
  return (
    <div style={s.storiesWrap}>
      <div style={s.storiesHeader}>
        <p style={s.storiesTripName}>{recapData?.tripTitle}</p>
        <h1 style={s.storiesTitle}>{recap.title}</h1>
        <p style={s.storiesSummary}>{recap.summary}</p>
        {isMulti && memberList.length > 0 && (
          <div style={s.storiesMembers}>
            {memberList.map((m, i) => <img key={i} src={m.userPhoto} alt="" style={s.storiesMemberAv} />)}
          </div>
        )}
      </div>

      <div style={s.storiesGrid}>
        {days.map((day, i) => (
          <StoryCard key={day.date} day={day} index={i} totalDays={days.length} isMulti={isMulti} />
        ))}
      </div>

      <div style={s.storiesClose}>
        <p style={s.closingMark}>~</p>
        <p style={s.closing}>{recap.closing}</p>
      </div>
    </div>
  )
}

function StoryCard({ day, index, totalDays, isMulti }) {
  const photo = day.photos[0]

  return (
    <div style={s.storyCard}>
      {photo && (
        <div style={{ ...s.storyBg, backgroundImage: `url(${photo})` }}>
          <div style={s.storyOverlay}>
            <div style={s.storyTopRow}>
              <span style={s.storyDayBadge}>{day.dayLabel} of {totalDays}</span>
              <span style={s.storyDateBadge}>{formatDate(day.date).split(',')[1]?.trim() || formatDate(day.date)}</span>
            </div>

            <div style={s.storyTextWrap}>
              {day.aiCaption && <p style={s.storyCaption}>{day.aiCaption}</p>}

              {isMulti && day.entries.length > 1 ? (
                <div style={s.storyMembers}>
                  {day.entries.map((e, i) => (
                    <div key={i} style={s.storyMember}>
                      <img src={e.userPhoto} alt="" style={s.storyMemberAv} />
                      <span style={s.storyMemberName}>{e.userName.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              ) : day.entries[0] && (
                <div style={s.storySingleMember}>
                  <img src={day.entries[0].userPhoto} alt="" style={s.storyMemberAv} />
                  <span style={s.storyMemberName}>{day.entries[0].userName.split(' ')[0]}</span>
                  {day.entries[0].location && <span style={s.storyLoc}>· 📍 {day.entries[0].location}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {!photo && (
        <div style={{ ...s.storyBg, backgroundColor: '#1a1a1a' }}>
          <div style={s.storyOverlay}>
            <span style={s.storyDayBadge}>{day.dayLabel}</span>
            <p style={s.storyCaption}>{day.aiCaption}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ========= SHARED COMPONENTS ========= */

/* Smart photo: blurred background + contained image (works for any aspect ratio) */
function SmartPhoto({ src, height = 280, radius = 10 }) {
  return (
    <div style={{
      position: 'relative', width: '100%', height: `${height}px`,
      borderRadius: `${radius}px`, overflow: 'hidden', backgroundColor: '#1a1a1a',
    }}>
      <div style={{
        position: 'absolute', inset: '-10px',
        backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(28px) brightness(0.7) saturate(1.1)', transform: 'scale(1.1)',
      }} />
      <img src={src} alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
      }} />
    </div>
  )
}

function PhotoCollage({ photos }) {
  const count = photos.length
  if (count === 1) {
    return <div style={s.collage}><SmartPhoto src={photos[0]} height={380} radius={12} /></div>
  }
  if (count === 2) {
    return (
      <div style={{ display: 'flex', gap: '6px' }}>
        <div style={{ flex: 1 }}><SmartPhoto src={photos[0]} height={260} radius={10} /></div>
        <div style={{ flex: 1 }}><SmartPhoto src={photos[1]} height={260} radius={10} /></div>
      </div>
    )
  }
  if (count === 3) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <SmartPhoto src={photos[0]} height={300} radius={12} />
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ flex: 1 }}><SmartPhoto src={photos[1]} height={200} radius={10} /></div>
          <div style={{ flex: 1 }}><SmartPhoto src={photos[2]} height={200} radius={10} /></div>
        </div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        <div style={{ flex: 1 }}><SmartPhoto src={photos[0]} height={220} radius={10} /></div>
        <div style={{ flex: 1 }}><SmartPhoto src={photos[1]} height={220} radius={10} /></div>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <div style={{ flex: 1 }}><SmartPhoto src={photos[2]} height={220} radius={10} /></div>
        <div style={{ flex: 1 }}><SmartPhoto src={photos[3]} height={220} radius={10} /></div>
      </div>
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
      <img src="/logo-icon.png" alt="Mosaic" style={s.brandingLogo} />
      <p style={s.branding}>Made with Mosaic</p>
      <p style={s.brandingHint}>Many pieces. One unforgettable trip.</p>
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
  actionLogoBig: { height: '36px', objectFit: 'contain' },
  actionBtns: { display: 'flex', gap: '8px' },
  actionBtn: {
    padding: '8px 14px', backgroundColor: '#fff', border: '1.5px solid #ddd',
    borderRadius: '20px', fontSize: '0.85rem', color: '#333', cursor: 'pointer', fontWeight: '500',
  },
  actionBtnPrimary: {
    padding: '8px 14px', backgroundColor: '#1a1a1a', border: 'none',
    borderRadius: '20px', fontSize: '0.85rem', color: '#fff', cursor: 'pointer', fontWeight: '600',
  },

  /* Brand strip — appears at top of recap content (above hero, below action bar) */
  brandStrip: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
    padding: '24px 16px', backgroundColor: '#fff', borderBottom: '1px solid #ebe5dc',
  },
  brandStripIcon: { width: '52px', height: '52px', objectFit: 'contain' },
  brandStripCol: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  brandStripName: { fontSize: '1.5rem', color: '#1a1a1a', fontWeight: '700', margin: 0, fontFamily: 'Georgia, serif', lineHeight: 1.1 },
  brandStripTagline: { fontSize: '0.85rem', color: '#b09070', fontWeight: '600', fontStyle: 'italic', margin: 0, marginTop: '4px', letterSpacing: '0.02em' },

  /* Shared eyebrow pill (matches the rest of app) */
  dayPill: {
    display: 'inline-block', fontSize: '0.72rem', fontWeight: '700',
    color: '#c89060', textTransform: 'uppercase', letterSpacing: '0.15em',
    backgroundColor: '#fbeede', padding: '5px 12px', borderRadius: '20px',
    marginBottom: '12px',
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
  polaroidImgWrap: { position: 'relative', width: '180px', height: '180px', overflow: 'hidden', backgroundColor: '#1a1a1a' },

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
  brandingWrap: { textAlign: 'center', padding: '48px 16px 56px', backgroundColor: '#fff', borderTop: '1px solid #ebe5dc' },
  brandingLogo: { width: '64px', height: '64px', objectFit: 'contain', marginBottom: '16px' },
  branding: { fontSize: '1.4rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px', fontFamily: 'Georgia, serif' },
  brandingHint: { fontSize: '0.95rem', color: '#b09070', fontStyle: 'italic', fontWeight: '500' },

  /* SPLIT POV */
  heroSplit: { width: '100%', height: '480px', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
  heroSplitOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(135deg, rgba(45,74,138,0.7) 0%, rgba(168,58,74,0.7) 100%)',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '24px',
  },
  heroSplitTag: { fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '14px', fontWeight: '600' },
  heroSplitTitle: { fontSize: '3rem', fontWeight: '800', color: '#fff', fontFamily: 'Georgia, serif', lineHeight: '1.1', maxWidth: '700px' },
  splitVs: { display: 'flex', alignItems: 'center', gap: '14px', marginTop: '28px' },
  splitVsMember: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: '24px', backdropFilter: 'blur(10px)' },
  splitVsAv: { width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #fff' },
  splitVsName: { fontSize: '0.9rem', color: '#fff', fontWeight: '700' },
  splitVsX: { fontSize: '1.5rem', color: '#fff', opacity: 0.6 },

  bodySplit: { maxWidth: '1100px', margin: '0 auto', padding: '0 16px' },
  summarySplit: { fontSize: '1.15rem', color: '#444', lineHeight: '1.85', fontStyle: 'italic', fontFamily: 'Georgia, serif', textAlign: 'center', padding: '48px 24px 32px', maxWidth: '700px', margin: '0 auto', borderBottom: '1px solid #ebe5dc' },

  splitDay: { padding: '48px 0', borderBottom: '2px solid #ebe5dc' },
  splitDayHeader: { textAlign: 'center', marginBottom: '24px' },
  splitDayLabel: { fontSize: '0.78rem', fontWeight: '700', color: '#b09070', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' },
  splitDayTitle: { fontSize: '1.8rem', fontWeight: '800', color: '#1a1a1a', fontFamily: 'Georgia, serif', lineHeight: '1.2', marginBottom: '6px' },
  splitDayDate: { fontSize: '0.85rem', color: '#999' },

  splitCaptionBox: { maxWidth: '720px', margin: '0 auto 32px', padding: '0 16px' },
  splitCaption: { fontSize: '1.05rem', color: '#444', lineHeight: '1.85', textAlign: 'center', fontStyle: 'italic', fontFamily: 'Georgia, serif' },

  splitGrid: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', alignItems: 'flex-start' },
  splitDivider: { width: '1px', alignSelf: 'stretch', backgroundColor: '#ddd' },

  splitSide: { display: 'flex', flexDirection: 'column', gap: '16px' },
  splitSideHeader: { display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '3px solid' },
  splitSideAv: { width: '52px', height: '52px', borderRadius: '50%' },
  splitSideLabel: { fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600', margin: 0 },
  splitSideTag: {
    display: 'inline-block', fontSize: '0.65rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.15em',
    padding: '3px 10px', borderRadius: '16px', marginBottom: '4px',
  },
  splitSideName: { fontSize: '1.15rem', fontWeight: '800', color: '#1a1a1a', fontFamily: 'Georgia, serif', margin: 0, marginTop: '2px' },

  splitPhotosStack: { display: 'flex', flexDirection: 'column', gap: '8px' },
  splitPhoto: { width: '100%', height: '260px', objectFit: 'cover', borderRadius: '10px', display: 'block' },
  splitLocation: { fontSize: '0.85rem', color: '#888', fontWeight: '500' },
  splitQuote: { backgroundColor: '#fff', padding: '16px 18px', borderRadius: '10px', borderLeft: '4px solid', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' },
  splitQuoteText: { fontSize: '1rem', color: '#333', lineHeight: '1.75', fontStyle: 'italic', fontFamily: 'Georgia, serif', margin: 0 },

  /* STORIES */
  storiesWrap: { backgroundColor: '#fafafa', minHeight: '100vh' },
  storiesHeader: { textAlign: 'center', padding: '60px 24px 40px', backgroundColor: '#fff' },
  storiesTripName: { fontSize: '0.78rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px', fontWeight: '600' },
  storiesTitle: { fontSize: '2.4rem', fontWeight: '800', color: '#1a1a1a', fontFamily: 'Georgia, serif', lineHeight: '1.2', marginBottom: '20px' },
  storiesSummary: { fontSize: '1.05rem', color: '#555', lineHeight: '1.85', fontStyle: 'italic', maxWidth: '560px', margin: '0 auto 20px' },
  storiesMembers: { display: 'flex', justifyContent: 'center', gap: '8px' },
  storiesMemberAv: { width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px #ddd' },

  storiesGrid: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', padding: '40px 16px' },
  storyCard: { width: '320px', height: '568px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' },
  storyBg: { width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
  storyOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.85) 100%)',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px',
  },
  storyTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  storyDayBadge: { fontSize: '0.72rem', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' },
  storyDateBadge: { fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  storyTextWrap: { display: 'flex', flexDirection: 'column', gap: '14px' },
  storyCaption: { fontSize: '1.15rem', color: '#fff', lineHeight: '1.5', fontWeight: '600', fontFamily: 'Georgia, serif', margin: 0 },
  storyMembers: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  storyMember: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '4px 10px 4px 4px', borderRadius: '20px' },
  storySingleMember: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '4px 12px 4px 4px', borderRadius: '20px', alignSelf: 'flex-start' },
  storyMemberAv: { width: '24px', height: '24px', borderRadius: '50%' },
  storyMemberName: { fontSize: '0.78rem', color: '#fff', fontWeight: '700' },
  storyLoc: { fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)' },

  storiesClose: { textAlign: 'center', padding: '40px 16px 60px', backgroundColor: '#fff' },
}
