import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'
import PostCard from './PostCard.jsx'

const PAGE = 8
const NONE = '00000000-0000-0000-0000-000000000000'

export default function Feed({ topic = 'all', followingOnly = false, ownerId = null, postId = null, openComments = false }) {
  const { user, following } = useAuth()
  const nav = useNavigate()
  const [posts, setPosts] = useState([])
  const [liked, setLiked] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)
  const [error, setError] = useState('')

  async function load(from) {
    setLoading(true)
    setError('')
    let q = supabase
      .from('posts')
      .select('*,profiles(id,full_name),businesses(id,name),post_likes(count),post_comments(count)')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1)
    if (topic !== 'all') q = q.eq('topic', topic)
    if (ownerId) q = q.eq('owner_id', ownerId)
    if (postId) q = q.eq('id', postId)
    if (followingOnly) q = q.in('owner_id', following.size ? [...following] : [NONE])
    const { data, error: err } = await q
    if (err) setError(err.message)
    const rows = data || []
    setPosts((prev) => (from === 0 ? rows : [...prev, ...rows]))
    setMore(rows.length === PAGE)
    if (user && rows.length) {
      const { data: l } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', rows.map((r) => r.id))
      setLiked((prev) => new Set([...prev, ...(l || []).map((r) => r.post_id)]))
    }
    setLoading(false)
  }

  useEffect(() => {
    load(0)
    // eslint-disable-next-line
  }, [topic, followingOnly, ownerId, postId, user?.id])

  async function like(post) {
    if (!user) return nav('/login')
    const on = liked.has(post.id)
    const next = new Set(liked)
    on ? next.delete(post.id) : next.add(post.id)
    setLiked(next)
    setPosts((prev) => prev.map((p) => p.id === post.id
      ? { ...p, post_likes: [{ count: Math.max(0, (p.post_likes?.[0]?.count || 0) + (on ? -1 : 1)) }] } : p))
    if (on) await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    else await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
  }

  return (
    <>
      {error && <p className="notice">{error}</p>}
      {!loading && posts.length === 0 && <p className="muted">No posts here yet.</p>}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} liked={liked.has(p.id)} onLike={like} openComments={openComments}
          onDelete={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))} />
      ))}
      {loading && <p className="muted">Loading...</p>}
      {!loading && more && <button className="btn ghost" onClick={() => load(posts.length)}>Load more</button>}
    </>
  )
}
