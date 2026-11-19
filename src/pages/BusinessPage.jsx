import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, place } from '../supabase'
import { ProductCard, ServiceCard } from '../components/Cards.jsx'
import SaveButton from '../components/SaveButton.jsx'
import MessageButton from '../components/MessageButton.jsx'
import Reviews from '../components/Reviews.jsx'
import Badges from '../components/Badges.jsx'
import { useTrack } from '../util.js'
import { useAuth } from '../auth.jsx'

export default function BusinessPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [b, setB] = useState(undefined)
  useTrack('business', id)
  const [owner, setOwner] = useState(null)
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])

  useEffect(() => {
    supabase.from('businesses').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      setB(data)
      if (data) supabase.from('profiles').select('id,full_name').eq('id', data.owner_id).maybeSingle().then(({ data: o }) => setOwner(o))
    })
    supabase.from('products').select('*,businesses(name)').eq('business_id', id).then(({ data }) => setProducts(data || []))
    supabase.from('services').select('*,businesses(name)').eq('business_id', id).then(({ data }) => setServices(data || []))
  }, [id])

  if (b === undefined) return <p className="muted">Loading...</p>
  if (!b) return <p>This business does not exist.</p>

  return (
    <>
    <div className="card">
      <div className="between"><h2>{b.name}</h2><SaveButton kind="business" id={b.id} /></div>
      <p className="muted">{b.category}{place(b.location, b.county) ? ` - ${place(b.location, b.county)}` : ''}</p>
      <Badges businessId={b.id} />
      {b.delivery_areas && <p className="muted">Delivers to: {b.delivery_areas}</p>}
      {b.description && <p>{b.description}</p>}
      {b.phone && <p><a className="btn" href={`tel:${b.phone}`}>Call {b.phone}</a></p>}
      <p><MessageButton toId={b.owner_id} kind="business" id={b.id} title={b.name} label="Send enquiry" /></p>
      {owner && <p className="muted">Owner: <Link to={`/people/${owner.id}`}>{owner.full_name}</Link></p>}
      {user?.id === b.owner_id && <Link className="btn ghost" to={`/business/${b.id}/edit`}>Edit business</Link>}
    </div>
    <Reviews kind="business" id={b.id} ownerId={b.owner_id} />
    {products.length > 0 && <><h3>Products</h3>{products.map((p) => <ProductCard key={p.id} p={p} />)}</>}
    {services.length > 0 && <><h3>Services</h3>{services.map((s) => <ServiceCard key={s.id} s={s} />)}</>}
    </>
  )
}
