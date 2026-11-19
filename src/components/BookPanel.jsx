import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'

export default function BookPanel({ s }) {
  const { user } = useAuth()
  const [mode, setMode] = useState(null)
  const [when, setWhen] = useState('')
  const [place, setPlace] = useState('')
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) return <p className="muted"><Link to="/login">Log in</Link> to book or ask for a quotation.</p>
  if (s.availability === 'unavailable') return <p className="muted">This service is not available right now.</p>

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    let res
    if (mode === 'quote') {
      res = await supabase.from('quotes').insert({ buyer_id: user.id, seller_id: user.id, kind: 'service', item_id: s.id, quantity: 1, message: text, delivery_location: place })
    } else {
      if (!when) { setMsg('Choose a date and time.'); setBusy(false); return }
      res = await supabase.from('bookings').insert({
        customer_id: user.id, provider_id: user.id, service_id: s.id,
        scheduled_for: new Date(when).toISOString(), place_note: place, note: text,
      })
    }
    if (res.error) setMsg(res.error.message)
    else { setDone(mode === 'quote' ? 'Quotation request sent.' : 'Booking requested.'); setMode(null) }
    setBusy(false)
  }

  return (
    <div className="card">
      <strong>Book or ask for a quotation</strong>
      {done && <p className="notice">{done} Track it under <Link to="/activity">Activity</Link>.</p>}
      <div className="row wrap">
        <button className="btn" onClick={() => { setMode('book'); setDone('') }}>Book</button>
        <button className="btn ghost" onClick={() => { setMode('quote'); setDone('') }}>Request quotation</button>
      </div>
      {mode && (
        <form onSubmit={submit}>
          {mode === 'book' && <label>Date and time<input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required /></label>}
          <label>Where is the job? (area or landmark)<input value={place} onChange={(e) => setPlace(e.target.value)} maxLength={300} /></label>
          <label>{mode === 'quote' ? 'Describe the job' : 'Note (optional)'}<textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} /></label>
          <p className="muted small">Only the provider sees the place you enter.</p>
          {msg && <p className="notice">{msg}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Sending...' : 'Send'}</button>
        </form>
      )}
    </div>
  )
}
