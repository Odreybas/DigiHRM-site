import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [saved, setSaved] = useState(new Set())

  async function loadProfile(uid) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') window.location.hash = '#/account'
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const uid = session?.user?.id
  useEffect(() => {
    if (uid) {
      loadProfile(uid)
      supabase.from('saved_items').select('kind,item_id').eq('user_id', uid).then(({ data }) =>
        setSaved(new Set((data || []).map((r) => `${r.kind}:${r.item_id}`))))
    } else {
      setProfile(null)
      setSaved(new Set())
    }
  }, [uid])

  async function toggleSaved(kind, id) {
    const key = `${kind}:${id}`
    const next = new Set(saved)
    if (saved.has(key)) {
      next.delete(key)
      setSaved(next)
      await supabase.from('saved_items').delete().eq('user_id', uid).eq('kind', kind).eq('item_id', id)
    } else {
      next.add(key)
      setSaved(next)
      await supabase.from('saved_items').insert({ user_id: uid, kind, item_id: id })
    }
  }

  const value = {
    user: session?.user || null,
    profile,
    loading: session === undefined,
    reloadProfile: () => uid && loadProfile(uid),
    saved,
    toggleSaved,
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
