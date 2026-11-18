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
import ProductPage from './pages/ProductPage.jsx'
import ServicePage from './pages/ServicePage.jsx'
import ProductForm from './pages/ProductForm.jsx'
import ServiceForm from './pages/ServiceForm.jsx'
import Create from './pages/Create.jsx'
import Saved from './pages/Saved.jsx'
import Account from './pages/Account.jsx'
import Messages from './pages/Messages.jsx'
import JobPage from './pages/JobPage.jsx'
import JobForm from './pages/JobForm.jsx'
import Applicants from './pages/Applicants.jsx'
import MyApplications from './pages/MyApplications.jsx'

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
          {user && <NavLink to="/saved">Saved</NavLink>}
          {user ? (
            <button className="linkbtn" onClick={logout}>Log out</button>
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
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/service/:id" element={<ServicePage />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/job/:id" element={<JobPage />} />
          <Route path="/job/new" element={<Protected><JobForm /></Protected>} />
          <Route path="/job/:id/edit" element={<Protected><JobForm /></Protected>} />
          <Route path="/job/:id/applicants" element={<Protected><Applicants /></Protected>} />
          <Route path="/applications" element={<Protected><MyApplications /></Protected>} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/profile/edit" element={<Protected><EditProfile /></Protected>} />
          <Route path="/account" element={<Protected><Account /></Protected>} />
          <Route path="/saved" element={<Protected><Saved /></Protected>} />
          <Route path="/create" element={<Protected><Create /></Protected>} />
          <Route path="/business/new" element={<Protected><BusinessForm /></Protected>} />
          <Route path="/business/:id/edit" element={<Protected><BusinessForm /></Protected>} />
          <Route path="/product/new" element={<Protected><ProductForm /></Protected>} />
          <Route path="/product/:id/edit" element={<Protected><ProductForm /></Protected>} />
          <Route path="/service/new" element={<Protected><ServiceForm /></Protected>} />
          <Route path="/service/:id/edit" element={<Protected><ServiceForm /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <nav className="bottom">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/explore">Explore</NavLink>
        <NavLink to="/create">Create</NavLink>
        <NavLink to="/messages">Messages</NavLink>
        <NavLink to={user ? '/dashboard' : '/login'}>Profile</NavLink>
      </nav>
    </>
  )
}
