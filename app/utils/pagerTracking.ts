import { demoOrders } from '../data/orders.ts'
import { defaultVenue, venues, type VenueId } from '../data/venues.ts'
import type { PickupSession } from '../types/pager'
import { feedbackCommentLimit, isPickupRating } from './pickupSession.ts'

export const pagerStorageKey = 'ranna-pagers-v2'
export const legacyPagerStorageKey = 'ranna-pagers-v1'

export interface PagerTracking {
  active: VenueId | null
  lastRemoved: VenueId | null
}

export interface StoredPagers {
  version: 2
  tracking: PagerTracking
  sessions: Record<string, Readonly<PickupSession>>
  selectedVenue: VenueId
}

export type TrackingAction = { type: 'start' | 'stop'; venueId: VenueId } | { type: 'restore' }

export function createPagerTracking(): PagerTracking {
  return { active: null, lastRemoved: null }
}

export function updatePagerTracking(
  tracking: PagerTracking,
  action: TrackingAction,
): PagerTracking {
  if (action.type === 'restore') {
    return !tracking.active && tracking.lastRemoved
      ? updatePagerTracking(tracking, { type: 'start', venueId: tracking.lastRemoved })
      : tracking
  }

  const isTracked = tracking.active === action.venueId
  if (action.type === 'start') {
    if (isTracked) return tracking
    return {
      active: action.venueId,
      lastRemoved: tracking.lastRemoved === action.venueId ? null : tracking.lastRemoved,
    }
  }

  return isTracked
    ? {
        active: null,
        lastRemoved: action.venueId,
      }
    : tracking
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isVenueId(value: unknown): value is VenueId {
  return venues.some((venue) => venue.id === value)
}

function readSession(value: unknown): PickupSession | null {
  if (
    !isRecord(value) ||
    typeof value.state !== 'string' ||
    !['entry', 'waiting', 'ready', 'collected'].includes(value.state) ||
    typeof value.nudged !== 'boolean' ||
    typeof value.rating !== 'number' ||
    (value.rating !== 0 && !isPickupRating(value.rating)) ||
    typeof value.comment !== 'string' ||
    typeof value.feedback !== 'string' ||
    !['pending', 'submitted', 'skipped'].includes(value.feedback) ||
    (value.feedback === 'submitted' && value.rating === 0)
  ) {
    return null
  }

  return {
    state: value.state as PickupSession['state'],
    nudged: value.nudged,
    rating: value.rating as PickupSession['rating'],
    comment: value.comment.slice(0, feedbackCommentLimit),
    feedback: value.feedback as PickupSession['feedback'],
  }
}

// Storage is untrusted input: retain only known demo orders and valid session fields.
export function readStoredPagers(raw: string | null): StoredPagers {
  const empty: StoredPagers = {
    version: 2,
    tracking: createPagerTracking(),
    sessions: {},
    selectedVenue: defaultVenue.id,
  }
  if (!raw) return empty

  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return empty
  }
  if (!isRecord(value) || (value.version !== 1 && value.version !== 2)) return empty

  const tracking = isRecord(value.tracking) ? value.tracking : {}
  let active = isVenueId(tracking.active) ? tracking.active : null
  if (value.version === 1) {
    // The former multi-pager demo becomes one active pager without losing order history.
    const tracked = Array.isArray(tracking.tracked) ? tracking.tracked.filter(isVenueId) : []
    active =
      isVenueId(value.selectedVenue) && tracked.includes(value.selectedVenue)
        ? value.selectedVenue
        : (tracked.at(-1) ?? null)
  }
  const lastRemoved =
    isVenueId(tracking.lastRemoved) && tracking.lastRemoved !== active ? tracking.lastRemoved : null
  const sessions: StoredPagers['sessions'] = {}
  if (isRecord(value.sessions)) {
    for (const order of Object.values(demoOrders)) {
      const session = readSession(value.sessions[order.pickupCode])
      if (session) sessions[order.pickupCode] = session
    }
  }

  return {
    version: 2,
    tracking: { active, lastRemoved },
    sessions,
    selectedVenue:
      active ?? (isVenueId(value.selectedVenue) ? value.selectedVenue : defaultVenue.id),
  }
}
