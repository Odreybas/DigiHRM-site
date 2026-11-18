import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'
import { timeAgo, removeMedia } from '../util.js'
import FollowButton from './FollowButton.jsx'

const LINKS = { product: 'product', service: 'service', business: 'business', job: 'job' }

export default function PostCard({ post, liked, onLike, onDelete, openComments = false }) {
  const { user } = useAuth()
  const [show, setShow] = useState(openComments)
  const [comments, setComments] = useState(null)
  const [text, setText] = useState('')
  const [count, setCount] = useState(post.post_comments?.[0]?.count || 0)
  const [msg, setMsg] = useState('')
  const likes = post.post_likes?.[0]?.count || 0
  const isOwner = user?.id === post.owner_id

  async function loadComments() {
    const { data } = await supabase.from('post_comments').select('id,body,created_at,user_id,profiles(id,full_name)')
      .eq('post_id', post.id).order('created_at', { ascending: true })
    setComments(data || [])
  }

  useEffect(() => {
    if (openComments) loadComments()
    // eslint-disable-next-line
  }, [])

  function toggleComments() {
    const next = !show
    setShow(next)
    if (next && !comments) loadComments()
  }

  async function addComment(e) {
    e.preventDefault()
    if (!text.trim()) return
    setMsg('')
    const { error } = await supabase.from('post_comments').insert({ post_id: post.id, user_id: user.id, body: text.trim() })
    if (error) { setMsg(error.message); return }
    setText('')
    setCount(count + 1)
    loadComments()
  }

  async function delComment(id) {
    await supabase.from('post_comments').delete().eq('id', id)
    setCount(Math.max(0, count - 1))
    setComments(comments.filter((c) => c.id !== id))
  }

  async function report() {
    const reason = window.prompt('What is wrong with this post?')
    if (reason === null) return
    const { error } = await supabase.from('reports').insert({ reporter_id: user.id, target_kind: 'post', target_id: post.id, reason })
    window.alert(error ? error.message : 'Thanks. We will review this post.')
  }

  async function share() {
    const url = `${window.location.origin}/#/post/${post.id}`
    if (navigator.share) {
      try { await navigator.share({ title: 'DigiHRM', url }) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard?.writeText(url)
      window.alert('Link copied.')
    }
  }

  async function remove() {
    if (!window.confirm('Delete this post?')) return
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (error) { window.alert(error.message); return }
    if (post.media_url) removeMedia(post.media_url)
    onDelete?.(post.id)
  }

  return (
    <div className="card post">
      <div className="between">
        <div>
          <strong><Link to={`/people/${post.profiles?.id}`}>{post.profiles?.full_name || 'Someone'}</Link></strong>
          {post.businesses && <span className="muted"> for <Link to={`/business/${post.businesses.id}`}>{post.businesses.name}</Link></span>}
          <div className="muted small" style={{ margin: 0 }}>{timeAgo(post.created_at)}</div>
        </div>
        <FollowButton userId={post.owner_id} />
      </div>

      {post.body && <p className="postbody">{post.body}</p>}
      {post.media_type === 'image' && <img className="media" src={post.media_url} alt="" loading="lazy" />}
      {post.media_type === 'video' && <video className="media" src={post.media_url} controls playsInline preload="metadata" />}
      {post.link_kind && <p><Link className="btn ghost" to={`/${LINKS[post.link_kind]}/${post.link_id}`}>View {post.link_kind}</Link></p>}

      <div className="row wrap postactions">
        <button className={`linkbtn ${liked ? 'strong' : ''}`} onClick={() => onLike(post)}>{liked ? 'Liked' : 'Like'} ({likes})</button>
        <button className="linkbtn" onClick={toggleComments}>Comments ({count})</button>
        <button className="linkbtn" onClick={share}>Share</button>
        {user && !isOwner && <button className="linkbtn" onClick={report}>Report</button>}
        {isOwner && <button className="linkbtn" onClick={remove}>Delete</button>}
      </div>

      {show && (
        <div className="comments">
          {(comments || []).map((c) => (
            <p key={c.id}>
              <strong><Link to={`/people/${c.profiles?.id}`}>{c.profiles?.full_name || 'Someone'}</Link></strong> {c.body}{' '}
              {(user?.id === c.user_id || isOwner) && <button className="linkbtn small" onClick={() => delComment(c.id)}>delete</button>}
            </p>
          ))}
          {comments && comments.length === 0 && <p className="muted small">No comments yet.</p>}
          {user ? (
            <form className="row" onSubmit={addComment}>
              <input className="grow" placeholder="Add a comment" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
              <button className="btn">Send</button>
            </form>
          ) : (
            <p className="muted small"><Link to="/login">Log in</Link> to comment.</p>
          )}
          {msg && <p className="notice">{msg}</p>}
        </div>
      )}
    </div>
  )
}
