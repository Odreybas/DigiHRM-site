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

export const PRODUCT_CATEGORIES = [
  'Electronics and computer accessories',
  'Construction materials, steel and metal',
  'Furniture',
  'Agricultural products',
  'Industrial equipment and machinery',
  'Clothing and fashion',
  'Food products',
  'Automotive products',
  'Office equipment',
  'Raw materials and household products',
]

export const SERVICE_CATEGORIES = [
  'Plumbing and electrical',
  'Construction, carpentry, welding and painting',
  'Cleaning',
  'Photography and graphic design',
  'Web development and IT support',
  'Computer repair',
  'Transport',
  'Catering and event planning',
  'Beauty and personal services',
  'Consulting, training and tutoring',
  'Equipment repair',
  'Other services',
]

export const COUNTIES = [
  'Nairobi', 'Kiambu', "Murang'a", 'Nakuru', 'Mombasa', 'Kisumu', 'Machakos', 'Kajiado',
  'Nyeri', 'Uasin Gishu', 'Meru', 'Kirinyaga', 'Embu', 'Kakamega', 'Kisii', 'Nyandarua',
]

export const AVAILABILITY = {
  in_stock: 'In stock',
  out_of_stock: 'Out of stock',
  on_request: 'On request',
  available: 'Available',
  busy: 'Busy',
  unavailable: 'Unavailable',
}

export function money(min, max) {
  if (min == null && max == null) return 'Ask for price'
  const f = (n) => 'KES ' + Number(n).toLocaleString('en-KE')
  if (min != null && max != null && Number(max) > Number(min)) return `${f(min)} - ${f(max)}`
  return f(min ?? max)
}

export const place = (town, county) => [town, county].filter(Boolean).join(', ')

export const JOB_TYPES = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  industrial_attachment: 'Industrial attachment',
  graduate_trainee: 'Graduate trainee',
  apprenticeship: 'Apprenticeship',
  remote: 'Remote',
  temporary: 'Temporary',
  freelance: 'Freelance',
  casual: 'Casual work',
}

export const STAGES = {
  submitted: 'Submitted',
  under_review: 'Under review',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  offered: 'Offered',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

export function salary(min, max) {
  if (min == null && max == null) return 'Pay not stated'
  const f = (n) => 'KES ' + Number(n).toLocaleString('en-KE')
  if (min != null && max != null && Number(max) > Number(min)) return `${f(min)} - ${f(max)}`
  return f(min ?? max)
}

export const isClosed = (job) =>
  job.status === 'closed' || (job.deadline && job.deadline < new Date().toISOString().slice(0, 10))
