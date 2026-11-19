import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, CAPABILITIES } from '../supabase'
import { useAuth } from '../auth.jsx'
import { uploadMedia, removeMedia } from '../util.js'
import Avatar from '../components/Avatar.jsx'

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
  const [avatarFile, setAvatarFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)

  useEffect(() => {
    if (profile && !f) {
      setF({ full_name: profile.full_name, title: profile.title, bio: profile.bio, location: profile.location, capabilities: profile.capabilities, avatar_url: profile.avatar_url, cover_url: profile.cover_url })
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
    const next = { ...f }
    try {
      if (avatarFile) {
        if (!avatarFile.type.startsWith('image/')) throw new Error('Profile picture must be a photo.')
        const up = await uploadMedia(avatarFile, user.id, 512)
        if (f.avatar_url) removeMedia(f.avatar_url)
        next.avatar_url = up.url
      }
      if (coverFile) {
        if (!coverFile.type.startsWith('image/')) throw new Error('Cover must be a photo.')
        const up = await uploadMedia(coverFile, user.id, 1280)
        if (f.cover_url) removeMedia(f.cover_url)
        next.cover_url = up.url
      }
    } catch (err) { setMsg(err.message || 'Upload failed'); setBusy(false); return }
    const { error } = await supabase.from('profiles').update(next).eq('id', user.id)
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
      <div className="row" style={{ marginBottom: 12 }}>
        <Avatar p={{ full_name: f.full_name, avatar_url: avatarFile ? URL.createObjectURL(avatarFile) : f.avatar_url }} size={72} />
        <label className="grow">Profile picture
          <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
        </label>
      </div>
      <label>Cover photo (optional)
        <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
      </label>
      <label>Full name<input value={f.full_name} onChange={set('full_name')} required /></label>
      <label>Professional title<input value={f.title} onChange={set('title')} placeholder="e.g. Electrician, Web developer" /></label>
      <label>Location<input value={f.location} onChange={set('location')} placeholder="Town, county" /></label>
      <label>About you<textarea rows={4} value={f.bio} onChange={set('bio')} /></label>

      <p><Link to="/profile/achievements">Add achievements, experience, education and certificates</Link></p>
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
