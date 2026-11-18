import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase, clean, COUNTIES, PRODUCT_CATEGORIES, SERVICE_CATEGORIES, JOB_TYPES } from '../supabase'
import { ProductCard, ServiceCard, BusinessCard, PersonCard, JobCard } from '../components/Cards.jsx'

const TABS = [
  ['all', 'All'], ['people', 'People'], ['products', 'Products'],
  ['services', 'Services'], ['jobs', 'Jobs'], ['businesses', 'Businesses'],
]

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'all'
  const [text, setText] = useState(params.get('q') || '')
  const [county, setCounty] = useState('')
  const [category, setCategory] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [skill, setSkill] = useState('')
  const [jobType, setJobType] = useState('')
  const [skills, setSkills] = useState([])
  const [data, setData] = useState({ people: [], products: [], services: [], businesses: [], jobs: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('skills').select('id,name').order('name').then(({ data: d }) => setSkills(d || []))
  }, [])

  async function searchPeople(limit) {
    let ids = null
    if (skill) {
      const { data: d } = await supabase.from('profile_skills').select('profile_id').eq('skill_id', skill)
      ids = (d || []).map((r) => r.profile_id)
    }
    let q = supabase.from('profiles').select('id,full_name,title,location,profile_skills(skills(name))').neq('full_name', '').limit(limit)
    if (ids) q = q.in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
    const t = clean(text)
    if (t) q = q.or(`full_name.ilike.%${t}%,title.ilike.%${t}%,location.ilike.%${t}%`)
    const c = clean(county)
    if (c) q = q.ilike('location', `%${c}%`)
    return q
  }

  function searchProducts(limit) {
    let q = supabase.from('products').select('*,businesses(name)').order('created_at', { ascending: false }).limit(limit)
    const t = clean(text)
    if (t) q = q.or(`name.ilike.%${t}%,brand.ilike.%${t}%,category.ilike.%${t}%,description.ilike.%${t}%`)
    const c = clean(county)
    if (c) q = q.or(`county.ilike.%${c}%,town.ilike.%${c}%,delivery_areas.ilike.%${c}%`)
    if (category) q = q.eq('category', category)
    if (maxPrice) q = q.lte('price', Number(maxPrice))
    return q
  }

  function searchServices(limit) {
    let q = supabase.from('services').select('*,businesses(name)').order('created_at', { ascending: false }).limit(limit)
    const t = clean(text)
    if (t) q = q.or(`title.ilike.%${t}%,category.ilike.%${t}%,description.ilike.%${t}%`)
    const c = clean(county)
    if (c) q = q.or(`county.ilike.%${c}%,town.ilike.%${c}%,areas_served.ilike.%${c}%`)
    if (category) q = q.eq('category', category)
    return q
  }

  function searchBusinesses(limit) {
    let q = supabase.from('businesses').select('*').order('created_at', { ascending: false }).limit(limit)
    const t = clean(text)
    if (t) q = q.or(`name.ilike.%${t}%,category.ilike.%${t}%,description.ilike.%${t}%`)
    const c = clean(county)
    if (c) q = q.or(`county.ilike.%${c}%,location.ilike.%${c}%,delivery_areas.ilike.%${c}%`)
    return q
  }

  function searchJobs(limit) {
    let q = supabase.from('jobs').select('*,businesses(name)').eq('status', 'open').order('created_at', { ascending: false }).limit(limit)
    const t = clean(text)
    if (t) q = q.or(`title.ilike.%${t}%,description.ilike.%${t}%,requirements.ilike.%${t}%,qualifications.ilike.%${t}%`)
    const c = clean(county)
    if (c) q = q.or(`county.ilike.%${c}%,town.ilike.%${c}%`)
    if (jobType) q = q.eq('job_type', jobType)
    return q
  }

  async function search() {
    setLoading(true)
    setError('')
    const next = { people: [], products: [], services: [], businesses: [], jobs: [] }
    const limit = tab === 'all' ? 5 : 50
    const jobs = []
    if (tab === 'all' || tab === 'people') jobs.push(searchPeople(limit).then((q) => q).then((r) => ['people', r]))
    if (tab === 'all' || tab === 'products') jobs.push(searchProducts(limit).then((r) => ['products', r]))
    if (tab === 'all' || tab === 'services') jobs.push(searchServices(limit).then((r) => ['services', r]))
    if (tab === 'all' || tab === 'jobs') jobs.push(searchJobs(limit).then((r) => ['jobs', r]))
    if (tab === 'all' || tab === 'businesses') jobs.push(searchBusinesses(limit).then((r) => ['businesses', r]))
    const results = await Promise.all(jobs)
    for (const [key, r] of results) {
      if (r.error) setError(r.error.message)
      next[key] = r.data || []
    }
    setData(next)
    setLoading(false)
  }

  useEffect(() => {
    search()
    // eslint-disable-next-line
  }, [tab])

  const setTab = (t) => setParams({ tab: t, q: text })
  const showCategory = tab === 'products' || tab === 'services'
  const categories = tab === 'services' ? SERVICE_CATEGORIES : PRODUCT_CATEGORIES
  const total = data.jobs.length + data.people.length + data.products.length + data.services.length + data.businesses.length

  return (
    <>
      <h2>Explore</h2>
      <div className="chips pick" style={{ marginBottom: 12 }}>
        {TABS.map(([key, label]) => (
          <button type="button" key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {(
        <>
          <form className="filters" onSubmit={(e) => { e.preventDefault(); search() }}>
            <input placeholder="Search..." value={text} onChange={(e) => setText(e.target.value)} />
            <input list="counties" placeholder="Town or county" value={county} onChange={(e) => setCounty(e.target.value)} />
            <datalist id="counties">{COUNTIES.map((c) => <option key={c} value={c} />)}</datalist>
            {showCategory && (
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Any category</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {tab === 'products' && (
              <input type="number" min="0" placeholder="Max price (KES)" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            )}
            {tab === 'jobs' && (
              <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
                <option value="">Any job type</option>
                {Object.entries(JOB_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            )}
            {tab === 'people' && (
              <select value={skill} onChange={(e) => setSkill(e.target.value)}>
                <option value="">Any skill</option>
                {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            <button className="btn">Search</button>
          </form>

          {error && <p className="notice">{error}</p>}
          {loading && <p className="muted">Searching...</p>}
          {!loading && total === 0 && <p className="muted">No results. Try a different search.</p>}

          {data.jobs.length > 0 && <><h3>Jobs</h3>{data.jobs.map((j) => <JobCard key={j.id} j={j} />)}</>}
          {data.people.length > 0 && <><h3>People</h3>{data.people.map((p) => <PersonCard key={p.id} p={p} />)}</>}
          {data.products.length > 0 && <><h3>Products</h3>{data.products.map((p) => <ProductCard key={p.id} p={p} />)}</>}
          {data.services.length > 0 && <><h3>Services</h3>{data.services.map((s) => <ServiceCard key={s.id} s={s} />)}</>}
          {data.businesses.length > 0 && <><h3>Businesses</h3>{data.businesses.map((b) => <BusinessCard key={b.id} b={b} />)}</>}
        </>
      )}
    </>
  )
}
