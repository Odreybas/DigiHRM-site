import { useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'

export default function Account() {
  const { user } = useAuth()
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function change(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const { error } = await supabase.auth.updateUser({ password: pw })
    setMsg(error ? error.message : 'Password changed.')
    if (!error) setPw('')
    setBusy(false)
  }

  return (
    <form className="card narrow" onSubmit={change}>
      <h2>Account</h2>
      <p className="muted">Signed in as {user.email}</p>
      <label>New password
        <input type="password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} required />
      </label>
      {msg && <p className="notice">{msg}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Change password'}</button>
    </form>
  )
}
