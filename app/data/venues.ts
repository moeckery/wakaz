import type { Venue } from '~/types/venue'

const presets = [
  {
    id: 'north',
    name: { en: 'North Coffee', ar: 'نورث كوفي' },
    branch: { en: 'Al Olaya, Riyadh', ar: 'العليا، الرياض' },
    address: { en: 'Olaya Street · Ground floor', ar: 'شارع العليا · الدور الأرضي' },
    monogram: 'n',
    color: '#6F4E37',
  },
  {
    id: 'field',
    name: { en: 'Field Matcha', ar: 'فيلد ماتشا' },
    branch: { en: 'Al Nakheel, Riyadh', ar: 'النخيل، الرياض' },
    address: { en: 'Al Takhassusi Street · Ground floor', ar: 'شارع التخصصي · الدور الأرضي' },
    monogram: 'f',
    color: '#285544',
  },
] as const satisfies readonly Venue[]

export type VenueId = (typeof presets)[number]['id']
export const venues: readonly (Venue & { id: VenueId })[] = presets
export const defaultVenue: (typeof venues)[number] = presets[0]
