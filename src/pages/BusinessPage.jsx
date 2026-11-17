import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'

export default function BusinessPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [b, setB] = useState(undefined)
  const [owner, setOwner] = useState(null)

  useEffect(() => {
    supabase.from('businesses').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      setB(data)
      if (data) supabase.from('profiles').select('id,full_name').eq('id', data.owner_id).maybeSingle().then(({ data: o }) => setOwner(o))
    })
  }, [id])

  if (b === undefined) return <p className="muted">Loading...</p>
  if (!b) return <p>This business does not exist.</p>

  return (
    <div className="card">
      <h2>{b.name}</h2>
      <p className="muted">{b.category}{b.location ? ` - ${b.location}` : ''}</p>
      {b.description && <p>{b.description}</p>}
      {b.phone && <p>Phone: {b.phone}</p>}
      {owner && <p className="muted">Owner: <Link to={`/people/${owner.id}`}>{owner.full_name}</Link></p>}
      {user?.id === b.owner_id && <Link className="btn ghost" to={`/business/${b.id}/edit`}>Edit business</Link>}
    </div>
  )
}
