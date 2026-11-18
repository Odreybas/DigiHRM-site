import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, STAGES } from '../supabase'
import { useAuth } from '../auth.jsx'

export default function MyApplications() {
  const { user } = useAuth()
  const [rows, setRows] = useState(null)

  useEffect(() => {
    supabase.from('applications').select('id,status,created_at,jobs(id,title,businesses(name))')
      .eq('applicant_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setRows(data || []))
  }, [user.id])

  if (!rows) return <p className="muted">Loading...</p>
  return (
    <>
      <h2>My applications</h2>
      {rows.length === 0 && <p className="muted">You have not applied for any job yet. <Link to="/explore?tab=jobs">Browse jobs</Link></p>}
      {rows.map((r) => (
        <Link key={r.id} to={`/job/${r.jobs?.id}`} className="card item">
          <strong>{r.jobs?.title}</strong>
          <span className="muted">{r.jobs?.businesses?.name || 'Individual employer'}</span>
          <span className="chips"><em>{STAGES[r.status]}</em></span>
        </Link>
      ))}
    </>
  )
}
