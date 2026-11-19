import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, money } from '../supabase'
import { useAuth } from '../auth.jsx'
import { OrderRow, QuoteRow, BookingRow } from '../components/OpsRows.jsx'
import Team from '../components/Team.jsx'

const PATHS = { product: '/product/', service: '/service/', business: '/business/', person: '/people/', job: '/job/' }

function Insights() {
  const [days, setDays] = useState(30)
  const [d, setD] = useState(null)
  const [names, setNames] = useState({})
  const [err, setErr] = useState('')

  useEffect(() => {
    supabase.rpc('my_insights', { p_days: days }).then(async ({ data, error }) => {
      if (error) { setErr(error.message); return }
      setD(data)
      const out = {}
      for (const [kind, table, col] of [['product', 'products', 'name'], ['service', 'services', 'title'], ['business', 'businesses', 'name'], ['job', 'jobs', 'title']]) {
        const ids = data.top_items.filter((t) => t.kind === kind).map((t) => t.item_id)
        if (ids.length) {
          const { data: rows } = await supabase.from(table).select(`id,${col}`).in('id', ids)
          ;(rows || []).forEach((r) => { out[`${kind}:${r.id}`] = r[col] })
        }
      }
      setNames(out)
    })
  }, [days])

  if (err) return <p className="notice">{err}</p>
  if (!d) return <p className="muted">Loading...</p>
  const maxKind = Math.max(1, ...Object.values(d.views_by_kind))
  const stat = (label, value) => <div className="stat"><strong>{value}</strong><span>{label}</span></div>

  return (
    <>
      <div className="chips pick" style={{ marginBottom: 12 }}>
        {[7, 30, 90].map((n) => <button key={n} className={days === n ? 'on' : ''} onClick={() => setDays(n)}>{n} days</button>)}
      </div>
      <div className="statgrid">
        {stat('Views', d.views)}
        {stat('Followers', d.followers)}
        {stat('Quotation requests', d.quotes)}
        {stat('Orders', d.orders)}
        {stat('Revenue (completed)', money(d.revenue))}
        {stat('Bookings', d.bookings)}
        {stat('Customers', d.customers)}
        {stat('Reviews', d.reviews)}
      </div>
      <p className="muted small">Views count signed-in visitors, once per person per day.</p>
      <div className="card">
        <strong>Views by type</strong>
        {Object.keys(d.views_by_kind).length === 0 && <p className="muted">No views in this period yet.</p>}
        {Object.entries(d.views_by_kind).map(([k, v]) => (
          <div key={k} className="barrow"><span>{k}</span><div className="bar"><div style={{ width: `${(v / maxKind) * 100}%` }} /></div><span>{v}</span></div>
        ))}
      </div>
      {d.top_items.length > 0 && (
        <div className="card">
          <strong>Most viewed</strong>
          {d.top_items.map((t) => (
            <p key={`${t.kind}${t.item_id}`}><Link to={`${PATHS[t.kind]}${t.item_id}`}>{names[`${t.kind}:${t.item_id}`] || t.kind}</Link> <span className="muted">{t.views} views</span></p>
          ))}
        </div>
      )}
      {d.low_stock.length > 0 && (
        <div className="card">
          <strong>Low stock</strong>
          {d.low_stock.map((p) => <p key={p.id}><Link to={`/product/${p.id}/edit`}>{p.name}</Link> <span className="muted">{p.stock} left</span></p>)}
        </div>
      )}
    </>
  )
}

