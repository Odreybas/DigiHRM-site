import { Link } from 'react-router-dom'
import SaveButton from './SaveButton.jsx'
import { AVAILABILITY, money, place } from '../supabase'

export function ProductCard({ p }) {
  return (
    <Link to={`/product/${p.id}`} className="card item">
      <div className="between">
        <strong>{p.name}</strong>
        <SaveButton kind="product" id={p.id} />
      </div>
      <span className="price">{money(p.price, p.price_max)}</span>
      <span className="muted">
        {p.category || 'Product'}
        {place(p.town, p.county) ? ` - ${place(p.town, p.county)}` : ''}
      </span>
      <span className="chips">
        <em>{AVAILABILITY[p.availability]}</em>
        {p.businesses?.name && <em>{p.businesses.name}</em>}
      </span>
    </Link>
  )
}

export function ServiceCard({ s }) {
  return (
    <Link to={`/service/${s.id}`} className="card item">
      <div className="between">
        <strong>{s.title}</strong>
        <SaveButton kind="service" id={s.id} />
      </div>
      <span className="muted">
        {s.category || 'Service'}
        {place(s.town, s.county) ? ` - ${place(s.town, s.county)}` : ''}
      </span>
      {s.price_note && <span className="price">{s.price_note}</span>}
      <span className="chips">
        <em>{AVAILABILITY[s.availability]}</em>
        {s.businesses?.name && <em>{s.businesses.name}</em>}
      </span>
    </Link>
  )
}

export function BusinessCard({ b }) {
  return (
    <Link to={`/business/${b.id}`} className="card item">
      <div className="between">
        <strong>{b.name}</strong>
        <SaveButton kind="business" id={b.id} />
      </div>
      <span className="muted">
        {b.category || 'Business'}
        {place(b.location, b.county) ? ` - ${place(b.location, b.county)}` : ''}
      </span>
      {b.delivery_areas && <span className="muted">Delivers to: {b.delivery_areas}</span>}
      <span className="muted">{(b.description || '').slice(0, 110)}</span>
    </Link>
  )
}

export function PersonCard({ p }) {
  return (
    <Link to={`/people/${p.id}`} className="card item">
      <div className="between">
        <strong>{p.full_name}</strong>
        <SaveButton kind="person" id={p.id} />
      </div>
      <span className="muted">{p.title || 'No title yet'}{p.location ? ` - ${p.location}` : ''}</span>
      <span className="chips">
        {(p.profile_skills || []).slice(0, 5).map((ps, i) => <em key={i}>{ps.skills?.name}</em>)}
      </span>
    </Link>
  )
}
