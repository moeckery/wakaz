import { defaultVenue, venues, type VenueId } from '~/data/venues'
import { normalizeVenueColor, venuePalette } from '~/utils/venueColor'

export function useVenue() {
  const selectedId = useState<VenueId>('venue-id', () => defaultVenue.id)
  const colorOverrides = useState<Partial<Record<VenueId, string>>>('venue-colors', () => ({}))
  const { locale } = useI18n()
  const { dark } = useDemoPreferences()
  const venue = computed(
    () => venues.find((preset) => preset.id === selectedId.value) ?? defaultVenue,
  )
  const identity = computed(() => {
    const language = locale.value === 'ar' ? 'ar' : 'en'
    return {
      name: venue.value.name[language],
      branch: venue.value.branch[language],
      address: venue.value.address[language],
    }
  })

  function setColor(input: unknown) {
    const normalizedColor = normalizeVenueColor(input)
    if (!normalizedColor) return false
    colorOverrides.value[venue.value.id] = normalizedColor
    return true
  }

  function colorFor(id: VenueId) {
    return colorOverrides.value[id] ?? venues.find((preset) => preset.id === id)!.color
  }

  const color = computed({
    get: () => colorFor(venue.value.id),
    set: (input: string) => {
      setColor(input)
    },
  })
  const style = computed(() => {
    const palette = venuePalette(color.value, dark.value ? '#161616' : '#FFFFFF')
    return {
      '--venue-color': palette.background,
      '--venue-ink': palette.foreground,
      '--venue-secondary': palette.secondary,
      '--venue-border': palette.border,
      '--venue-mark-line': palette.markLine,
    }
  })

  return { venues, selectedId, venue, identity, color, style, setColor, colorFor }
}
