import { supabase } from './supabase'

const VAPID_PUBLIC = 'BAD9R-C-SkF359ajmGMaK5EC6NvubcoaX_Qj-_-874gJ_kZSaLUntU8ACNm91bceHAZjQem-V4ncI_sUNEUY6k8'

function toKey(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
  }
}

export async function pushStatus() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = reg && (await reg.pushManager.getSubscription())
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}

export async function enablePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('This browser does not support phone alerts. On iPhone, add DigiHRM to the Home Screen first.')
  }
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Notifications are blocked. Allow them in your browser site settings.')
  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(VAPID_PUBLIC) })
  const j = sub.toJSON()
  const { error } = await supabase.rpc('register_push', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth })
  if (error) throw error
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = reg && (await reg.pushManager.getSubscription())
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }
}
