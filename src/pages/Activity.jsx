import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'
import { OrderRow, QuoteRow, BookingRow } from '../components/OpsRows.jsx'

export default function Activity() {
  const { user } = useAuth()
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState(null)
  const [quotes, setQuotes] = useState([])
  const [bookings, setBookings] = useState([])

  const load = useCallback(async () => {
    const [o, q, b] = await Promise.all([
      supabase.from('orders').select('*,seller:profiles!orders_seller_id_fkey(id,full_name)').eq('buyer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('quotes').select('*,seller:profiles!quotes_seller_id_fkey(id,full_name)').eq('buyer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('bookings').select('*,provider:profiles!bookings_provider_id_fkey(id,full_name)').eq('customer_id', user.id).order('scheduled_for', { ascending: false }),
    ])
    setOrders(o.data || [])
    setQuotes(q.data || [])
    setBookings(b.data || [])
  }, [user.id])

  useEffect(() => { load() }, [load])

  if (!orders) return <p className="muted">Loading...</p>
  const ordered = new Set(orders.map((o) => o.quote_id).filter(Boolean))

  return (
    <>
      <h2>My activity</h2>
      <div className="chips pick" style={{ marginBottom: 12 }}>
        <button className={tab === 'orders' ? 'on' : ''} onClick={() => setTab('orders')}>Orders ({orders.length})</button>
        <button className={tab === 'quotes' ? 'on' : ''} onClick={() => setTab('quotes')}>Quotations ({quotes.length})</button>
        <button className={tab === 'bookings' ? 'on' : ''} onClick={() => setTab('bookings')}>Bookings ({bookings.length})</button>
      </div>
      {tab === 'orders' && (orders.length ? orders.map((o) => <OrderRow key={o.id} o={o} side="buyer" onChange={load} />) : <p className="muted">No orders yet.</p>)}
      {tab === 'quotes' && (quotes.length ? quotes.map((q) => <QuoteRow key={q.id} q={q} side="buyer" hasOrder={ordered.has(q.id)} onChange={load} />) : <p className="muted">No quotations yet.</p>)}
      {tab === 'bookings' && (bookings.length ? bookings.map((b) => <BookingRow key={b.id} b={b} side="buyer" onChange={load} />) : <p className="muted">No bookings yet.</p>)}
    </>
  )
}
