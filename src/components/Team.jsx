import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, clean } from '../supabase'

const ROLES = {
  administrator: 'Administrator (everything)',
  manager: 'Manager (listings, orders, bookings)',
  sales: 'Sales representative (quotes, orders, bookings)',
  content_editor: 'Content editor (products and services)',
  support: 'Customer support (view orders and enquiries)',
}

export default function Team({ user }) {
  const [biz, setBiz] = useState([])
  const [sel, setSel] = useState('')
  const [members, setMembers] = useState([])
  const [q, setQ] = useState('')
  const [found, setFound] = useState([])
  const [role, setRole] = useState('sales')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('businesses').select('id,name').eq('owner_id', user.id).then(({ data }) => {
      setBiz(data || [])
      if (data?.length) setSel(data[0].id)
    })
  }, [user.id])

  async function loadMembers() {
    if (!sel) return
    const { data } = await supabase.from('business_members')
      .select('user_id,role,profiles!business_members_user_id_fkey(id,full_name)').eq('business_id', sel)
    setMembers(data || [])
  }
  useEffect(() => {
    loadMembers()
    // eslint-disable-next-line
  }, [sel])

  async function search(e) {
    e.preventDefault()
    const t = clean(q)
    if (t.length < 2) return
    const { data } = await supabase.from('profiles').select('id,full_name,title').ilike('full_name', `%${t}%`).neq('id', user.id).limit(8)
    setFound(data || [])
  }

  async function add(pid) {
    setMsg('')
    const { error } = await supabase.from('business_members').insert({ business_id: sel, user_id: pid, role })
    if (error) setMsg(error.message.includes('duplicate') ? 'That person is already on the team.' : error.message)
    else { setFound([]); setQ(''); loadMembers() }
  }

  async function remove(pid) {
    await supabase.from('business_members').delete().eq('business_id', sel).eq('user_id', pid)
    loadMembers()
  }

  async function changeRole(pid, r) {
    await supabase.from('business_members').update({ role: r }).eq('business_id', sel).eq('user_id', pid)
    loadMembers()
  }

  if (biz.length === 0) return <p className="muted">Add a business first, then you can add team members to it.</p>

  return (
    <>
      <label>Business
        <select value={sel} onChange={(e) => setSel(e.target.value)}>
          {biz.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>
      <div className="card">
        <strong>Team</strong>
        {members.length === 0 && <p className="muted">Only you for now.</p>}
        {members.map((m) => (
          <div key={m.user_id} className="item2">
            <div className="between">
              <Link to={`/people/${m.user_id}`}>{m.profiles?.full_name || 'Member'}</Link>
              <button className="linkbtn small" onClick={() => remove(m.user_id)}>Remove</button>
            </div>
            <select value={m.role} onChange={(e) => changeRole(m.user_id, e.target.value)}>
              {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        ))}
      </div>
      <form className="card" onSubmit={search}>
        <strong>Add a team member</strong>
        <p className="muted small">They need a DigiHRM account. Search by name.</p>
        <label>Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <div className="row">
          <input className="grow" placeholder="Name" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn">Search</button>
        </div>
        {found.map((p) => (
          <div key={p.id} className="between item2">
            <span>{p.full_name} <span className="muted small">{p.title}</span></span>
            <button type="button" className="btn ghost" onClick={() => add(p.id)}>Add</button>
          </div>
        ))}
        {msg && <p className="notice">{msg}</p>}
      </form>
    </>
  )
}
