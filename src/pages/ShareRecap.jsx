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

  if (loading) return <div style={styles.center}><p>Loading...</p></div>
  if (!recap) return (
    <div style={styles.center}>
      <p style={styles.notFound}>This recap link is invalid or has expired.</p>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>Travel Diary</h1>
      </div>

      <div style={styles.body}>
        <p style={styles.tripName}>{recapData?.tripTitle}</p>
        <h2 style={styles.recapTitle}>{recap.title}</h2>

        <div style={styles.divider} />

        <p style={styles.summary}>{recap.summary}</p>

        {recap.days?.map((day, i) => (
          <div key={i} style={styles.dayBlock}>
            <p style={styles.dayDate}>{formatDate(day.date)}</p>
            <p style={styles.dayCaption}>{day.caption}</p>
          </div>
        ))}

        <div style={styles.divider} />

        <p style={styles.closing}>{recap.closing}</p>

        <div style={styles.brandingBox}>
          <p style={styles.branding}>Made with Travel Diary</p>
          <p style={styles.brandingHint}>Capture your trips together at traveldiary.app</p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f9f6f1' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '24px', textAlign: 'center' },
  notFound: { color: '#888', fontSize: '1rem' },
  header: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    padding: '16px 24px', backgroundColor: '#fff', borderBottom: '1px solid #eee',
  },
  logo: { fontSize: '1.3rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', margin: 0 },
  body: { maxWidth: '600px', margin: '0 auto', padding: '40px 24px' },
  tripName: { fontSize: '0.85rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' },
  recapTitle: { fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', fontFamily: 'Georgia, serif', lineHeight: '1.3', marginBottom: '24px' },
  divider: { height: '1px', backgroundColor: '#e5e0d8', marginBottom: '24px' },
  summary: { fontSize: '1.05rem', color: '#444', lineHeight: '1.8', marginBottom: '32px' },
  dayBlock: { marginBottom: '24px' },
  dayDate: { fontSize: '0.8rem', fontWeight: '700', color: '#b09070', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' },
  dayCaption: { fontSize: '1rem', color: '#444', lineHeight: '1.7' },
  closing: { fontSize: '1rem', color: '#666', fontStyle: 'italic', lineHeight: '1.8', marginBottom: '48px' },
  brandingBox: { textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #e5e0d8' },
  branding: { fontSize: '0.85rem', color: '#bbb', marginBottom: '4px' },
  brandingHint: { fontSize: '0.8rem', color: '#ccc' },
}
