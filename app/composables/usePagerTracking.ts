import { defaultVenue, venues, type VenueId } from '~/data/venues'
import {
  createPagerTracking,
  updatePagerTracking,
  type TrackingAction,
} from '~/utils/pagerTracking'

export function usePagerTracking() {
  const tracking = useState('pager-tracking', createPagerTracking)
  const selectedVenue = useState<VenueId>('venue-id', () => defaultVenue.id)
  const activeVenue = computed(
    () => venues.find((preset) => preset.id === tracking.value.active) ?? null,
  )
  const lastRemovedVenue = computed(
    () => venues.find((preset) => preset.id === tracking.value.lastRemoved) ?? null,
  )
  const isTracked = computed(() => tracking.value.active === selectedVenue.value)

  function applyAction(action: TrackingAction) {
    const next = updatePagerTracking(tracking.value, action)
    if (next === tracking.value) return false
    tracking.value = next
    return true
  }

  function restoreLastRemoved() {
    const venueId = tracking.value.lastRemoved
    return applyAction({ type: 'restore' }) ? venueId : null
  }

  return {
    activeVenue,
    lastRemovedVenue,
    isTracked,
    startTracking: (venueId: VenueId) => applyAction({ type: 'start', venueId }),
    stopTracking: (venueId: VenueId) => applyAction({ type: 'stop', venueId }),
    restoreLastRemoved,
  }
}
