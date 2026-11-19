import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth.jsx'
import { ProductCard, ServiceCard, BusinessCard, PersonCard, JobCard } from '../components/Cards.jsx'

export default function Saved() {
  const { saved } = useAuth()
  const [d, setD] = useState({ product: [], service: [], business: [], person: [], job: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ids = { product: [], service: [], business: [], person: [], job: [] }
    saved.forEach((key) => {
      const [kind, id] = key.split(':')
      ids[kind]?.push(id)
    })
    async function load() {
      const get = (table, select, list) =>
        list.length ? supabase.from(table).select(select).in('id', list).then((r) => r.data || []) : Promise.resolve([])
      const [product, service, business, person, job] = await Promise.all([
        get('products', '*,businesses(name)', ids.product),
        get('services', '*,businesses(name)', ids.service),
        get('businesses', '*', ids.business),
        get('profiles', 'id,full_name,title,location,bio,avatar_url,profile_skills(skills(name))', ids.person),
        get('jobs', '*,businesses(name)', ids.job),
      ])
      setD({ product, service, business, person, job })
      setLoading(false)
    }
    load()
  }, [saved])

  const empty = !loading && !d.product.length && !d.service.length && !d.business.length && !d.person.length && !d.job.length

  return (
    <>
      <h2>Saved</h2>
      {empty && <p className="muted">Nothing saved yet. Tap Save on any product, service, business or person.</p>}
      {d.job.map((j) => <JobCard key={j.id} j={j} />)}
      {d.product.map((p) => <ProductCard key={p.id} p={p} />)}
      {d.service.map((s) => <ServiceCard key={s.id} s={s} />)}
      {d.business.map((b) => <BusinessCard key={b.id} b={b} />)}
      {d.person.map((p) => <PersonCard key={p.id} p={p} />)}
    </>
  )
}
