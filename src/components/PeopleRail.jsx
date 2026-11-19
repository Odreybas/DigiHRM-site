import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'
import Avatar from './Avatar.jsx'
import FollowButton from './FollowButton.jsx'

export default function PeopleRail({ title = 'Meet people' }) {
  const { user, following } = useAuth()
  const [people, setPeople] = useState([])

  useEffect(() => {
    async function load() {
      let q = supabase.from('profiles')
        .select('id,full_name,title,location,avatar_url,profile_skills(skill_id)')
        .neq('full_name', '').order('created_at', { ascending: false }).limit(40)
      if (user) q = q.neq('id', user.id)
      const { data } = await q
      let mine = new Set()
      if (user) {
        const { data: ms } = await supabase.from('profile_skills').select('skill_id').eq('profile_id', user.id)
        mine = new Set((ms || []).map((r) => r.skill_id))
      }
      const ranked = (data || [])
        .filter((x) => !following.has(x.id))
        .map((x) => ({ ...x, score: (x.profile_skills || []).filter((s) => mine.has(s.skill_id)).length }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
      setPeople(ranked)
    }
    load()
    // eslint-disable-next-line
  }, [user?.id, following.size])

  if (!people.length) return null
  return (
    <>
      <div className="between"><h3>{title}</h3><Link to="/explore?tab=people">See all</Link></div>
      <div className="rail">
        {people.map((p) => (
          <Link key={p.id} to={`/people/${p.id}`} className="railcard">
            <Avatar p={p} size={64} />
            <strong>{p.full_name}</strong>
            <span className="muted small">{p.title || p.location || ''}</span>
            <FollowButton userId={p.id} />
          </Link>
        ))}
      </div>
    </>
  )
}
