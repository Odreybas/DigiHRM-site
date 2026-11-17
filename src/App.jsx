import { Routes, Route, NavLink, Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import { useAuth } from './auth.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Explore from './pages/Explore.jsx'
import Person from './pages/Person.jsx'
import BusinessPage from './pages/BusinessPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import EditProfile from './pages/EditProfile.jsx'
import BusinessForm from './pages/BusinessForm.jsx'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="muted">Loading...</p>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user } = useAuth()
  const nav = useNavigate()

  async function logout() {
    await supabase.auth.signOut()
    nav('/')
  }

  return (
    <>
      <header className="top">
        <Link to="/" className="logo">DigiHRM</Link>
        <nav>
          <NavLink to="/explore">Explore</NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <button className="linkbtn" onClick={logout}>Log out</button>
            </>
          ) : (
            <NavLink to="/login">Log in</NavLink>
          )}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/people/:id" element={<Person />} />
          <Route path="/business/:id" element={<BusinessPage />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/profile/edit" element={<Protected><EditProfile /></Protected>} />
          <Route path="/business/new" element={<Protected><BusinessForm /></Protected>} />
          <Route path="/business/:id/edit" element={<Protected><BusinessForm /></Protected>} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  )
}
