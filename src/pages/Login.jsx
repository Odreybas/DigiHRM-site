import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Login() {
  const nav = useNavigate()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function forgot() {
    if (!email) { setMsg('Type your email above first, then tap Forgot password.'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    setMsg(error ? error.message : 'If that email has an account, a reset link is on its way.')
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg(error.message)
      else nav('/dashboard')
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) setMsg(error.message)
      else if (data.session) nav('/profile/edit')
      else setMsg('Account created. Check your email to confirm it, then log in.')
    }
    setBusy(false)
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>{mode === 'login' ? 'Log in' : 'Create your account'}</h2>
      {mode === 'register' && (
        <label>Full name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
      )}
      <label>Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>Password
        <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {msg && <p className="notice">{msg}</p>}
      <button className="btn" disabled={busy}>
        {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
      </button>
      {mode === 'login' && <button type="button" className="linkbtn" onClick={forgot}>Forgot password?</button>}
      <button type="button" className="linkbtn" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMsg('') }}>
        {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
      </button>
    </form>
  )
}
