import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

export default function SaveButton({ kind, id }) {
  const { user, saved, toggleSaved } = useAuth()
  const nav = useNavigate()
  const isSaved = saved.has(`${kind}:${id}`)

  function onClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return nav('/login')
    toggleSaved(kind, id)
  }

  return (
    <button type="button" className={`savebtn ${isSaved ? 'on' : ''}`} onClick={onClick}>
      {isSaved ? 'Saved' : 'Save'}
    </button>
  )
}
