import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

export default function FollowButton({ userId }) {
  const { user, following, toggleFollow } = useAuth()
  const nav = useNavigate()
  if (user?.id === userId) return null
  const on = following.has(userId)
  return (
    <button
      type="button"
      className={`savebtn ${on ? 'on' : ''}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (user) toggleFollow(userId); else nav('/login') }}
    >
      {on ? 'Following' : 'Follow'}
    </button>
  )
}
