import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, STAGES } from '../supabase'

export default function Applicants() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [rows, setRows] = useState(null)
  const [msg, setMsg] = useState('')

  async function load() {
    const { data: j } = await supabase.from('jobs').select('id,title').eq('id', id).maybeSingle()
    setJob(j)
    const { data, error } = await supabase
      .from('applications')
      .select('id,status,cover_note,created_at,profiles(id,full_name,title,location,profile_skills(skills(name)))')
      .eq('job_id', id)
      .order('created_at', { ascending: false })
    if (error) setMsg(error.message)
    setRows(data || [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line
  }, [id])

  async function setStage(appId, status) {
    setMsg('')
    const { error } = await supabase.from('applications').update({ status }).eq('id', appId)
    if (error) setMsg(error.message)
    else setRows(rows.map((r) => (r.id === appId ? { ...r, status } : r)))
  }

  if (!rows) return <p className="muted">Loading...</p>
  const counts = rows.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {})

  return (
    <>
      <h2>Applicants</h2>
      {job && <p><Link to={`/job/${job.id}`}>{job.title}</Link></p>}
      <p className="chips">
        <em>Total {rows.length}</em>
        {Object.entries(counts).map(([k, v]) => <em key={k}>{STAGES[k]}: {v}</em>)}
      </p>
      {msg && <p className="notice">{msg}</p>}
      {rows.length === 0 && <p className="muted">No applications yet.</p>}
      {rows.map((r) => (
        <div className="card" key={r.id}>
          <strong><Link to={`/people/${r.profiles?.id}`}>{r.profiles?.full_name || 'Applicant'}</Link></strong>
          <p className="muted">{r.profiles?.title}{r.profiles?.location ? ` - ${r.profiles.location}` : ''}</p>
          <p className="chips">{(r.profiles?.profile_skills || []).map((ps, i) => <em key={i}>{ps.skills?.name}</em>)}</p>
          {r.cover_note && <p>{r.cover_note}</p>}
          <label>Stage
            <select value={r.status} disabled={r.status === 'withdrawn'} onChange={(e) => setStage(r.id, e.target.value)}>
              {Object.entries(STAGES).filter(([k]) => k !== 'withdrawn' || r.status === 'withdrawn').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>
      ))}
    </>
  )
}
