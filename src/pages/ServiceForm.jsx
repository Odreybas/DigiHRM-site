import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, SERVICE_CATEGORIES, COUNTIES } from '../supabase'
import { useAuth } from '../auth.jsx'

const empty = {
  title: '', category: '', description: '', price_note: '', town: '', county: '',
  areas_served: '', availability: 'available', business_id: '',
}

export default function ServiceForm() {
  const { id } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState(empty)
  const [bizList, setBizList] = useState([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('businesses').select('id,name').eq('owner_id', user.id).then(({ data }) => setBizList(data || []))
    if (id) {
      supabase.from('services').select('*').eq('id', id).maybeSingle().then(({ data }) => {
        if (data) setF({ ...empty, ...data, business_id: data.business_id || '' })
      })
    }
  }, [id, user.id])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const row = {
      title: f.title, category: f.category, description: f.description, price_note: f.price_note,
      town: f.town, county: f.county, areas_served: f.areas_served, availability: f.availability,
      business_id: f.business_id || null,
    }
    const { error } = id
      ? await supabase.from('services').update(row).eq('id', id)
      : await supabase.from('services').insert({ ...row, owner_id: user.id })
    if (error) { setMsg(error.message); setBusy(false); return }
    nav('/dashboard')
  }

  async function remove() {
    if (!window.confirm('Delete this service?')) return
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) setMsg(error.message)
    else nav('/dashboard')
  }

  return (
    <form className="card" onSubmit={save}>
      <h2>{id ? 'Edit service' : 'Add a service'}</h2>
      <label>Service title<input value={f.title} onChange={set('title')} required minLength={2} placeholder="e.g. House wiring and repairs" /></label>
      <label>Category
        <select value={f.category} onChange={set('category')}>
          <option value="">Choose a category</option>
          {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label>Description<textarea rows={4} value={f.description} onChange={set('description')} /></label>
      <label>Pricing<input value={f.price_note} onChange={set('price_note')} placeholder="e.g. From KES 1,500 per visit, or ask for a quote" /></label>
      <label>Town<input value={f.town} onChange={set('town')} /></label>
      <label>County<input list="counties-form" value={f.county} onChange={set('county')} /></label>
      <datalist id="counties-form">{COUNTIES.map((c) => <option key={c} value={c} />)}</datalist>
      <label>Areas you work in<input value={f.areas_served} onChange={set('areas_served')} placeholder="e.g. Murang'a town, Kenol, Thika" /></label>
      <label>Availability
        <select value={f.availability} onChange={set('availability')}>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </label>
      <label>Offered by
        <select value={f.business_id} onChange={set('business_id')}>
          <option value="">Myself (no business)</option>
          {bizList.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>
      <p className="muted small">Your exact home address is never shown. Only the town and areas you enter appear.</p>
      {msg && <p className="notice">{msg}</p>}
      <div className="row wrap">
        <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save service'}</button>
        {id && <button type="button" className="btn danger" onClick={remove}>Delete</button>}
      </div>
    </form>
  )
}
