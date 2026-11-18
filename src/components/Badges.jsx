import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Badges({ profileId, businessId }) {
  const [rows, setRows] = useState([])
  useEffect(() => {
    let q = supabase.from('verifications').select('id,label')
    q = businessId ? q.eq('business_id', businessId) : q.eq('profile_id', profileId)
    q.then(({ data }) => setRows(data || []))
  }, [profileId, businessId])
  if (!rows.length) return null
  return <p className="chips">{rows.map((r) => <em key={r.id} className="verified">{r.label}</em>)}</p>
}
