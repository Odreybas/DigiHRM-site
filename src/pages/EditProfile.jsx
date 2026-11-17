import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, CAPABILITIES } from '../supabase'
import { useAuth } from '../auth.jsx'

export default function EditProfile() {
  const { user, profile, reloadProfile } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState(null)
  const [allSkills, setAllSkills] = useState([])
  const [picked, setPicked] = useState(new Set())
  const [original, setOriginal] = useState(new Set())
  const [custom, setCustom] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (profile && !f) {
      setF({ full_name: profile.full_name, title: profile.title, bio: profile.bio, location: profile.location, capabilities: profile.capabilities })
    }
  }, [profile, f])

  useEffect(() => {
    supabase.from('skills').select('id,name,category').order('name').then(({ data }) => setAllSkills(data || []))
    if (user) {
      supabase.from('profile_skills').select('skill_id').eq('profile_id', user.id).then(({ data }) => {
        const s = new Set((data || []).map((r) => r.skill_id))
        setPicked(s)
        setOriginal(new Set(s))
      })
    }
  }, [user])

  if (!f) return <p className="muted">Loading...</p>

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const toggleCap = (key) => {
    const has = f.capabilities.includes(key)
    const next = has ? f.capabilities.filter((c) => c !== key) : [...f.capabilities, key]
    setF({ ...f, capabilities: next.length ? next : ['individual'] })
  }
  const toggleSkill = (id) => {
    const s = new Set(picked)
    s.has(id) ? s.delete(id) : s.add(id)
    setPicked(s)
  }

  async function addCustom() {
    const name = custom.trim()
    if (name.length < 2) return
    setMsg('')
    const existing = allSkills.find((s) => s.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      setPicked(new Set(picked).add(existing.id))
    } else {
      const { data, error } = await supabase.from('skills').insert({ name, category: 'Other' }).select('id,name,category').single()
      if (error) { setMsg(error.message); return }
      setAllSkills([...allSkills, data])
      setPicked(new Set(picked).add(data.id))
    }
    setCustom('')
  }

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const { error } = await supabase.from('profiles').update(f).eq('id', user.id)
    if (error) { setMsg(error.message); setBusy(false); return }

    const toAdd = [...picked].filter((id) => !original.has(id))
    const toRemove = [...original].filter((id) => !picked.has(id))
    if (toAdd.length) {
      const { error: e1 } = await supabase.from('profile_skills').insert(toAdd.map((skill_id) => ({ profile_id: user.id, skill_id })))
      if (e1) { setMsg(e1.message); setBusy(false); return }
    }
    if (toRemove.length) {
      const { error: e2 } = await supabase.from('profile_skills').delete().eq('profile_id', user.id).in('skill_id', toRemove)
      if (e2) { setMsg(e2.message); setBusy(false); return }
    }
    await reloadProfile()
    nav('/dashboard')
  }

  const categories = [...new Set(allSkills.map((s) => s.category))].sort()

  return (
    <form className="card" onSubmit={save}>
      <h2>Edit profile</h2>
      <label>Full name<input value={f.full_name} onChange={set('full_name')} required /></label>
      <label>Professional title<input value={f.title} onChange={set('title')} placeholder="e.g. Electrician, Web developer" /></label>
      <label>Location<input value={f.location} onChange={set('location')} placeholder="Town, county" /></label>
      <label>About you<textarea rows={4} value={f.bio} onChange={set('bio')} /></label>

      <h3>What do you do on DigiHRM?</h3>
      <div className="chips pick">
        {CAPABILITIES.map(([key, label]) => (
          <button type="button" key={key} className={f.capabilities.includes(key) ? 'on' : ''} onClick={() => toggleCap(key)}>{label}</button>
        ))}
      </div>

      <h3>Skills</h3>
      {categories.map((c) => (
        <div key={c}>
          <p className="muted small">{c}</p>
          <div className="chips pick">
            {allSkills.filter((s) => s.category === c).map((s) => (
              <button type="button" key={s.id} className={picked.has(s.id) ? 'on' : ''} onClick={() => toggleSkill(s.id)}>{s.name}</button>
            ))}
          </div>
        </div>
      ))}
      <div className="row">
        <input className="grow" placeholder="Add a skill that is not listed" value={custom} onChange={(e) => setCustom(e.target.value)} />
        <button type="button" className="btn ghost" onClick={addCustom}>Add</button>
      </div>

      {msg && <p className="notice">{msg}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save profile'}</button>
    </form>
  )
}
