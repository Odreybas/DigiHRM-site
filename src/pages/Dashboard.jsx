import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, capLabel } from '../supabase'
import { useAuth } from '../auth.jsx'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [skillCount, setSkillCount] = useState(0)
  const [biz, setBiz] = useState([])
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])

  useEffect(() => {
    if (!user) return
    supabase.from('profile_skills').select('skill_id', { count: 'exact', head: true }).eq('profile_id', user.id)
      .then(({ count }) => setSkillCount(count || 0))
    supabase.from('businesses').select('id,name,category').eq('owner_id', user.id).then(({ data }) => setBiz(data || []))
    supabase.from('products').select('id,name').eq('owner_id', user.id).then(({ data }) => setProducts(data || []))
    supabase.from('services').select('id,title').eq('owner_id', user.id).then(({ data }) => setServices(data || []))
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
        </div>
      </div>

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

      {has('employer') && (
        <div className="card">
          <strong>Hiring</strong>
          <p className="muted">Posting jobs and managing applicants is coming in the next phase.</p>
        </div>
      )}
    </>
  )
}
