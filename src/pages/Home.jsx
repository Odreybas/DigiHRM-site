import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { ProductCard, ServiceCard } from '../components/Cards.jsx'
import Feed from '../components/Feed.jsx'
import { useAuth } from '../auth.jsx'

const FEED_TOPIC = { all: 'all', people: 'people', products: 'products', services: 'services', jobs: 'jobs', businesses: 'businesses' }
const CHIPS = [
  ['all', 'All'], ['people', 'People'], ['products', 'Products'],
  ['services', 'Services'], ['jobs', 'Jobs'], ['businesses', 'Businesses'],
]

export default function Home() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all')
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])

  useEffect(() => {
    supabase.from('products').select('*,businesses(name)').order('created_at', { ascending: false }).limit(4)
      .then(({ data }) => setProducts(data || []))
    supabase.from('services').select('*,businesses(name)').order('created_at', { ascending: false }).limit(4)
      .then(({ data }) => setServices(data || []))
  }, [])

  function go(e) {
    e.preventDefault()
    nav(`/explore?tab=${tab === 'following' ? 'all' : tab}&q=${encodeURIComponent(q)}`)
  }

  return (
    <>
      <h2>Discover</h2>
      <p className="muted">Find people, products, services and opportunities.</p>
      <form onSubmit={go}>
        <input placeholder="Search people, products, services..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips pick" style={{ margin: '10px 0' }}>
          {[...CHIPS, ...(user ? [['following', 'Following']] : [])].map(([key, label]) => (
            <button type="button" key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
        <button className="btn">Search</button>
      </form>

      <h3>Feed</h3>
      <Feed topic={FEED_TOPIC[tab] || 'all'} followingOnly={tab === 'following'} />

      <h3>New products</h3>
      {products.length === 0 && <p className="muted">No products yet. Be the first to add one from the Create tab.</p>}
      {products.map((p) => <ProductCard key={p.id} p={p} />)}

      <h3>New services</h3>
      {services.length === 0 && <p className="muted">No services yet.</p>}
      {services.map((s) => <ServiceCard key={s.id} s={s} />)}
    </>
  )
}
