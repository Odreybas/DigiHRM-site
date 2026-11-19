import { useState } from 'react'
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
import Notifications from './pages/Notifications.jsx'
import PostForm from './pages/PostForm.jsx'
import PostPage from './pages/PostPage.jsx'
import Chat from './pages/Chat.jsx'
import Ops from './pages/Ops.jsx'
import Activity from './pages/Activity.jsx'
import Achievements from './pages/Achievements.jsx'
import Verify from './pages/Verify.jsx'
import Admin from './pages/Admin.jsx'
import { useNotifs } from './notifications.jsx'

const ICONS = {
  home: <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />,
  explore: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  create: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
  messages: <path d="M4 5h16v11H9l-5 4z" />,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
}
const Icon = ({ name }) => <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="muted">Loading...</p>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user } = useAuth()
  const { unread, unreadMessages } = useNotifs()
  const nav = useNavigate()
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'light')

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('theme', next) } catch { /* ignore */ }
    setTheme(next)
  }

  async function logout() {
    await supabase.auth.signOut()
    nav('/')
  }

  return (
    <>
      <header className="top">
        <Link to="/" className="logo">DigiHRM</Link>
        <nav>
          <button className="linkbtn" onClick={toggleTheme} aria-label="Switch light or dark mode">{theme === 'light' ? 'Dark' : 'Light'}</button>
          {user && <NavLink to="/saved">Saved</NavLink>}
          {user && <NavLink to="/notifications">Alerts{unread > 0 && <span className="badge">{unread}</span>}</NavLink>}
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
          <Route path="/messages/:id" element={<Protected><Chat /></Protected>} />
          <Route path="/ops" element={<Protected><Ops /></Protected>} />
          <Route path="/activity" element={<Protected><Activity /></Protected>} />
          <Route path="/profile/achievements" element={<Protected><Achievements /></Protected>} />
          <Route path="/verify" element={<Protected><Verify /></Protected>} />
          <Route path="/admin" element={<Protected><Admin /></Protected>} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/post/new" element={<Protected><PostForm /></Protected>} />
          <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
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
        <NavLink to="/" end><Icon name="home" />Home</NavLink>
        <NavLink to="/explore"><Icon name="explore" />Explore</NavLink>
        <NavLink to="/create"><Icon name="create" />Create</NavLink>
        <NavLink to="/messages"><Icon name="messages" />Messages{unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}</NavLink>
        <NavLink to={user ? '/dashboard' : '/login'}><Icon name="profile" />Profile</NavLink>
      </nav>
      <footer className="footbar">DigiHRM - people, skills, products and jobs</footer>
    </>
  )
}
