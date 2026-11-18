import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, AVAILABILITY, place } from '../supabase'
import { useAuth } from '../auth.jsx'
import SaveButton from '../components/SaveButton.jsx'
import MessageButton from '../components/MessageButton.jsx'
import Reviews from '../components/Reviews.jsx'
import Badges from '../components/Badges.jsx'

export default function ServicePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [s, setS] = useState(undefined)
  const [owner, setOwner] = useState(null)

  useEffect(() => {
    supabase.from('services').select('*,businesses(id,name,phone)').eq('id', id).maybeSingle().then(({ data }) => {
      setS(data)
      if (data) supabase.from('profiles').select('id,full_name').eq('id', data.owner_id).maybeSingle().then(({ data: o }) => setOwner(o))
    })
  }, [id])

  if (s === undefined) return <p className="muted">Loading...</p>
  if (!s) return <p>This service does not exist.</p>
  const b = s.businesses

  return (
    <>
    <div className="card">
      <div className="between"><h2>{s.title}</h2><SaveButton kind="service" id={s.id} /></div>
      {s.price_note && <p className="price">{s.price_note}</p>}
      <p className="chips">
        <em>{AVAILABILITY[s.availability]}</em>
        {s.category && <em>{s.category}</em>}
      </p>
      {s.description && <p>{s.description}</p>}
      <p className="muted">Based in: {place(s.town, s.county) || 'Not stated'}</p>
      {s.areas_served && <p className="muted">Areas served: {s.areas_served}</p>}
      {owner && <p>Provider: <Link to={`/people/${owner.id}`}>{owner.full_name}</Link></p>}
      {owner && <Badges profileId={owner.id} />}
      <p><MessageButton toId={s.owner_id} kind="service" id={s.id} title={s.title} label="Send enquiry or ask for a quotation" /></p>
      {b && (
        <>
          <p>Business: <Link to={`/business/${b.id}`}>{b.name}</Link></p>
          {b.phone && <p><a className="btn ghost" href={`tel:${b.phone}`}>Call</a></p>}
        </>
      )}
      {user?.id === s.owner_id && <Link className="btn ghost" to={`/service/${s.id}/edit`}>Edit service</Link>}
    </div>
    <Reviews kind="service" id={s.id} ownerId={s.owner_id} />
    </>
  )
}
