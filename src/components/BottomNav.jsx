import { useNavigate, useLocation } from 'react-router-dom'

const OWNER_EMAIL = 'shailendra.25ai@gmail.com'

export default function BottomNav({ user }) {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { id: 'home', label: 'Home', path: '/home', icon: '✦' },
    { id: 'trips', label: 'Trips', path: '/trips', icon: '◫' },
  ]

  if (user?.email === OWNER_EMAIL) {
    tabs.push({ id: 'admin', label: 'Admin', path: '/admin/feedback', icon: '⚙' })
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path ||
            (tab.path === '/trips' && location.pathname.startsWith('/trips')) ||
            (tab.path === '/admin/feedback' && location.pathname.startsWith('/admin'))
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              style={isActive ? styles.tabActive : styles.tab}
            >
              <span style={isActive ? styles.iconActive : styles.icon}>{tab.icon}</span>
              <span style={styles.label}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(12px)',
    borderTop: '1px solid #ebe5dc',
    zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)',
  },
  inner: { maxWidth: '720px', margin: '0 auto', display: 'flex', justifyContent: 'space-around' },
  tab: {
    flex: 1, padding: '12px 8px 14px', background: 'none', border: 'none',
    cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '4px', color: '#999',
  },
  tabActive: {
    flex: 1, padding: '12px 8px 14px', background: 'none', border: 'none',
    cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '4px', color: '#1a1a1a',
  },
  icon: { fontSize: '1.3rem', opacity: 0.6 },
  iconActive: { fontSize: '1.3rem', color: '#b09070' },
  label: { fontSize: '0.72rem', fontWeight: '600' },
}
