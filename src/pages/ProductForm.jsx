import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, PRODUCT_CATEGORIES, COUNTIES } from '../supabase'
import { useAuth } from '../auth.jsx'

const empty = {
  name: '', category: '', brand: '', description: '', price: '', price_max: '', min_order: '',
  availability: 'in_stock', town: '', county: '', delivery_areas: '', business_id: '', stock: '', reorder_level: 5, owner_id: '',
}

export default function ProductForm() {
  const { id } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState(empty)
  const [bizList, setBizList] = useState([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    async function loadBiz() {
      const { data: own } = await supabase.from('businesses').select('id,name,owner_id').eq('owner_id', user.id)
      const { data: mem } = await supabase.from('business_members')
        .select('role,businesses!business_members_business_id_fkey(id,name,owner_id)').eq('user_id', user.id)
      const extra = (mem || []).filter((m) => ['administrator', 'manager', 'content_editor'].includes(m.role)).map((m) => m.businesses).filter(Boolean)
      setBizList([...(own || []), ...extra])
    }
    loadBiz()
    if (id) {
      supabase.from('products').select('*').eq('id', id).maybeSingle().then(({ data }) => {
        if (data) setF({
          ...empty, ...data,
          price: data.price ?? '', price_max: data.price_max ?? '', min_order: data.min_order ?? '',
          business_id: data.business_id || '', stock: data.stock ?? '', reorder_level: data.reorder_level ?? 5,
        })
      })
    }
  }, [id, user.id])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const row = {
      name: f.name, category: f.category, brand: f.brand, description: f.description,
      price: f.price === '' ? null : Number(f.price),
      price_max: f.price_max === '' ? null : Number(f.price_max),
      min_order: f.min_order === '' ? null : Number(f.min_order),
      availability: f.availability, town: f.town, county: f.county, delivery_areas: f.delivery_areas,
      business_id: f.business_id || null,
      stock: f.stock === '' ? null : Number(f.stock),
      reorder_level: f.reorder_level === '' ? 5 : Number(f.reorder_level),
      owner_id: (bizList.find((b) => b.id === f.business_id)?.owner_id) || f.owner_id || user.id,
    }
    const { error } = id
      ? await supabase.from('products').update(row).eq('id', id)
      : await supabase.from('products').insert(row)
    if (error) { setMsg(error.message); setBusy(false); return }
    nav('/dashboard')
  }

  async function remove() {
    if (!window.confirm('Delete this product?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) setMsg(error.message)
    else nav('/dashboard')
  }

  return (
    <form className="card" onSubmit={save}>
      <h2>{id ? 'Edit product' : 'Add a product'}</h2>
      <label>Product name<input value={f.name} onChange={set('name')} required minLength={2} /></label>
      <label>Category
        <select value={f.category} onChange={set('category')}>
          <option value="">Choose a category</option>
          {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label>Brand<input value={f.brand} onChange={set('brand')} /></label>
      <label>Description and specifications<textarea rows={4} value={f.description} onChange={set('description')} /></label>
      <div className="row wrap">
        <label className="grow">Price (KES)<input type="number" min="0" value={f.price} onChange={set('price')} /></label>
        <label className="grow">Highest price, if a range<input type="number" min="0" value={f.price_max} onChange={set('price_max')} /></label>
      </div>
      <label>Minimum order<input type="number" min="1" value={f.min_order} onChange={set('min_order')} /></label>
      <label>Availability
        <select value={f.availability} onChange={set('availability')}>
          <option value="in_stock">In stock</option>
          <option value="out_of_stock">Out of stock</option>
          <option value="on_request">On request</option>
        </select>
      </label>
      <div className="row wrap">
        <label className="grow">Stock on hand (leave empty if you do not track it)<input type="number" min="0" value={f.stock} onChange={set('stock')} /></label>
        <label className="grow">Warn me when stock is at or below<input type="number" min="0" value={f.reorder_level} onChange={set('reorder_level')} /></label>
      </div>
      <label>Town<input value={f.town} onChange={set('town')} /></label>
      <label>County<input list="counties-form" value={f.county} onChange={set('county')} /></label>
      <datalist id="counties-form">{COUNTIES.map((c) => <option key={c} value={c} />)}</datalist>
      <label>Delivers to (towns or counties)<input value={f.delivery_areas} onChange={set('delivery_areas')} placeholder="e.g. Kiambu, Machakos, Nakuru" /></label>
      <label>Sold by
        <select value={f.business_id} onChange={set('business_id')}>
          <option value="">Myself (no business)</option>
          {bizList.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>
      {msg && <p className="notice">{msg}</p>}
      <div className="row wrap">
        <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save product'}</button>
        {id && <button type="button" className="btn danger" onClick={remove}>Delete</button>}
      </div>
    </form>
  )
}
