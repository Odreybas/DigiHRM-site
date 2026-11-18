import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, AVAILABILITY, money, place } from '../supabase'
import { useAuth } from '../auth.jsx'
import SaveButton from '../components/SaveButton.jsx'

export default function ProductPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [p, setP] = useState(undefined)

  useEffect(() => {
    supabase.from('products').select('*,businesses(id,name,phone,location,county)').eq('id', id).maybeSingle()
      .then(({ data }) => setP(data))
  }, [id])

  if (p === undefined) return <p className="muted">Loading...</p>
  if (!p) return <p>This product does not exist.</p>
  const b = p.businesses

  return (
    <div className="card">
      <div className="between"><h2>{p.name}</h2><SaveButton kind="product" id={p.id} /></div>
      <p className="price">{money(p.price, p.price_max)}</p>
      <p className="chips">
        <em>{AVAILABILITY[p.availability]}</em>
        {p.category && <em>{p.category}</em>}
        {p.brand && <em>{p.brand}</em>}
        {p.min_order && <em>Minimum order: {p.min_order}</em>}
      </p>
      {p.description && <p>{p.description}</p>}
      <p className="muted">Located: {place(p.town, p.county) || 'Not stated'}</p>
      {p.delivery_areas && <p className="muted">Delivers to: {p.delivery_areas}</p>}
      {b && (
        <>
          <h3>Seller</h3>
          <p><Link to={`/business/${b.id}`}>{b.name}</Link></p>
          {b.phone && <p><a className="btn" href={`tel:${b.phone}`}>Call to request a quotation</a></p>}
        </>
      )}
      {user?.id === p.owner_id && <Link className="btn ghost" to={`/product/${p.id}/edit`}>Edit product</Link>}
    </div>
  )
}
