import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthState } from './hooks/useAuthState'
import Login from './pages/Login'
import Home from './pages/Home'
import CreateTrip from './pages/CreateTrip'
import Trip from './pages/Trip'
import JoinTrip from './pages/JoinTrip'

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
      <Route path="/trips/create" element={user ? <CreateTrip user={user} /> : <Navigate to="/" />} />
      <Route path="/trips/:tripId" element={user ? <Trip user={user} /> : <Navigate to="/" />} />
      <Route path="/join/:inviteCode" element={<JoinTrip user={user} />} />
    </Routes>
  )
}

export default App
