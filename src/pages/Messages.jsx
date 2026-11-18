import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'
import { timeAgo } from '../util.js'

export default function Messages() {
  const { user, loading } = useAuth()
  const [rows, setRows] = useState(null)

  const load = useCallback(async () => {
    const { data: convs } = await supabase.from('conversations').select('*').order('last_message_at', { ascending: false })
    if (!convs?.length) { setRows([]); return }
    const others = convs.map((c) => (c.user_a === user.id ? c.user_b : c.user_a))
    const [{ data: people }, { data: msgs }] = await Promise.all([
      supabase.from('profiles').select('id,full_name').in('id', others),
      supabase.from('messages').select('conversation_id,body,sender_id,read_at,created_at,context_title')
        .in('conversation_id', convs.map((c) => c.id)).order('created_at', { ascending: false }).limit(300),
    ])
    setRows(convs.map((c) => {
      const other = c.user_a === user.id ? c.user_b : c.user_a
      const mine = (msgs || []).filter((m) => m.conversation_id === c.id)
      return {
        id: c.id,
        name: people?.find((p) => p.id === other)?.full_name || 'Someone',
        last: mine[0],
        unread: mine.filter((m) => m.sender_id !== user.id && !m.read_at).length,
        at: c.last_message_at,
      }
    }))
  }, [user])

  useEffect(() => {
    if (!user) return
    load()
    const ch = supabase.channel(`inbox-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user, load])

  if (loading) return <p className="muted">Loading...</p>
  if (!user) return (
    <>
      <h2>Messages</h2>
      <p className="muted"><Link to="/login">Log in</Link> to message sellers, providers and employers.</p>
    </>
  )
  if (!rows) return <p className="muted">Loading...</p>

  return (
    <>
      <h2>Messages</h2>
      {rows.length === 0 && <p className="muted">No conversations yet. Open a listing or profile and tap Message.</p>}
      {rows.map((r) => (
        <Link key={r.id} to={`/messages/${r.id}`} className={`card item ${r.unread ? 'notif unread' : ''}`}>
          <div className="between">
            <strong>{r.name}</strong>
            {r.unread > 0 && <span className="badge">{r.unread}</span>}
          </div>
          <span className="muted">
            {r.last ? `${r.last.sender_id === user.id ? 'You: ' : ''}${r.last.context_title ? `Enquiry: ${r.last.context_title}` : r.last.body.slice(0, 80)}` : 'No messages yet'}
          </span>
          <span className="muted small">{timeAgo(r.at)}</span>
        </Link>
      ))}
    </>
  )
}
