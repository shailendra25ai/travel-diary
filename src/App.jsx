import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthState } from './hooks/useAuthState'
import Login from './pages/Login'
import Home from './pages/Home'
import Trips from './pages/Trips'
import CreateTrip from './pages/CreateTrip'
import EditTrip from './pages/EditTrip'
import Trip from './pages/Trip'
import JoinTrip from './pages/JoinTrip'
import AddEntry from './pages/AddEntry'
import EditEntry from './pages/EditEntry'
import GenerateRecap from './pages/GenerateRecap'
import ShareRecap from './pages/ShareRecap'
import AdminFeedback from './pages/AdminFeedback'
import FeedbackWidget from './components/FeedbackWidget'

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
    <>
    <Routes>
      <Route path="/" element={user ? <Navigate to="/home" /> : <Login />} />
      <Route path="/home" element={user ? <Home user={user} /> : <Navigate to="/" />} />
      <Route path="/trips" element={user ? <Trips user={user} /> : <Navigate to="/" />} />
      <Route path="/trips/create" element={user ? <CreateTrip user={user} /> : <Navigate to="/" />} />
      <Route path="/trips/:tripId" element={user ? <Trip user={user} /> : <Navigate to="/" />} />
      <Route path="/trips/:tripId/edit" element={user ? <EditTrip user={user} /> : <Navigate to="/" />} />
      <Route path="/trips/:tripId/entries/add" element={user ? <AddEntry user={user} /> : <Navigate to="/" />} />
      <Route path="/trips/:tripId/entries/:entryId/edit" element={user ? <EditEntry user={user} /> : <Navigate to="/" />} />
      <Route path="/trips/:tripId/recap" element={user ? <GenerateRecap user={user} /> : <Navigate to="/" />} />
      <Route path="/join/:inviteCode" element={<JoinTrip user={user} />} />
      <Route path="/share/:shareCode" element={<ShareRecap />} />
      <Route path="/admin/feedback" element={user ? <AdminFeedback user={user} /> : <Navigate to="/" />} />
    </Routes>
    <FeedbackWidget user={user} />
    </>
  )
}

export default App
