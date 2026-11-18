import { supabase } from './supabase'

export function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  if (s < 604800) return `${Math.floor(s / 86400)} d ago`
  return new Date(iso).toLocaleDateString()
}

async function compressImage(file, max = 1280) {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale)
  c.height = Math.round(bmp.height * scale)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error('Could not process the photo'))), 'image/jpeg', 0.8))
}

export async function uploadMedia(file, uid) {
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  if (!isImage && !isVideo) throw new Error('Choose a photo or a video.')
  if (isVideo && file.size > 40 * 1024 * 1024) throw new Error('That video is too large. Keep it under 40 MB.')
  let blob = file
  let type = file.type
  if (isImage) {
    blob = await compressImage(file)
    type = 'image/jpeg'
  }
  const sub = type.split('/')[1]
  const ext = isImage ? 'jpg' : sub === 'quicktime' ? 'mov' : sub
  const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('media').upload(path, blob, { contentType: type })
  if (error) throw error
  const { data } = supabase.storage.from('media').getPublicUrl(path)
  return { url: data.publicUrl, type: isImage ? 'image' : 'video' }
}

export async function removeMedia(url) {
  const marker = '/object/public/media/'
  const i = url.indexOf(marker)
  if (i === -1) return
  await supabase.storage.from('media').remove([decodeURIComponent(url.slice(i + marker.length))])
}
