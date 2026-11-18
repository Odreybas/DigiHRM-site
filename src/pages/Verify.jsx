import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'
import { timeAgo } from '../util.js'
import Badges from '../components/Badges.jsx'

const KINDS = {
  identity: 'Identity (you are who you say you are)',
  business: 'Business (your business is real)',
  qualification: 'Qualification (certificate or licence)',
}

export default function Verify() {
  const { user } = useAuth()
  const [kind, setKind] = useState('identity')
  const [bizList, setBizList] = useState([])
  const [biz, setBiz] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState(null)
  const [reqs, setReqs] = useState([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const { data } = await supabase.from('verification_requests').select('*').eq('requester_id', user.id).order('created_at', { ascending: false })
    setReqs(data || [])
  }

  useEffect(() => {
    supabase.from('businesses').select('id,name').eq('owner_id', user.id).then(({ data }) => setBizList(data || []))
    load()
    // eslint-disable-next-line
  }, [])

  async function submit(e) {
    e.preventDefault()
    setMsg('')
    if (!file) { setMsg('Please attach a clear photo or PDF of the document.'); return }
    if (kind === 'business' && !biz) { setMsg('Choose which business to verify.'); return }
    if (file.size > 10 * 1024 * 1024) { setMsg('The file is too large. Keep it under 10 MB.'); return }
    setBusy(true)
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `${user.id}/${Date.now()}.${ext}`
    const up = await supabase.storage.from('verification-docs').upload(path, file, { contentType: file.type })
    if (up.error) { setMsg(up.error.message); setBusy(false); return }
    const { error } = await supabase.from('verification_requests').insert({
      requester_id: user.id, kind, business_id: kind === 'business' ? biz : null, note, doc_path: path,
    })
    if (error) setMsg(error.message)
    else { setNote(''); setFile(null); setMsg('Request sent. We will review it and notify you.'); await load() }
    setBusy(false)
  }

  return (
    <>
      <h2>Verification</h2>
      <div className="card">
        <strong>Your badges</strong>
        <Badges profileId={user.id} />
        <p className="muted small">A verified identity does not mean your skills are verified. Each badge shows exactly what was checked.</p>
      </div>

      <form className="card" onSubmit={submit}>
        <strong>Request a badge</strong>
        <label>What should we verify?
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        {kind === 'business' && (
          <label>Business
            <select value={biz} onChange={(e) => setBiz(e.target.value)}>
              <option value="">Choose a business</option>
              {bizList.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
        )}
        <label>Document (photo or PDF)
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <label>Note for the reviewer (optional)<textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></label>
        <p className="muted small">
          Identity: a clear photo of your national ID or passport. Business: registration or permit. Qualification: the certificate.
          Only the DigiHRM administrator can open your document. It is never shown on the site.
        </p>
        {msg && <p className="notice">{msg}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Uploading...' : 'Submit request'}</button>
      </form>

      <h3>Your requests</h3>
      {reqs.length === 0 && <p className="muted">No requests yet.</p>}
      {reqs.map((r) => (
        <div className="card" key={r.id}>
          <strong>{KINDS[r.kind].split(' (')[0]}</strong> <em className="chiplike">{r.status}</em>
          <p className="muted small">{timeAgo(r.created_at)}</p>
          {r.admin_note && <p>Reviewer note: {r.admin_note}</p>}
        </div>
      ))}
    </>
  )
}
