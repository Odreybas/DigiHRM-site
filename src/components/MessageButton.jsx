import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'

export default function MessageButton({ toId, kind, id, title, label = 'Message' }) {
  const { user } = useAuth()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  if (user?.id === toId) return null

  async function go() {
    if (!user) return nav('/login')
    setBusy(true)
    const { data, error } = await supabase.rpc('start_conversation', { p_other: toId })
    setBusy(false)
    if (error) { window.alert(error.message); return }
    const q = kind ? `?ctx=${kind}:${id}&t=${encodeURIComponent((title || '').slice(0, 120))}` : ''
    nav(`/messages/${data}${q}`)
  }

  return <button className="btn" onClick={go} disabled={busy}>{busy ? 'Opening...' : label}</button>
}
