import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, capLabel } from '../supabase'
import { useAuth } from '../auth.jsx'
import PeopleRail from '../components/PeopleRail.jsx'
import PeopleList from '../components/PeopleList.jsx'
import Avatar from '../components/Avatar.jsx'
import { ProductCard, ServiceCard, BusinessCard, JobCard } from '../components/Cards.jsx'

const VIEWS = [
  ['all', 'All'], ['people', 'People'], ['products', 'Products'],
  ['services', 'Services'], ['jobs', 'Jobs'], ['businesses', 'Businesses'],
]

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [view, setView] = useState('all')
  const [skillCount, setSkillCount] = useState(0)
  const [biz, setBiz] = useState([])
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  const [jobs, setJobs] = useState([])
  const [appCount, setAppCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [market, setMarket] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.from('profile_skills').select('skill_id', { count: 'exact', head: true }).eq('profile_id', user.id)
      .then(({ count }) => setSkillCount(count || 0))
    supabase.from('businesses').select('*').eq('owner_id', user.id).then(({ data }) => setBiz(data || []))
    supabase.from('products').select('*,businesses(name)').eq('owner_id', user.id).then(({ data }) => setProducts(data || []))
    supabase.from('services').select('*,businesses(name)').eq('owner_id', user.id).then(({ data }) => setServices(data || []))
    supabase.from('jobs').select('*,businesses(name),applications(count)').eq('owner_id', user.id).then(({ data }) => setJobs(data || []))
    supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle().then(({ data }) => setIsAdmin(!!data))
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('applicant_id', user.id)
      .then(({ count }) => setAppCount(count || 0))
  }, [user])

  useEffect(() => {
    if (!user || view === 'all' || view === 'people' || market) return
    async function load() {
      const [p, s, j, b] = await Promise.all([
        supabase.from('products').select('*,businesses(name)').neq('owner_id', user.id).order('created_at', { ascending: false }).limit(8),
        supabase.from('services').select('*,businesses(name)').neq('owner_id', user.id).order('created_at', { ascending: false }).limit(8),
        supabase.from('jobs').select('*,businesses(name)').neq('owner_id', user.id).eq('status', 'open').order('created_at', { ascending: false }).limit(8),
        supabase.from('businesses').select('*').neq('owner_id', user.id).order('created_at', { ascending: false }).limit(8),
      ])
      setMarket({ products: p.data || [], services: s.data || [], jobs: j.data || [], businesses: b.data || [] })
    }
    load()
  }, [view, user, market])

  if (!profile) return <p className="muted">Loading...</p>

  const checks = [profile.full_name, profile.title, profile.bio, profile.location, skillCount > 0, profile.avatar_url]
  const percent = Math.round((checks.filter(Boolean).length / checks.length) * 100)
  const caps = profile.capabilities

  const mineBlock = (title, list, render, addTo, addLabel, empty) => (
    <>
      <div className="between"><h3>{title}</h3><Link className="btn ghost" to={addTo}>{addLabel}</Link></div>
      {list.length === 0 && <p className="muted">{empty}</p>}
      {list.map(render)}
    </>
  )
  const marketBlock = (title, list, render) => (
    <>
      <h3>{title}</h3>
      {!market && <p className="muted">Loading...</p>}
      {market && list.length === 0 && <p className="muted">Nothing here yet.</p>}
      {market && list.map(render)}
    </>
  )

  return (
    <>
      <div className="between" style={{ alignItems: 'center' }}>
        <div className="row">
          <Avatar p={profile} size={52} />
          <div>
            <h2 style={{ margin: 0 }}>Hello, {profile.full_name || 'there'}</h2>
            <span className="muted small">Your dashboard</span>
          </div>
        </div>
        <Link className="btn ghost" to={`/people/${user.id}`}>My profile</Link>
      </div>

      <div className="chips pick" style={{ margin: '14px 0' }}>
        {VIEWS.map(([k, l]) => <button key={k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l}</button>)}
      </div>

      {view === 'all' && (
        <>
          <div className="card">
            <strong>Profile {percent}% complete</strong>
            <div className="bar"><div style={{ width: `${percent}%` }} /></div>
            <p className="chips">{caps.map((c) => <em key={c}>{capLabel(c)}</em>)}</p>
            <div className="row wrap">
              <Link className="btn" to="/profile/edit">Edit profile</Link>
              <Link className="btn ghost" to="/profile/achievements">Achievements</Link>
              <Link className="btn ghost" to="/verify">Get verified</Link>
              <Link className="btn ghost" to="/account">Account</Link>
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
          <div className="statgrid">
            <div className="stat"><strong>{skillCount}</strong><span>Skills</span></div>
            <div className="stat"><strong>{biz.length}</strong><span>Businesses</span></div>
            <div className="stat"><strong>{products.length}</strong><span>Products</span></div>
            <div className="stat"><strong>{services.length}</strong><span>Services</span></div>
            <div className="stat"><strong>{jobs.length}</strong><span>Jobs posted</span></div>
            <div className="stat"><strong>{appCount}</strong><span>Applications</span></div>
          </div>
        </>
      )}

      {view === 'people' && <PeopleList />}

      {view === 'products' && (
        <>
          {mineBlock('Your products', products, (p) => (
            <div key={p.id}><ProductCard p={p} /><p className="muted small" style={{ marginTop: -8 }}><Link to={`/product/${p.id}/edit`}>Edit</Link> - {p.stock != null ? `${p.stock} in stock` : 'stock not tracked'}</p></div>
          ), '/product/new', 'Add product', 'You have not added a product yet.')}
          {marketBlock('New in the marketplace', market?.products || [], (p) => <ProductCard key={p.id} p={p} />)}
        </>
      )}

      {view === 'services' && (
        <>
          {mineBlock('Your services', services, (s) => (
            <div key={s.id}><ServiceCard s={s} /><p className="muted small" style={{ marginTop: -8 }}><Link to={`/service/${s.id}/edit`}>Edit</Link></p></div>
          ), '/service/new', 'Add service', 'You have not added a service yet.')}
          {marketBlock('New services', market?.services || [], (s) => <ServiceCard key={s.id} s={s} />)}
        </>
      )}

      {view === 'jobs' && (
        <>
          {mineBlock('Jobs you posted', jobs, (j) => (
            <div key={j.id}><JobCard j={j} /><p className="muted small" style={{ marginTop: -8 }}>{j.applications?.[0]?.count || 0} applicants - <Link to={`/job/${j.id}/applicants`}>view</Link> - <Link to={`/job/${j.id}/edit`}>edit</Link></p></div>
          ), '/job/new', 'Post a job', 'You have not posted a job yet.')}
          <p><Link className="btn ghost" to="/applications">My applications ({appCount})</Link> <Link className="btn ghost" to="/explore?tab=people">Find candidates</Link></p>
          {marketBlock('Open jobs', market?.jobs || [], (j) => <JobCard key={j.id} j={j} />)}
        </>
      )}

      {view === 'businesses' && (
        <>
          {mineBlock('Your businesses', biz, (b) => (
            <div key={b.id}><BusinessCard b={b} /><p className="muted small" style={{ marginTop: -8 }}><Link to={`/business/${b.id}/edit`}>Edit</Link></p></div>
          ), '/business/new', 'Add business', 'You have not added a business yet.')}
          {marketBlock('Businesses to discover', market?.businesses || [], (b) => <BusinessCard key={b.id} b={b} />)}
        </>
      )}
    </>
  )
}
