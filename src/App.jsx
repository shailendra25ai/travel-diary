import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthState } from './hooks/useAuthState'
import Login from './pages/Login'
import Home from './pages/Home'

function App() {
  const { user, loading } = useAuthState()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ color: '#888', fontSize: '1rem' }}>Loading...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/home" /> : <Login />} />
      <Route path="/home" element={user ? <Home user={user} /> : <Navigate to="/" />} />
    </Routes>
  )
}

export default App
