import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, clean } from '../supabase'

export default function Explore() {
  const [tab, setTab] = useState('people')
  const [text, setText] = useState('')
  const [skill, setSkill] = useState('')
  const [skills, setSkills] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('skills').select('id,name').order('name').then(({ data }) => setSkills(data || []))
  }, [])

  async function search() {
    setLoading(true)
    setError('')
    const q = clean(text)
    let result
    if (tab === 'people') {
      let ids = null
      if (skill) {
        const { data } = await supabase.from('profile_skills').select('profile_id').eq('skill_id', skill)
        ids = (data || []).map((r) => r.profile_id)
      }
      let query = supabase
        .from('profiles')
        .select('id,full_name,title,location,profile_skills(skills(name))')
        .neq('full_name', '')
        .limit(50)
      if (ids) query = query.in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
      if (q) query = query.or(`full_name.ilike.%${q}%,title.ilike.%${q}%,location.ilike.%${q}%`)
      result = await query
    } else {
      let query = supabase.from('businesses').select('id,name,description,category,location').limit(50)
      if (q) query = query.or(`name.ilike.%${q}%,category.ilike.%${q}%,location.ilike.%${q}%,description.ilike.%${q}%`)
      result = await query
    }
    if (result.error) setError(result.error.message)
    setRows(result.data || [])
    setLoading(false)
  }

  useEffect(() => {
    search()
    // eslint-disable-next-line
  }, [tab])

  return (
    <>
      <h2>Explore</h2>
      <div className="tabs">
        <button className={tab === 'people' ? 'on' : ''} onClick={() => setTab('people')}>People</button>
        <button className={tab === 'businesses' ? 'on' : ''} onClick={() => setTab('businesses')}>Businesses</button>
      </div>
      <form className="row wrap" onSubmit={(e) => { e.preventDefault(); search() }}>
        <input
          className="grow"
          placeholder={tab === 'people' ? 'Name, title or location' : 'Name, type or location'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {tab === 'people' && (
          <select value={skill} onChange={(e) => setSkill(e.target.value)}>
            <option value="">Any skill</option>
            {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <button className="btn">Search</button>
      </form>

      {error && <p className="notice">{error}</p>}
      {loading && <p className="muted">Searching...</p>}
      {!loading && rows.length === 0 && <p className="muted">No results yet. Try a different search.</p>}

      <div className="list">
        {tab === 'people' && rows.map((p) => (
          <Link key={p.id} to={`/people/${p.id}`} className="card item">
            <strong>{p.full_name}</strong>
            <span>{p.title || 'No title yet'}{p.location ? ` - ${p.location}` : ''}</span>
            <span className="chips">
              {(p.profile_skills || []).slice(0, 5).map((ps, i) => <em key={i}>{ps.skills?.name}</em>)}
            </span>
          </Link>
        ))}
        {tab === 'businesses' && rows.map((b) => (
          <Link key={b.id} to={`/business/${b.id}`} className="card item">
            <strong>{b.name}</strong>
            <span>{b.category || 'Business'}{b.location ? ` - ${b.location}` : ''}</span>
            <span className="muted">{b.description.slice(0, 120)}</span>
          </Link>
        ))}
      </div>
    </>
  )
}
