import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)

  async function loadProfile(uid) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const uid = session?.user?.id
  useEffect(() => {
    if (uid) loadProfile(uid)
    else setProfile(null)
  }, [uid])

  const value = {
    user: session?.user || null,
    profile,
    loading: session === undefined,
    reloadProfile: () => uid && loadProfile(uid),
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
