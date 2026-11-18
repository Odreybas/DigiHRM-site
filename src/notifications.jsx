import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import { useAuth } from './auth.jsx'

const Ctx = createContext({ items: [], unread: 0 })
export const useNotifs = () => useContext(Ctx)

export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const nav = useNavigate()
  const [items, setItems] = useState([])
  const [toast, setToast] = useState(null)
  const uid = user?.id

  useEffect(() => {
    if (!uid) {
      setItems([])
      return
    }
    let active = true
    supabase.from('notifications').select('*').eq('user_id', uid)
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { if (active) setItems(data || []) })
    const channel = supabase
      .channel(`notifs-${uid}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        (payload) => {
          setItems((prev) => [payload.new, ...prev])
          setToast(payload.new)
        })
      .subscribe()
    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [uid])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(t)
  }, [toast])

  async function markRead(id) {
    const now = new Date().toISOString()
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at || now } : n)))
    await supabase.from('notifications').update({ read_at: now }).eq('id', id)
  }

  async function markAllRead() {
    const now = new Date().toISOString()
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || now })))
    await supabase.from('notifications').update({ read_at: now }).eq('user_id', uid).is('read_at', null)
  }

  const unread = items.filter((n) => !n.read_at).length

  return (
    <Ctx.Provider value={{ items, unread, markRead, markAllRead }}>
      {children}
      {toast && (
        <div
          className="toast"
          role="status"
          onClick={() => { markRead(toast.id); nav(toast.link || '/notifications'); setToast(null) }}
        >
          <strong>{toast.title}</strong>
          <span>{toast.body}</span>
        </div>
      )}
    </Ctx.Provider>
  )
}
