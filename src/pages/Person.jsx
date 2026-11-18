import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, capLabel } from '../supabase'
import { ServiceCard } from '../components/Cards.jsx'
import SaveButton from '../components/SaveButton.jsx'
import FollowButton from '../components/FollowButton.jsx'
import Feed from '../components/Feed.jsx'

export default function Person() {
  const { id } = useParams()
  const [p, setP] = useState(undefined)
  const [skills, setSkills] = useState([])
  const [biz, setBiz] = useState([])
  const [services, setServices] = useState([])
  const [followers, setFollowers] = useState(0)

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', id).maybeSingle().then(({ data }) => setP(data))
    supabase.from('profile_skills').select('skills(name)').eq('profile_id', id).then(({ data }) =>
      setSkills((data || []).map((r) => r.skills?.name).filter(Boolean)))
    supabase.from('businesses').select('id,name,category').eq('owner_id', id).then(({ data }) => setBiz(data || []))
    supabase.from('services').select('*,businesses(name)').eq('owner_id', id).then(({ data }) => setServices(data || []))
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', id).then(({ count }) => setFollowers(count || 0))
  }, [id])

  if (p === undefined) return <p className="muted">Loading...</p>
  if (!p) return <p>This profile does not exist.</p>

  return (
    <>
    <div className="card">
      <div className="between"><h2>{p.full_name || 'Unnamed'}</h2><span className="row"><FollowButton userId={p.id} /><SaveButton kind="person" id={p.id} /></span></div>
      <p className="muted small">{followers} follower{followers === 1 ? '' : 's'}</p>
      <p className="muted">{p.title}{p.location ? ` - ${p.location}` : ''}</p>
      {p.bio && <p>{p.bio}</p>}
      <h3>Skills</h3>
      {skills.length ? <p className="chips">{skills.map((s) => <em key={s}>{s}</em>)}</p> : <p className="muted">No skills listed.</p>}
      <h3>Roles</h3>
      <p className="chips">{p.capabilities.map((c) => <em key={c}>{capLabel(c)}</em>)}</p>
      {biz.length > 0 && (
        <>
          <h3>Businesses</h3>
          {biz.map((b) => <p key={b.id}><Link to={`/business/${b.id}`}>{b.name}</Link> <span className="muted">{b.category}</span></p>)}
        </>
      )}
    </div>
    <h3>Posts</h3>
    <Feed ownerId={p.id} />
    {services.length > 0 && <><h3>Services offered</h3>{services.map((s) => <ServiceCard key={s.id} s={s} />)}</>}
    </>
  )
}
