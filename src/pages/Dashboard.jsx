import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, capLabel } from '../supabase'
import { useAuth } from '../auth.jsx'
import PeopleRail from '../components/PeopleRail.jsx'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [skillCount, setSkillCount] = useState(0)
  const [biz, setBiz] = useState([])
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  const [jobs, setJobs] = useState([])
  const [appCount, setAppCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('profile_skills').select('skill_id', { count: 'exact', head: true }).eq('profile_id', user.id)
      .then(({ count }) => setSkillCount(count || 0))
    supabase.from('businesses').select('id,name,category').eq('owner_id', user.id).then(({ data }) => setBiz(data || []))
    supabase.from('products').select('id,name').eq('owner_id', user.id).then(({ data }) => setProducts(data || []))
    supabase.from('services').select('id,title').eq('owner_id', user.id).then(({ data }) => setServices(data || []))
    supabase.from('jobs').select('id,title,status,applications(count)').eq('owner_id', user.id).then(({ data }) => setJobs(data || []))
    supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle().then(({ data }) => setIsAdmin(!!data))
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('applicant_id', user.id).then(({ count }) => setAppCount(count || 0))
  }, [user])

  if (!profile) return <p className="muted">Loading...</p>

  const checks = [profile.full_name, profile.title, profile.bio, profile.location, skillCount > 0]
  const percent = Math.round((checks.filter(Boolean).length / checks.length) * 100)
  const caps = profile.capabilities
  const has = (...keys) => keys.some((k) => caps.includes(k))

  return (
    <>
      <h2>Hello, {profile.full_name || 'there'}</h2>

      <div className="card">
        <strong>Profile {percent}% complete</strong>
        <div className="bar"><div style={{ width: `${percent}%` }} /></div>
        <p className="chips">{caps.map((c) => <em key={c}>{capLabel(c)}</em>)}</p>
        <div className="row wrap">
          <Link className="btn" to="/profile/edit">Edit profile</Link>
          <Link className="btn ghost" to={`/people/${user.id}`}>Public profile</Link>
          <Link className="btn ghost" to="/account">Account</Link>
          <Link className="btn ghost" to="/verify">Get verified</Link>
          {isAdmin && <Link className="btn ghost" to="/admin">Admin</Link>}
        </div>
      </div>

      <div className="card">
        <strong>Run your business</strong>
        <p className="muted">Orders, quotations, bookings, customers, stock, insights and your team.</p>
        <div className="row wrap">
          <Link className="btn" to="/ops">Business tools</Link>
          <Link className="btn ghost" to="/activity">My orders and bookings</Link>
        </div>
      </div>

      <PeopleRail title="People you may like" />

      <div className="card">
        <strong>Your skills: {skillCount}</strong>
        <p className="muted">
          {has('professional', 'freelancer', 'artisan', 'service_provider', 'job_seeker')
            ? 'Skills are what employers and customers search for. Keep them up to date.'
            : 'Add skills so people can find you.'}
        </p>
      </div>

      <div className="card">
        <strong>Your businesses</strong>
        {biz.length === 0 && <p className="muted">You have not added a business yet.</p>}
        {biz.map((b) => <p key={b.id}><Link to={`/business/${b.id}`}>{b.name}</Link> <span className="muted">{b.category}</span></p>)}
        <Link className="btn ghost" to="/business/new">Add a business</Link>
      </div>

      <div className="card">
        <strong>Your products</strong>
        {products.length === 0 && <p className="muted">No products yet.</p>}
        {products.map((p) => <p key={p.id}><Link to={`/product/${p.id}`}>{p.name}</Link> - <Link to={`/product/${p.id}/edit`}>edit</Link></p>)}
        <Link className="btn ghost" to="/product/new">Add a product</Link>
      </div>

      <div className="card">
        <strong>Your services</strong>
        {services.length === 0 && <p className="muted">No services yet.</p>}
        {services.map((s) => <p key={s.id}><Link to={`/service/${s.id}`}>{s.title}</Link> - <Link to={`/service/${s.id}/edit`}>edit</Link></p>)}
        <Link className="btn ghost" to="/service/new">Add a service</Link>
      </div>

      <div className="card">
        <strong>Your jobs</strong>
        {jobs.length === 0 && <p className="muted">You have not posted a job yet.</p>}
        {jobs.map((j) => (
          <p key={j.id}>
            <Link to={`/job/${j.id}`}>{j.title}</Link>{' '}
            <span className="muted">{j.status} - {j.applications?.[0]?.count || 0} applicants</span>{' '}
            <Link to={`/job/${j.id}/applicants`}>applicants</Link>
          </p>
        ))}
        <div className="row wrap">
          <Link className="btn ghost" to="/job/new">Post a job</Link>
          <Link className="btn ghost" to="/explore?tab=people">Find candidates</Link>
        </div>
      </div>

      <div className="card">
        <strong>Your applications: {appCount}</strong>
        <p className="muted">Track where each job application stands.</p>
        <Link className="btn ghost" to="/applications">View applications</Link>
      </div>
    </>
  )
}
