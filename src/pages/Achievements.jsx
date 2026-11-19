import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'

const KINDS = {
  achievement: 'Achievement', experience: 'Work experience', education: 'Education',
  certification: 'Certification', project: 'Project',
}
const empty = { kind: 'achievement', title: '', org: '', year_from: '', year_to: '', description: '' }

export default function Achievements() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [f, setF] = useState(empty)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const { data } = await supabase.from('profile_items').select('*').eq('profile_id', user.id).order('created_at', { ascending: false })
    setItems(data || [])
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line
  }, [])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function add(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const { error } = await supabase.from('profile_items').insert({
      profile_id: user.id, kind: f.kind, title: f.title, org: f.org, description: f.description,
      year_from: f.year_from === '' ? null : Number(f.year_from),
      year_to: f.year_to === '' ? null : Number(f.year_to),
    })
    if (error) setMsg(error.message)
    else { setF(empty); await load() }
    setBusy(false)
  }

  async function remove(id) {
    if (!window.confirm('Remove this?')) return
    await supabase.from('profile_items').delete().eq('id', id)
    load()
  }

  return (
    <>
      <h2>Achievements</h2>
      <p><Link to={`/people/${user.id}`}>View my public profile</Link></p>
      <form className="card" onSubmit={add}>
        <strong>Add something</strong>
        <label>Type
          <select value={f.kind} onChange={set('kind')}>
            {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Title<input value={f.title} onChange={set('title')} required minLength={2} placeholder="e.g. AWS AI Practitioner, Built a school website" /></label>
        <label>Organisation or place (optional)<input value={f.org} onChange={set('org')} /></label>
        <div className="row wrap">
          <label className="grow">From year<input type="number" min="1950" max="2100" value={f.year_from} onChange={set('year_from')} /></label>
          <label className="grow">To year<input type="number" min="1950" max="2100" value={f.year_to} onChange={set('year_to')} /></label>
        </div>
        <label>Details (optional)<textarea rows={3} value={f.description} onChange={set('description')} maxLength={1000} /></label>
        {msg && <p className="notice">{msg}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Add'}</button>
      </form>

      {items.length === 0 && <p className="muted">Nothing added yet.</p>}
      {items.map((i) => (
        <div className="card" key={i.id}>
          <div className="between">
            <div><strong>{i.title}</strong> <em className="chiplike">{KINDS[i.kind]}</em>
              {i.org && <div className="muted">{i.org}</div>}
              {(i.year_from || i.year_to) && <div className="muted small">{i.year_from || ''}{i.year_to ? ` - ${i.year_to}` : ''}</div>}
            </div>
            <button className="linkbtn small" onClick={() => remove(i.id)}>Remove</button>
          </div>
          {i.description && <p>{i.description}</p>}
        </div>
      ))}
    </>
  )
}
