import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { enablePush, disablePush, pushStatus } from '../push.js'
import { useNotifs } from '../notifications.jsx'
import { timeAgo } from '../util.js'

export default function Notifications() {
  const { items, unread, markRead, markAllRead } = useNotifs()
  const nav = useNavigate()
  const [status, setStatus] = useState('checking')
  const [err, setErr] = useState('')

  useEffect(() => { pushStatus().then(setStatus) }, [])

  async function turnOn() {
    setErr('')
    try { await enablePush(); setStatus('on') } catch (e) { setErr(e.message); pushStatus().then(setStatus) }
  }
  async function turnOff() {
    setErr('')
    try { await disablePush(); setStatus('off') } catch (e) { setErr(e.message) }
  }

  return (
    <>
      <div className="between">
        <h2>Notifications</h2>
        {unread > 0 && <button className="linkbtn" onClick={markAllRead}>Mark all read</button>}
      </div>
      <div className="card">
        <strong>Phone alerts</strong>
        <p className="muted">Get a pop-up on this phone for application updates, comments and new followers, even when DigiHRM is closed.</p>
        {status === 'on' && <p>On for this device. <button className="linkbtn" onClick={turnOff}>Turn off</button></p>}
        {status === 'off' && <button className="btn" onClick={turnOn}>Turn on phone alerts</button>}
        {status === 'denied' && <p className="notice">Notifications are blocked for this site. Allow them in your browser's site settings, then come back.</p>}
        {status === 'unsupported' && <p className="notice">This browser does not support phone alerts. On iPhone, add DigiHRM to the Home Screen first.</p>}
        {err && <p className="notice">{err}</p>}
      </div>
      {items.length === 0 && <p className="muted">Nothing yet. Updates on your applications, comments and followers show up here.</p>}
      {items.map((n) => (
        <div
          key={n.id}
          className={`card item notif ${n.read_at ? '' : 'unread'}`}
          onClick={() => { markRead(n.id); if (n.link) nav(n.link) }}
        >
          <strong>{n.title}</strong>
          <span>{n.body}</span>
          <span className="muted small">{timeAgo(n.created_at)}</span>
        </div>
      ))}
    </>
  )
}