function Stock({ user }) {
  const [rows, setRows] = useState(null)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    supabase.from('products').select('id,name,stock,reorder_level,availability').eq('owner_id', user.id).order('name').then(({ data }) => setRows(data || []))
  }, [user.id])
  async function save(r) {
    setMsg('')
    const { error } = await supabase.from('products').update({
      stock: r.stock === '' || r.stock == null ? null : Number(r.stock),
      reorder_level: r.reorder_level === '' ? 5 : Number(r.reorder_level),
    }).eq('id', r.id)
    setMsg(error ? error.message : 'Saved.')
  }
  const set = (id, k, v) => setRows(rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)))
  if (!rows) return <p className="muted">Loading...</p>
  return (
    <>
      {msg && <p className="notice">{msg}</p>}
      {rows.length === 0 && <p className="muted">No products yet.</p>}
      {rows.map((r) => (
        <div className="card" key={r.id}>
          <strong>{r.name}</strong>
          {r.stock != null && r.stock <= r.reorder_level && <em className="chiplike"> low</em>}
          <div className="row wrap">
            <label className="grow">Stock<input type="number" min="0" value={r.stock ?? ''} onChange={(e) => set(r.id, 'stock', e.target.value)} /></label>
            <label className="grow">Warn at<input type="number" min="0" value={r.reorder_level} onChange={(e) => set(r.id, 'reorder_level', e.target.value)} /></label>
            <button className="btn ghost" onClick={() => save(r)}>Save</button>
          </div>
        </div>
      ))}
    </>
  )
}

export default function Ops() {
  const { user } = useAuth()
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState(null)
  const [quotes, setQuotes] = useState([])
  const [bookings, setBookings] = useState([])

  const load = useCallback(async () => {
    const [o, q, b] = await Promise.all([
      supabase.from('orders').select('*,buyer:profiles!orders_buyer_id_fkey(id,full_name)').neq('buyer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('quotes').select('*,buyer:profiles!quotes_buyer_id_fkey(id,full_name)').neq('buyer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('bookings').select('*,customer:profiles!bookings_customer_id_fkey(id,full_name)').neq('customer_id', user.id).order('scheduled_for', { ascending: false }),
    ])
    setOrders(o.data || [])
    setQuotes(q.data || [])
    setBookings(b.data || [])
  }, [user.id])

  useEffect(() => { load() }, [load])

  if (!orders) return <p className="muted">Loading...</p>
  const pend = (list, st) => list.filter((x) => x.status === st).length

  const customers = {}
  orders.forEach((o) => {
    const c = (customers[o.buyer_id] ||= { who: o.buyer, orders: 0, spent: 0, bookings: 0 })
    c.orders += 1
    if (o.status === 'completed') c.spent += Number(o.total)
  })
  bookings.forEach((b) => {
    const c = (customers[b.customer_id] ||= { who: b.customer, orders: 0, spent: 0, bookings: 0 })
    c.bookings += 1
  })

  const TABS = [
    ['orders', `Orders${pend(orders, 'placed') ? ` (${pend(orders, 'placed')} new)` : ''}`],
    ['quotes', `Quotations${pend(quotes, 'requested') ? ` (${pend(quotes, 'requested')} new)` : ''}`],
    ['bookings', `Bookings${pend(bookings, 'requested') ? ` (${pend(bookings, 'requested')} new)` : ''}`],
    ['customers', 'Customers'], ['stock', 'Stock'], ['insights', 'Insights'], ['team', 'Team'],
  ]

  return (
    <>
      <h2>Business</h2>
      <div className="chips pick" style={{ marginBottom: 12 }}>
        {TABS.map(([k, label]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>)}
      </div>
      {tab === 'orders' && (orders.length ? orders.map((o) => <OrderRow key={o.id} o={o} side="seller" onChange={load} />) : <p className="muted">No orders yet.</p>)}
      {tab === 'quotes' && (quotes.length ? quotes.map((q) => <QuoteRow key={q.id} q={q} side="seller" onChange={load} />) : <p className="muted">No quotation requests yet.</p>)}
      {tab === 'bookings' && (bookings.length ? bookings.map((b) => <BookingRow key={b.id} b={b} side="seller" onChange={load} />) : <p className="muted">No bookings yet.</p>)}
      {tab === 'customers' && (Object.keys(customers).length === 0 ? <p className="muted">Customers appear here after their first order or booking.</p> :
        Object.entries(customers).map(([id, c]) => (
          <div className="card" key={id}>
            <strong><Link to={`/people/${id}`}>{c.who?.full_name || 'Customer'}</Link></strong>
            <p className="muted">{c.orders} orders - {money(c.spent)} completed - {c.bookings} bookings</p>
          </div>
        )))}
      {tab === 'stock' && <Stock user={user} />}
      {tab === 'insights' && <Insights />}
      {tab === 'team' && <Team user={user} />}
    </>
  )
}
