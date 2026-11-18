import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'
import { timeAgo } from '../util.js'

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

export default function Reviews({ kind, id, ownerId }) {
  const { user } = useAuth()
  const [rows, setRows] = useState(null)
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('reviews')
      .select('id,rating,body,created_at,verified_engagement,reviewer_id,profiles!reviews_reviewer_id_fkey(id,full_name)')
      .eq('target_kind', kind).eq('target_id', id).order('created_at', { ascending: false })
    setRows(data || [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line
  }, [kind, id])

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const { error } = await supabase.from('reviews').insert({ reviewer_id: user.id, target_kind: kind, target_id: id, rating, body: body.trim() })
    if (error) setMsg(error.message)
    else { setBody(''); await load() }
    setBusy(false)
  }

  async function remove(rid) {
    if (!window.confirm('Delete your review?')) return
    await supabase.from('reviews').delete().eq('id', rid)
    load()
  }

  if (!rows) return null
  const avg = rows.length ? rows.reduce((a, r) => a + r.rating, 0) / rows.length : 0
  const mine = rows.find((r) => r.reviewer_id === user?.id)
  const canReview = user && user.id !== ownerId && !mine

  return (
    <div className="card">
      <strong>Reviews</strong>
      {rows.length > 0 ? (
        <p className="price">{avg.toFixed(1)} / 5 <span className="stars">{stars(Math.round(avg))}</span> <span className="muted">({rows.length})</span></p>
      ) : <p className="muted">No reviews yet.</p>}

      {rows.map((r) => (
        <div key={r.id} className="review">
          <span className="stars">{stars(r.rating)}</span>{' '}
          <Link to={`/people/${r.profiles?.id}`}>{r.profiles?.full_name || 'Someone'}</Link>{' '}
          <span className="muted small">{timeAgo(r.created_at)}</span>
          {r.verified_engagement && <em className="verified">Engagement verified</em>}
          {r.body && <p>{r.body}</p>}
          {r.reviewer_id === user?.id && <button className="linkbtn small" onClick={() => remove(r.id)}>Delete my review</button>}
        </div>
      ))}

      {canReview && (
        <form onSubmit={submit}>
          <p className="muted small">Reviews marked "Engagement verified" come from people who actually messaged this seller or provider and got a reply.</p>
          <div className="chips pick">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} className={rating === n ? 'on' : ''} onClick={() => setRating(n)}>{n} ★</button>
            ))}
          </div>
          <label>Your review<textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={1500} /></label>
          {msg && <p className="notice">{msg}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Sending...' : 'Post review'}</button>
        </form>
      )}
      {!user && <p className="muted small"><Link to="/login">Log in</Link> to leave a review.</p>}
    </div>
  )
}
