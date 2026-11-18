import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'
import { timeAgo } from '../util.js'

export default function Chat() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const [conv, setConv] = useState(undefined)
  const [other, setOther] = useState(null)
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const [ctx, setCtx] = useState(null)
  const [blocked, setBlocked] = useState(false)
  const [err, setErr] = useState('')
  const bottom = useRef(null)

  useEffect(() => {
    const c = params.get('ctx')
    const t = params.get('t')
    if (c && t) {
      const [kind, cid] = c.split(':')
      setCtx({ kind, id: cid, title: t })
      setText(`Hi, I am interested in "${t}". `)
    }
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      const { data: c } = await supabase.from('conversations').select('*').eq('id', id).maybeSingle()
      if (!active) return
      setConv(c)
      if (!c) return
      const otherId = c.user_a === user.id ? c.user_b : c.user_a
      const [{ data: p }, { data: m }, { data: b }] = await Promise.all([
        supabase.from('profiles').select('id,full_name,title').eq('id', otherId).maybeSingle(),
        supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true }),
        supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id).eq('blocked_id', otherId).maybeSingle(),
      ])
      if (!active) return
      setOther(p)
      setMsgs(m || [])
      setBlocked(!!b)
      markRead()
    }
    load()
    const ch = supabase.channel(`chat-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, (payload) => {
        setMsgs((prev) => (prev.some((x) => x.id === payload.new.id) ? prev : [...prev, payload.new]))
        if (payload.new.sender_id !== user.id) markRead()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, (payload) => {
        setMsgs((prev) => prev.map((x) => (x.id === payload.new.id ? payload.new : x)))
      })
      .subscribe()
    return () => { active = false; supabase.removeChannel(ch) }
    // eslint-disable-next-line
  }, [id, user.id])

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs.length])

  async function markRead() {
    await supabase.from('messages').update({ read_at: new Date().toISOString() })
      .eq('conversation_id', id).neq('sender_id', user.id).is('read_at', null)
  }

  async function send(e) {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setErr('')
    const row = { conversation_id: id, sender_id: user.id, body }
    if (ctx) { row.context_kind = ctx.kind; row.context_id = ctx.id; row.context_title = ctx.title }
    const { data, error } = await supabase.from('messages').insert(row).select().single()
    if (error) { setErr(error.message); return }
    setMsgs((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]))
    setText('')
    setCtx(null)
  }

  async function toggleBlock() {
    if (!other) return
    if (blocked) {
      await supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', other.id)
      setBlocked(false)
    } else {
      if (!window.confirm(`Block ${other.full_name}? Neither of you will be able to send messages.`)) return
      await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: other.id })
      setBlocked(true)
    }
  }

  async function report() {
    const reason = window.prompt('What is the problem?')
    if (reason === null || !other) return
    const { error } = await supabase.from('reports').insert({ reporter_id: user.id, target_kind: 'person', target_id: other.id, reason })
    window.alert(error ? error.message : 'Thanks. We will review this account.')
  }

  if (conv === undefined) return <p className="muted">Loading...</p>
  if (!conv) return <p>This conversation does not exist.</p>

  const lastMine = [...msgs].reverse().find((m) => m.sender_id === user.id)

  return (
    <>
      <div className="between">
        <div>
          <h2 style={{ margin: 0 }}>{other ? <Link to={`/people/${other.id}`}>{other.full_name}</Link> : 'Chat'}</h2>
          <span className="muted small">{other?.title}</span>
        </div>
        <span className="row">
          <button className="linkbtn small" onClick={toggleBlock}>{blocked ? 'Unblock' : 'Block'}</button>
          <button className="linkbtn small" onClick={report}>Report</button>
        </span>
      </div>

      <div className="thread">
        {msgs.length === 0 && <p className="muted">Say hello.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`bubble ${m.sender_id === user.id ? 'mine' : ''}`}>
            {m.context_title && <div className="muted small">Enquiry about {m.context_title}{m.context_kind && m.context_id && <> - <Link to={`/${m.context_kind}/${m.context_id}`}>view</Link></>}</div>}
            <div>{m.body}</div>
            <div className="muted small">
              {timeAgo(m.created_at)}{m.id === lastMine?.id && m.read_at ? ' - Seen' : ''}
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>

      {err && <p className="notice">{err}</p>}
      {blocked ? (
        <p className="muted">You blocked this person. Unblock to send messages.</p>
      ) : (
        <form onSubmit={send}>
          {ctx && <p className="chips"><em>Enquiry about {ctx.title}</em></p>}
          <div className="row">
            <input className="grow" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" maxLength={2000} />
            <button className="btn">Send</button>
          </div>
        </form>
      )}
    </>
  )
}
