import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase, JOB_TYPES, STAGES, salary, place, isClosed } from '../supabase'
import { useAuth } from '../auth.jsx'
import SaveButton from '../components/SaveButton.jsx'
import MessageButton from '../components/MessageButton.jsx'

export default function JobPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const [j, setJ] = useState(undefined)
  const [app, setApp] = useState(null)
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadApp() {
    if (!user) return
    const { data } = await supabase.from('applications').select('*').eq('job_id', id).eq('applicant_id', user.id).maybeSingle()
    setApp(data)
  }

  useEffect(() => {
    supabase.from('jobs').select('*,businesses(id,name)').eq('id', id).maybeSingle().then(({ data }) => setJ(data))
    loadApp()
    // eslint-disable-next-line
  }, [id, user])

  if (j === undefined) return <p className="muted">Loading...</p>
  if (!j) return <p>This job does not exist.</p>

  const isOwner = user?.id === j.owner_id
  const closed = isClosed(j)

  async function apply(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const { error } = await supabase.from('applications').insert({ job_id: id, applicant_id: user.id, cover_note: note })
    if (error) setMsg(error.message)
    else { setNote(''); await loadApp() }
    setBusy(false)
  }

  async function withdraw() {
    if (!window.confirm('Withdraw your application?')) return
    const { error } = await supabase.from('applications').update({ status: 'withdrawn' }).eq('id', app.id)
    if (error) setMsg(error.message)
    else await loadApp()
  }

  return (
    <>
      <div className="card">
        <div className="between"><h2>{j.title}</h2><SaveButton kind="job" id={j.id} /></div>
        {j.businesses && <p><Link to={`/business/${j.businesses.id}`}>{j.businesses.name}</Link></p>}
        <p className="muted">{place(j.town, j.county) || 'Location not stated'}</p>
        <p className="price">{salary(j.salary_min, j.salary_max)}</p>
        <p className="chips">
          <em>{JOB_TYPES[j.job_type]}</em>
          {j.deadline && <em>Deadline {j.deadline}</em>}
          {closed && <em>Closed</em>}
        </p>
        {j.description && <><h3>About the job</h3><p>{j.description}</p></>}
        {j.requirements && <><h3>Requirements</h3><p>{j.requirements}</p></>}
        {j.qualifications && <><h3>Qualifications</h3><p>{j.qualifications}</p></>}
        {isOwner && (
          <div className="row wrap">
            <Link className="btn" to={`/job/${j.id}/applicants`}>View applicants</Link>
            <Link className="btn ghost" to={`/job/${j.id}/edit`}>Edit job</Link>
          </div>
        )}
      </div>

      {!isOwner && (
        <div className="card">
          <strong>Apply</strong>
          {!user && <p className="muted"><Link to="/login">Log in</Link> to apply. Your DigiHRM profile and skills are sent as your CV.</p>}
          {user && app && (
            <>
              <p>Your application: <strong>{STAGES[app.status]}</strong></p>
              {app.status !== 'withdrawn' && app.status !== 'hired' && app.status !== 'rejected' && (
                <button className="btn danger" onClick={withdraw}>Withdraw application</button>
              )}
            </>
          )}
          {user && !app && closed && <p className="muted">This job is no longer accepting applications.</p>}
          {user && !app && !closed && (
            <form onSubmit={apply}>
              <p className="muted small">The employer will see your profile, skills and this note. Keep your profile up to date.</p>
              <label>Short cover note
                <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} maxLength={3000} />
              </label>
              {msg && <p className="notice">{msg}</p>}
              <button className="btn" disabled={busy}>{busy ? 'Sending...' : 'Submit application'}</button>
            </form>
          )}
          {msg && app && <p className="notice">{msg}</p>}
          <p><MessageButton toId={j.owner_id} kind="job" id={j.id} title={j.title} label="Message the employer" /></p>
        </div>
      )}
    </>
  )
}
