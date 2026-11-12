import { defaultVenue, type VenueId } from '~/data/venues'
import type { PickupSession } from '~/types/pager'
import {
  createPagerTracking,
  legacyPagerStorageKey,
  pagerStorageKey,
  readStoredPagers,
} from '~/utils/pagerTracking'

export default defineNuxtPlugin(() => {
  const tracking = useState('pager-tracking', createPagerTracking)
  const sessions = useState<Record<string, Readonly<PickupSession>>>('pager-sessions', () => ({}))
  const selectedVenue = useState<VenueId>('venue-id', () => defaultVenue.id)

  try {
    const current = localStorage.getItem(pagerStorageKey)
    const raw = current ?? localStorage.getItem(legacyPagerStorageKey)
    const saved = readStoredPagers(raw)
    tracking.value = saved.tracking
    sessions.value = saved.sessions
    selectedVenue.value = saved.selectedVenue
    if (current === null && raw !== null) {
      // Only retire the old key after its validated order history is safely copied.
      localStorage.setItem(pagerStorageKey, JSON.stringify(saved))
      localStorage.removeItem(legacyPagerStorageKey)
    }
  } catch {
    // Browsers may deny storage; tracking still works for the current visit.
  }

  // One app-level subscription, regardless of how many screens use the composables.
  watch(
    [tracking, sessions, selectedVenue],
    () => {
      try {
        localStorage.setItem(
          pagerStorageKey,
          JSON.stringify({
            version: 2,
            tracking: tracking.value,
            sessions: sessions.value,
            selectedVenue: selectedVenue.value,
          }),
        )
      } catch {
        // Storage can also become unavailable later, without affecting the UI.
      }
    },
    { deep: true, flush: 'sync' },
  )
})
