import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, money } from '../supabase'
import { timeAgo } from '../util.js'

function Err({ msg }) { return msg ? <p className="notice">{msg}</p> : null }

export function OrderRow({ o, side, onChange }) {
  const [msg, setMsg] = useState('')
  const other = side === 'seller' ? o.buyer : o.seller
  async function go(status) {
    setMsg('')
    const { error } = await supabase.from('orders').update({ status }).eq('id', o.id)
    if (error) setMsg(error.message)
    else onChange()
  }
  const acts = side === 'seller'
    ? { placed: [['Confirm', 'confirmed'], ['Cancel', 'cancelled']], confirmed: [['Mark shipped', 'shipped'], ['Cancel', 'cancelled']], shipped: [['Mark delivered', 'delivered']] }
    : { placed: [['Cancel order', 'cancelled']], delivered: [['I received it', 'completed']] }
  return (
    <div className="card">
      <div className="between"><strong>{o.quantity} x {o.product_name}</strong><em className="chiplike">{o.status}</em></div>
      <p className="price">{money(o.total)}</p>
      <p className="muted small">
        {side === 'seller' ? 'Buyer' : 'Seller'}: {other ? <Link to={`/people/${other.id}`}>{other.full_name || 'Someone'}</Link> : 'Someone'} - {timeAgo(o.created_at)}
        {o.delivery_location && <> - Deliver to {o.delivery_location}</>}
      </p>
      {o.note && <p>{o.note}</p>}
      {side === 'seller' && o.status === 'delivered' && <p className="muted small">Waiting for the buyer to confirm they received it.</p>}
      <div className="row wrap">{(acts[o.status] || []).map(([label, st]) => <button key={st} className={st === 'cancelled' ? 'btn danger' : 'btn'} onClick={() => go(st)}>{label}</button>)}</div>
      <Err msg={msg} />
    </div>
  )
}

export function QuoteRow({ q, side, hasOrder, onChange }) {
  const [price, setPrice] = useState(q.quoted_price ?? '')
  const [until, setUntil] = useState(q.valid_until || '')
  const [note, setNote] = useState(q.seller_note || '')
  const [msg, setMsg] = useState('')
  const other = side === 'seller' ? q.buyer : q.seller
  async function upd(patch) {
    setMsg('')
    const { error } = await supabase.from('quotes').update(patch).eq('id', q.id)
    if (error) setMsg(error.message)
    else onChange()
  }
  async function orderNow() {
    setMsg('')
    const { error } = await supabase.from('orders').insert({ buyer_id: q.buyer_id, seller_id: q.buyer_id, product_id: q.item_id, quantity: q.quantity, quote_id: q.id, delivery_location: q.delivery_location })
    if (error) setMsg(error.message)
    else onChange()
  }
  return (
    <div className="card">
      <div className="between"><strong>{q.quantity} x {q.item_title}</strong><em className="chiplike">{q.status}</em></div>
      <p className="muted small">
        {side === 'seller' ? 'From' : 'To'}: {other ? <Link to={`/people/${other.id}`}>{other.full_name || 'Someone'}</Link> : 'Someone'} - {timeAgo(q.created_at)}
        {q.delivery_location && <> - {q.delivery_location}</>}
      </p>
      {q.message && <p>{q.message}</p>}
      {q.quoted_price != null && <p className="price">Quoted: {money(q.quoted_price)}{q.valid_until ? ` (valid until ${q.valid_until})` : ''}</p>}
      {q.seller_note && <p className="muted">{q.seller_note}</p>}

      {side === 'seller' && (q.status === 'requested' || q.status === 'quoted') && (
        <>
          <div className="row wrap">
            <label className="grow">Total price (KES)<input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
            <label className="grow">Valid until<input type="date" value={until} onChange={(e) => setUntil(e.target.value)} /></label>
          </div>
          <label>Note<input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} /></label>
          <div className="row wrap">
            <button className="btn" onClick={() => upd({ status: 'quoted', quoted_price: price === '' ? null : Number(price), valid_until: until || null, seller_note: note })}>Send quotation</button>
            <button className="btn danger" onClick={() => upd({ status: 'declined' })}>Decline</button>
          </div>
        </>
      )}
      {side === 'buyer' && q.status === 'quoted' && (
        <div className="row wrap">
          <button className="btn" onClick={() => upd({ status: 'accepted' })}>Accept</button>
          <button className="btn danger" onClick={() => upd({ status: 'cancelled' })}>Cancel</button>
        </div>
      )}
      {side === 'buyer' && q.status === 'requested' && <button className="btn danger" onClick={() => upd({ status: 'cancelled' })}>Cancel request</button>}
      {side === 'buyer' && q.status === 'accepted' && q.kind === 'product' && !hasOrder && <button className="btn" onClick={orderNow}>Place order at this price</button>}
      {side === 'buyer' && q.status === 'accepted' && q.kind === 'service' && <p className="muted small">Accepted. Message the provider to agree a time, or book from the service page.</p>}
      <Err msg={msg} />
    </div>
  )
}

export function BookingRow({ b, side, onChange }) {
  const [msg, setMsg] = useState('')
  const other = side === 'seller' ? b.customer : b.provider
  async function go(status) {
    setMsg('')
    const { error } = await supabase.from('bookings').update({ status }).eq('id', b.id)
    if (error) setMsg(error.message)
    else onChange()
  }
  const acts = side === 'seller'
    ? { requested: [['Confirm', 'confirmed'], ['Decline', 'declined']], confirmed: [['Mark completed', 'completed'], ['Cancel', 'cancelled']] }
    : { requested: [['Cancel booking', 'cancelled']], confirmed: [['Cancel booking', 'cancelled']] }
  return (
    <div className="card">
      <div className="between"><strong>{b.service_title}</strong><em className="chiplike">{b.status}</em></div>
      <p className="price">{new Date(b.scheduled_for).toLocaleString()}</p>
      <p className="muted small">
        {side === 'seller' ? 'Customer' : 'Provider'}: {other ? <Link to={`/people/${other.id}`}>{other.full_name || 'Someone'}</Link> : 'Someone'}
        {b.place_note && <> - Place: {b.place_note}</>}
      </p>
      {b.note && <p>{b.note}</p>}
      <div className="row wrap">{(acts[b.status] || []).map(([label, st]) => <button key={st} className={st === 'cancelled' || st === 'declined' ? 'btn danger' : 'btn'} onClick={() => go(st)}>{label}</button>)}</div>
      <Err msg={msg} />
    </div>
  )
}
