export type VenueLocale = 'en' | 'ar'

export interface Venue {
  id: string
  name: Record<VenueLocale, string>
  branch: Record<VenueLocale, string>
  address: Record<VenueLocale, string>
  monogram: string
  logo?: string
  color: string
}
