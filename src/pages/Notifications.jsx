import { useNavigate } from 'react-router-dom'
import { useNotifs } from '../notifications.jsx'
import { timeAgo } from '../util.js'

export default function Notifications() {
  const { items, unread, markRead, markAllRead } = useNotifs()
  const nav = useNavigate()

  return (
    <>
      <div className="between">
        <h2>Notifications</h2>
        {unread > 0 && <button className="linkbtn" onClick={markAllRead}>Mark all read</button>}
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
