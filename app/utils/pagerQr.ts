import { venues, type VenueId } from '../data/venues.ts'

// QR data selects a known demo pager; it can never supply a navigation destination.
export function parsePagerQr(value: string, origin?: string): VenueId | null {
  const token = /^ranna:demo:([a-z]+)$/.exec(value)
  if (token) return venues.find((venue) => venue.id === token[1])?.id ?? null
  const route = /^(?:https?:\/\/[^/?#]+)?\/ranna\/pager\/([a-z]+)$/.exec(value)
  const venue = venues.find((candidate) => candidate.id === route?.[1])
  if (!origin || !venue) return null

  try {
    const url = new URL(value, origin)
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.origin !== new URL(origin).origin ||
      url.pathname !== `/ranna/pager/${venue.id}` ||
      url.username ||
      url.password
    ) {
      return null
    }
    return venue.id
  } catch {
    return null
  }
}
