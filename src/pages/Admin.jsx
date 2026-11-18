import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'
import { timeAgo } from '../util.js'

const TABLES = { post: 'posts', comment: 'post_comments', product: 'products', service: 'services', job: 'jobs', business: 'businesses', review: 'reviews' }
const PATHS = { post: '/post/', person: '/people/', business: '/business/', product: '/product/', service: '/service/', job: '/job/' }

export default function Admin() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(undefined)
  const [tab, setTab] = useState('verification')
  const [reqs, setReqs] = useState([])
  const [reports, setReports] = useState([])
  const [notes, setNotes] = useState({})
  const [msg, setMsg] = useState('')

  async function load() {
    const { data: v } = await supabase.from('verification_requests')
      .select('*,profiles!verification_requests_requester_id_fkey(id,full_name),businesses(name)')
      .eq('status', 'pending').order('created_at')
    setReqs(v || [])
    const { data: r } = await supabase.from('reports')
      .select('*,profiles!reports_reporter_id_fkey(full_name)')
      .eq('status', 'open').order('created_at')
    setReports(r || [])
  }

  useEffect(() => {
    supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      setIsAdmin(!!data)
      if (data) load()
    })
    // eslint-disable-next-line
  }, [])

  if (isAdmin === undefined) return <p className="muted">Loading...</p>
  if (!isAdmin) return <p>This page is only for administrators.</p>

  async function openDoc(path) {
    const { data, error } = await supabase.storage.from('verification-docs').createSignedUrl(path, 120)
    if (error) setMsg(error.message)
    else window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function decide(r, status) {
    setMsg('')
    const { error } = await supabase.from('verification_requests').update({ status, admin_note: notes[r.id] || '' }).eq('id', r.id)
    if (error) setMsg(error.message)
    else load()
  }

  async function closeReport(rep, status) {
    setMsg('')
    const { error } = await supabase.from('reports').update({
      status, admin_note: notes[rep.id] || '', resolved_by: user.id, resolved_at: new Date().toISOString(),
    }).eq('id', rep.id)
    if (error) setMsg(error.message)
    else load()
  }

  async function deleteTarget(rep) {
    const table = TABLES[rep.target_kind]
    if (!table || !window.confirm(`Delete this ${rep.target_kind} permanently?`)) return
    const { error } = await supabase.from(table).delete().eq('id', rep.target_id)
    if (error) { setMsg(error.message); return }
    await closeReport(rep, 'resolved')
  }

  return (
    <>
      <h2>Admin</h2>
      <div className="chips pick" style={{ marginBottom: 12 }}>
        <button className={tab === 'verification' ? 'on' : ''} onClick={() => setTab('verification')}>Verification ({reqs.length})</button>
        <button className={tab === 'reports' ? 'on' : ''} onClick={() => setTab('reports')}>Reports ({reports.length})</button>
      </div>
      {msg && <p className="notice">{msg}</p>}

      {tab === 'verification' && (
        <>
          {reqs.length === 0 && <p className="muted">No pending requests.</p>}
          {reqs.map((r) => (
            <div className="card" key={r.id}>
              <strong><Link to={`/people/${r.profiles?.id}`}>{r.profiles?.full_name || 'Unnamed'}</Link></strong>
              <p className="chips"><em>{r.kind}</em>{r.businesses?.name && <em>{r.businesses.name}</em>}<em>{timeAgo(r.created_at)}</em></p>
              {r.note && <p>{r.note}</p>}
              {r.doc_path && <button className="btn ghost" onClick={() => openDoc(r.doc_path)}>View document</button>}
              <label>Note to the user (optional)
                <input value={notes[r.id] || ''} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
              </label>
              <div className="row wrap">
                <button className="btn" onClick={() => decide(r, 'approved')}>Approve</button>
                <button className="btn danger" onClick={() => decide(r, 'rejected')}>Reject</button>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'reports' && (
        <>
          {reports.length === 0 && <p className="muted">No open reports.</p>}
          {reports.map((r) => (
            <div className="card" key={r.id}>
              <strong>{r.target_kind}</strong> <span className="muted small">reported by {r.profiles?.full_name || 'someone'} {timeAgo(r.created_at)}</span>
              <p>{r.reason || 'No reason given.'}</p>
              {PATHS[r.target_kind] && <p><Link to={`${PATHS[r.target_kind]}${r.target_id}`}>Open item</Link></p>}
              <label>Note (optional)
                <input value={notes[r.id] || ''} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
              </label>
              <div className="row wrap">
                {TABLES[r.target_kind] && <button className="btn danger" onClick={() => deleteTarget(r)}>Delete item</button>}
                <button className="btn ghost" onClick={() => closeReport(r, 'resolved')}>Mark resolved</button>
                <button className="btn ghost" onClick={() => closeReport(r, 'dismissed')}>Dismiss</button>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  )
}
