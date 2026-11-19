import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'
import { PersonCard } from './Cards.jsx'

const SEL = 'id,full_name,title,location,bio,avatar_url,profile_skills(skill_id,skills(name))'

export default function PeopleList() {
  const { user, following } = useAuth()
  const [tab, setTab] = useState('suggested')
  const [rows, setRows] = useState(null)

  useEffect(() => {
    let active = true
    async function load() {
      setRows(null)
      let list = []
      if (tab === 'suggested') {
        const { data } = await supabase.from('profiles').select(SEL).neq('full_name', '').neq('id', user.id)
          .order('created_at', { ascending: false }).limit(40)
        const { data: ms } = await supabase.from('profile_skills').select('skill_id').eq('profile_id', user.id)
        const mine = new Set((ms || []).map((r) => r.skill_id))
        list = (data || [])
          .filter((x) => !following.has(x.id))
          .map((x) => ({ ...x, score: (x.profile_skills || []).filter((s) => mine.has(s.skill_id)).length }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 20)
      } else {
        const col = tab === 'following' ? 'follower_id' : 'following_id'
        const other = tab === 'following' ? 'following_id' : 'follower_id'
        const { data: f } = await supabase.from('follows').select(other).eq(col, user.id)
        const ids = (f || []).map((r) => r[other])
        if (ids.length) {
          const { data } = await supabase.from('profiles').select(SEL).in('id', ids)
          list = data || []
        }
      }
      if (active) setRows(list)
    }
    load()
    return () => { active = false }
    // eslint-disable-next-line
  }, [tab, user.id])

  return (
    <>
      <div className="chips pick" style={{ marginBottom: 12 }}>
        {[['suggested', 'Suggested'], ['following', 'Following'], ['followers', 'Followers']].map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {!rows && <p className="muted">Loading...</p>}
      {rows && rows.length === 0 && (
        <p className="muted">
          {tab === 'suggested' ? 'No suggestions yet. Add skills to your profile to get better matches.' : tab === 'following' ? 'You are not following anyone yet.' : 'No followers yet. Post something and share your profile.'}
        </p>
      )}
      {rows && rows.map((p) => <PersonCard key={p.id} p={p} />)}
    </>
  )
}
