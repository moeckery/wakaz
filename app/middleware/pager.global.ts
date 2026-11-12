import { defaultVenue, type VenueId } from '~/data/venues'

export default defineNuxtRouteMiddleware((to) => {
  const name = typeof to.name === 'string' ? to.name : ''
  const isPager = to.matched.some((record) => record.name === 'ranna-pager-id')
  const isHome = name === 'ranna' || name === 'ranna-scan'
  const isPreferences = name === 'ranna-settings' || name.startsWith('ranna-settings-')
  if (!isPager && !isHome && !isPreferences) return

  const { activeVenue } = usePagerTracking()
  const venue = activeVenue.value
  const query = Object.keys(to.query ?? {}).length ? { query: to.query } : {}
  if (isPager) {
    if (!venue || to.params.id !== venue.id) {
      return navigateTo(
        {
          ...(venue ? { name: 'ranna-pager-id', params: { id: venue.id } } : { name: 'ranna' }),
          ...query,
        },
        { replace: true },
      )
    }
    // The active order determines its venue, regardless of a stale inspector selection.
    useState<VenueId>('venue-id', () => defaultVenue.id).value = venue.id
    return
  }

  if (venue) {
    const suffix = isPreferences ? name.slice('ranna'.length) : ''
    return navigateTo(
      { name: `ranna-pager-id${suffix}`, params: { id: venue.id }, ...query },
      { replace: true },
    )
  }
})
