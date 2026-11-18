import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'

export default function BusinessForm() {
  const { id } = useParams()
  const { user, profile, reloadProfile } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', category: '', location: '', county: '', delivery_areas: '', phone: '', description: '' })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase.from('businesses').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (data) setF({ name: data.name, category: data.category, location: data.location, county: data.county, delivery_areas: data.delivery_areas, phone: data.phone, description: data.description })
    })
  }, [id])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    let error
    if (id) {
      ({ error } = await supabase.from('businesses').update(f).eq('id', id))
    } else {
      ({ error } = await supabase.from('businesses').insert({ ...f, owner_id: user.id }))
      if (!error && profile && !profile.capabilities.includes('business')) {
        await supabase.from('profiles').update({ capabilities: [...profile.capabilities, 'business'] }).eq('id', user.id)
        await reloadProfile()
      }
    }
    if (error) { setMsg(error.message); setBusy(false); return }
    nav('/dashboard')
  }

  async function remove() {
    if (!window.confirm('Delete this business?')) return
    const { error } = await supabase.from('businesses').delete().eq('id', id)
    if (error) setMsg(error.message)
    else nav('/dashboard')
  }

  return (
    <form className="card" onSubmit={save}>
      <h2>{id ? 'Edit business' : 'Add a business'}</h2>
      <label>Business name<input value={f.name} onChange={set('name')} required /></label>
      <label>Type of business<input value={f.category} onChange={set('category')} placeholder="e.g. Steel supplier, Plumbing" /></label>
      <label>Location<input value={f.location} onChange={set('location')} placeholder="Town, county" /></label>
      <label>County<input value={f.county} onChange={set('county')} /></label>
      <label>Delivers to (towns or counties)<input value={f.delivery_areas} onChange={set('delivery_areas')} placeholder="e.g. Kiambu, Machakos, Nakuru" /></label>
      <label>Phone<input value={f.phone} onChange={set('phone')} /></label>
      <label>Description<textarea rows={4} value={f.description} onChange={set('description')} /></label>
      {msg && <p className="notice">{msg}</p>}
      <div className="row wrap">
        <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save business'}</button>
        {id && <button type="button" className="btn danger" onClick={remove}>Delete</button>}
      </div>
    </form>
  )
}
