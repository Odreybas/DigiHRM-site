import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, money } from '../supabase'
import { useAuth } from '../auth.jsx'

export default function BuyPanel({ p }) {
  const { user } = useAuth()
  const [mode, setMode] = useState(null)
  const [qty, setQty] = useState(p.min_order || 1)
  const [loc, setLoc] = useState('')
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) return <p className="muted"><Link to="/login">Log in</Link> to order or ask for a quotation.</p>

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const quantity = Math.max(1, Number(qty) || 1)
    const { error } = mode === 'quote'
      ? await supabase.from('quotes').insert({ buyer_id: user.id, seller_id: user.id, kind: 'product', item_id: p.id, quantity, message: text, delivery_location: loc })
      : await supabase.from('orders').insert({ buyer_id: user.id, seller_id: user.id, product_id: p.id, quantity, delivery_location: loc, note: text })
    if (error) setMsg(error.message)
    else { setDone(mode === 'quote' ? 'Quotation request sent.' : 'Order placed.'); setMode(null) }
    setBusy(false)
  }

  return (
    <div className="card">
      <strong>Buy or ask for a price</strong>
      {p.stock != null && <p className="muted small">{p.stock} available</p>}
      {done && <p className="notice">{done} Track it under <Link to="/activity">Activity</Link>.</p>}
      <div className="row wrap">
        {p.price != null && <button className="btn" onClick={() => { setMode('order'); setDone('') }}>Place order</button>}
        <button className="btn ghost" onClick={() => { setMode('quote'); setDone('') }}>Request quotation</button>
      </div>
      {mode && (
        <form onSubmit={submit}>
          <label>Quantity<input type="number" min={p.min_order || 1} value={qty} onChange={(e) => setQty(e.target.value)} required /></label>
          {mode === 'order' && p.price != null && <p className="price">Total: {money(Number(p.price) * (Number(qty) || 1))}</p>}
          <label>Delivery town or area<input value={loc} onChange={(e) => setLoc(e.target.value)} maxLength={200} /></label>
          <label>{mode === 'quote' ? 'Message to the seller' : 'Note (optional)'}<textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} /></label>
          {mode === 'order' && <p className="muted small">Payment is arranged directly with the seller for now. Online payment comes in the next phase.</p>}
          {msg && <p className="notice">{msg}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Sending...' : mode === 'quote' ? 'Send request' : 'Confirm order'}</button>
        </form>
      )}
    </div>
  )
}
