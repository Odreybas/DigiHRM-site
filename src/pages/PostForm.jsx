import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'
import { uploadMedia } from '../util.js'

const TOPICS = [
  ['people', 'People and skills'], ['products', 'Products'], ['services', 'Services'],
  ['businesses', 'Business update'], ['jobs', 'Jobs'],
]

export default function PostForm() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [topic, setTopic] = useState('people')
  const [body, setBody] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [link, setLink] = useState('')
  const [biz, setBiz] = useState('')
  const [options, setOptions] = useState([])
  const [bizList, setBizList] = useState([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    async function load() {
      const [p, s, j, b] = await Promise.all([
        supabase.from('products').select('id,name').eq('owner_id', user.id),
        supabase.from('services').select('id,title').eq('owner_id', user.id),
        supabase.from('jobs').select('id,title').eq('owner_id', user.id),
        supabase.from('businesses').select('id,name').eq('owner_id', user.id),
      ])
      setOptions([
        ...(p.data || []).map((x) => ({ v: `product:${x.id}`, t: `Product: ${x.name}` })),
        ...(s.data || []).map((x) => ({ v: `service:${x.id}`, t: `Service: ${x.title}` })),
        ...(j.data || []).map((x) => ({ v: `job:${x.id}`, t: `Job: ${x.title}` })),
        ...(b.data || []).map((x) => ({ v: `business:${x.id}`, t: `Business: ${x.name}` })),
      ])
      setBizList(b.data || [])
    }
    load()
  }, [user.id])

  function pick(e) {
    const f = e.target.files?.[0]
    setFile(f || null)
    setPreview(f ? URL.createObjectURL(f) : '')
  }

  async function submit(e) {
    e.preventDefault()
    if (!body.trim() && !file) { setMsg('Write something or add a photo or video.'); return }
    setBusy(true)
    setMsg('')
    try {
      let media = null
      if (file) media = await uploadMedia(file, user.id)
      const [kind, id] = link ? link.split(':') : [null, null]
      const { error } = await supabase.from('posts').insert({
        owner_id: user.id,
        business_id: biz || null,
        topic,
        body: body.trim(),
        media_url: media?.url || null,
        media_type: media?.type || null,
        link_kind: kind,
        link_id: id,
      })
      if (error) throw error
      nav('/')
    } catch (err) {
      setMsg(err.message || 'Something went wrong.')
      setBusy(false)
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Share a post</h2>
      <label>What is it about?
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          {TOPICS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label>Caption<textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} placeholder="Show your work, new stock, a vacancy..." /></label>
      <label>Photo or short video (video up to 40 MB)
        <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" onChange={pick} />
      </label>
      {preview && (file?.type.startsWith('video/')
        ? <video className="media" src={preview} controls playsInline />
        : <img className="media" src={preview} alt="" />)}
      {options.length > 0 && (
        <label>Link to one of your listings (optional)
          <select value={link} onChange={(e) => setLink(e.target.value)}>
            <option value="">No link</option>
            {options.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
          </select>
        </label>
      )}
      {bizList.length > 0 && (
        <label>Post as
          <select value={biz} onChange={(e) => setBiz(e.target.value)}>
            <option value="">Myself</option>
            {bizList.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
      )}
      {msg && <p className="notice">{msg}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Uploading...' : 'Post'}</button>
    </form>
  )
}
