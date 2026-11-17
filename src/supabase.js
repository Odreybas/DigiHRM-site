import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://tvvjeylkbmsvyuijlynq.supabase.co',
  'sb_publishable_MjDxGLF72C0eSpr2WxHdIQ_g26GgoJr'
)

export const CAPABILITIES = [
  ['individual', 'Individual'],
  ['job_seeker', 'Job seeker'],
  ['professional', 'Professional'],
  ['freelancer', 'Freelancer'],
  ['artisan', 'Artisan'],
  ['service_provider', 'Service provider'],
  ['seller', 'Seller'],
  ['supplier', 'Supplier'],
  ['employer', 'Employer'],
  ['customer', 'Customer'],
  ['business', 'Business owner'],
]

export const capLabel = (key) => (CAPABILITIES.find((c) => c[0] === key) || [key, key])[1]

// remove characters that break the search filter
export const clean = (s) => s.replace(/[,()%*]/g, ' ').trim()
