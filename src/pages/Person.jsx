import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, capLabel } from '../supabase'
import { useAuth } from '../auth.jsx'
import { useTrack } from '../util.js'
import Avatar from '../components/Avatar.jsx'
import SaveButton from '../components/SaveButton.jsx'
import FollowButton from '../components/FollowButton.jsx'
import MessageButton from '../components/MessageButton.jsx'
import Badges from '../components/Badges.jsx'
import Reviews from '../components/Reviews.jsx'
import { ServiceCard, ProductCard, BusinessCard, JobCard } from '../components/Cards.jsx'

const KIND_LABEL = {
  achievement: 'Achievements', experience: 'Work experience', education: 'Education',
  certification: 'Certifications', project: 'Projects',
}
const TABS = [['posts', 'Posts'], ['about', 'About'], ['achievements', 'Achievements'], ['offers', 'Offers'], ['reviews', 'Reviews']]

export default function Person() {
  const { id } = useParams()
  const { user } = useAuth()
  useTrack('person', id)
  const [tab, setTab] = useState('posts')
  const [p, setP] = useState(undefined)
  const [skills, setSkills] = useState([])
  const [biz, setBiz] = useState([])
  const [services, setServices] = useState([])
  const [products, setProducts] = useState([])
  const [jobs, setJobs] = useState([])
  const [items, setItems] = useState([])
  const [posts, setPosts] = useState([])
  const [counts, setCounts] = useState({ posts: 0, followers: 0, following: 0 })

  useEffect(() => {
    setTab('posts')
    supabase.from('profiles').select('*').eq('id', id).maybeSingle().then(({ data }) => setP(data))
    supabase.from('profile_skills').select('skills(name)').eq('profile_id', id).then(({ data }) =>
      setSkills((data || []).map((r) => r.skills?.name).filter(Boolean)))
    supabase.from('businesses').select('*').eq('owner_id', id).then(({ data }) => setBiz(data || []))
    supabase.from('services').select('*,businesses(name)').eq('owner_id', id).then(({ data }) => setServices(data || []))
    supabase.from('products').select('*,businesses(name)').eq('owner_id', id).then(({ data }) => setProducts(data || []))
    supabase.from('jobs').select('*,businesses(name)').eq('owner_id', id).eq('status', 'open').then(({ data }) => setJobs(data || []))
    supabase.from('profile_items').select('*').eq('profile_id', id).order('year_from', { ascending: false, nullsFirst: false }).then(({ data }) => setItems(data || []))
    supabase.from('posts').select('id,body,media_url,media_type').eq('owner_id', id).order('created_at', { ascending: false }).limit(30).then(({ data }) => setPosts(data || []))
    Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('owner_id', id),
      supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', id),
      supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', id),
    ]).then(([a, b, c]) => setCounts({ posts: a.count || 0, followers: b.count || 0, following: c.count || 0 }))
  }, [id])

  async function report() {
    const reason = window.prompt('What is wrong with this account?')
    if (reason === null) return
    const { error } = await supabase.from('reports').insert({ reporter_id: user.id, target_kind: 'person', target_id: id, reason })
    window.alert(error ? error.message : 'Thanks. We will review this account.')
  }

  if (p === undefined) return <p className="muted">Loading...</p>
  if (!p) return <p>This profile does not exist.</p>
  const own = user?.id === p.id
  const grouped = Object.keys(KIND_LABEL).map((k) => [k, items.filter((i) => i.kind === k)]).filter(([, l]) => l.length)

  return (
    <>
      <div className="cover" style={p.cover_url ? { backgroundImage: `url(${p.cover_url})` } : undefined} />
      <div className="profilehead">
        <Avatar p={p} size={92} />
        <div className="grow">
          <h2 style={{ margin: 0 }}>{p.full_name || 'Unnamed'}</h2>
          <div className="muted">{p.title}{p.location ? ` - ${p.location}` : ''}</div>
        </div>
      </div>
      <Badges profileId={p.id} />
      <div className="stats">
        <div><strong>{counts.posts}</strong><span>Posts</span></div>
        <div><strong>{counts.followers}</strong><span>Followers</span></div>
        <div><strong>{counts.following}</strong><span>Following</span></div>
      </div>
      <div className="row wrap" style={{ marginBottom: 10 }}>
        {own ? (
          <>
            <Link className="btn" to="/profile/edit">Edit profile</Link>
            <Link className="btn ghost" to="/profile/achievements">Achievements</Link>
          </>
        ) : (
          <>
            <FollowButton userId={p.id} />
            <MessageButton toId={p.id} label="Message" />
            <SaveButton kind="person" id={p.id} />
            {user && <button className="linkbtn small" onClick={report}>Report</button>}
          </>
        )}
      </div>

      <div className="tabs2">
        {TABS.map(([k, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === 'posts' && (
        posts.length === 0 ? <p className="muted">No posts yet.</p> : (
          <div className="grid3">
            {posts.map((x) => (
              <Link key={x.id} to={`/post/${x.id}`} className="tile">
                {x.media_type === 'image' && <img src={x.media_url} alt="" loading="lazy" />}
                {x.media_type === 'video' && <><video src={x.media_url} preload="metadata" muted playsInline /><span className="play">Play</span></>}
                {!x.media_type && <div className="tiletext">{x.body.slice(0, 90)}</div>}
              </Link>
            ))}
          </div>
        )
      )}

      {tab === 'about' && (
        <div className="card">
          {p.bio ? <p>{p.bio}</p> : <p className="muted">No bio yet.</p>}
          <h3>Roles</h3>
          <p className="chips">{p.capabilities.map((c) => <em key={c}>{capLabel(c)}</em>)}</p>
          <h3>Skills</h3>
          {skills.length ? <p className="chips">{skills.map((s) => <em key={s}>{s}</em>)}</p> : <p className="muted">No skills listed.</p>}
          {biz.length > 0 && <><h3>Businesses</h3>{biz.map((b) => <p key={b.id}><Link to={`/business/${b.id}`}>{b.name}</Link> <span className="muted">{b.category}</span></p>)}</>}
          <p className="muted small">Joined {new Date(p.created_at).toLocaleDateString()}</p>
        </div>
      )}

      {tab === 'achievements' && (
        grouped.length === 0 ? <p className="muted">Nothing added yet.</p> : grouped.map(([k, list]) => (
          <div className="card" key={k}>
            <strong>{KIND_LABEL[k]}</strong>
            {list.map((i) => (
              <div key={i.id} className="item2">
                <div><strong>{i.title}</strong>{i.org && <span className="muted"> - {i.org}</span>}</div>
                {(i.year_from || i.year_to) && <div className="muted small">{i.year_from || ''}{i.year_to ? ` - ${i.year_to}` : i.year_from ? ' - present' : ''}</div>}
                {i.description && <p>{i.description}</p>}
              </div>
            ))}
          </div>
        ))
      )}

      {tab === 'offers' && (
        <>
          {jobs.length > 0 && <><h3>Jobs</h3>{jobs.map((j) => <JobCard key={j.id} j={j} />)}</>}
          {services.length > 0 && <><h3>Services</h3>{services.map((s) => <ServiceCard key={s.id} s={s} />)}</>}
          {products.length > 0 && <><h3>Products</h3>{products.map((x) => <ProductCard key={x.id} p={x} />)}</>}
          {biz.length > 0 && <><h3>Businesses</h3>{biz.map((b) => <BusinessCard key={b.id} b={b} />)}</>}
          {!jobs.length && !services.length && !products.length && !biz.length && <p className="muted">No offers yet.</p>}
        </>
      )}

      {tab === 'reviews' && <Reviews kind="person" id={p.id} ownerId={p.id} />}
    </>
  )
}
