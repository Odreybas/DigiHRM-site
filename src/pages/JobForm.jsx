import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, JOB_TYPES, COUNTIES } from '../supabase'
import { useAuth } from '../auth.jsx'

const empty = {
  title: '', job_type: 'full_time', description: '', requirements: '', qualifications: '',
  town: '', county: '', salary_min: '', salary_max: '', deadline: '', status: 'open', business_id: '',
}

export default function JobForm() {
  const { id } = useParams()
  const { user, profile, reloadProfile } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState(empty)
  const [bizList, setBizList] = useState([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('businesses').select('id,name').eq('owner_id', user.id).then(({ data }) => setBizList(data || []))
    if (id) {
      supabase.from('jobs').select('*').eq('id', id).maybeSingle().then(({ data }) => {
        if (data) setF({
          ...empty, ...data,
          salary_min: data.salary_min ?? '', salary_max: data.salary_max ?? '',
          deadline: data.deadline || '', business_id: data.business_id || '',
        })
      })
    }
  }, [id, user.id])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const row = {
      title: f.title, job_type: f.job_type, description: f.description, requirements: f.requirements,
      qualifications: f.qualifications, town: f.town, county: f.county,
      salary_min: f.salary_min === '' ? null : Number(f.salary_min),
      salary_max: f.salary_max === '' ? null : Number(f.salary_max),
      deadline: f.deadline || null, status: f.status, business_id: f.business_id || null,
    }
    const { error } = id
      ? await supabase.from('jobs').update(row).eq('id', id)
      : await supabase.from('jobs').insert({ ...row, owner_id: user.id })
    if (error) { setMsg(error.message); setBusy(false); return }
    if (!id && profile && !profile.capabilities.includes('employer')) {
      await supabase.from('profiles').update({ capabilities: [...profile.capabilities, 'employer'] }).eq('id', user.id)
      await reloadProfile()
    }
    nav('/dashboard')
  }

  async function remove() {
    if (!window.confirm('Delete this job and all its applications?')) return
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (error) setMsg(error.message)
    else nav('/dashboard')
  }

  return (
    <form className="card" onSubmit={save}>
      <h2>{id ? 'Edit job' : 'Post a job'}</h2>
      <label>Job title<input value={f.title} onChange={set('title')} required minLength={2} /></label>
      <label>Job type
        <select value={f.job_type} onChange={set('job_type')}>
          {Object.entries(JOB_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label>About the job<textarea rows={4} value={f.description} onChange={set('description')} /></label>
      <label>Requirements and skills<textarea rows={3} value={f.requirements} onChange={set('requirements')} /></label>
      <label>Qualifications<input value={f.qualifications} onChange={set('qualifications')} placeholder="e.g. Diploma in IT, KCSE C+" /></label>
      <label>Town<input value={f.town} onChange={set('town')} /></label>
      <label>County<input list="counties-form" value={f.county} onChange={set('county')} /></label>
      <datalist id="counties-form">{COUNTIES.map((c) => <option key={c} value={c} />)}</datalist>
      <div className="row wrap">
        <label className="grow">Pay from (KES)<input type="number" min="0" value={f.salary_min} onChange={set('salary_min')} /></label>
        <label className="grow">Pay up to (KES)<input type="number" min="0" value={f.salary_max} onChange={set('salary_max')} /></label>
      </div>
      <label>Application deadline<input type="date" value={f.deadline} onChange={set('deadline')} /></label>
      <label>Posting as
        <select value={f.business_id} onChange={set('business_id')}>
          <option value="">Myself</option>
          {bizList.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>
      {id && (
        <label>Status
          <select value={f.status} onChange={set('status')}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </label>
      )}
      {msg && <p className="notice">{msg}</p>}
      <div className="row wrap">
        <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save job'}</button>
        {id && <button type="button" className="btn danger" onClick={remove}>Delete</button>}
      </div>
    </form>
  )
}
