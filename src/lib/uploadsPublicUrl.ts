import { API_BASE_URL } from './apiConfig'

/**
 * Convert a backend-stored upload path (for example `/api/uploads/...` or `/uploads/...`)
 * into a URL the browser can load from the current Source portal.
 */
export function uploadsPublicUrl(storedPath: string | null | undefined): string | null {
  if (!storedPath?.trim()) return null
  const path = storedPath.trim()
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  const base = API_BASE_URL
  if (base.startsWith('http://') || base.startsWith('https://')) {
    const origin = base.replace(/\/api\/?$/, '')
    return `${origin.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}
