import type { VenueId } from './venues'
import type { OrderItem, PagerOrder } from '../types/pager'
import type messages from '../../i18n/locales/en.json'

type ItemNameKey = `ranna.demoItems.${keyof typeof messages.ranna.demoItems}`
type DemoOrderItem = Omit<OrderItem, 'name'> & { nameKey: ItemNameKey }
type DemoOrder = Omit<PagerOrder, 'items'> & { items: readonly DemoOrderItem[] }

// Fictional order details. Names are resolved through Nuxt i18n in usePager.
export const demoOrders = {
  north: {
    number: '042',
    pickupCode: 'KMTP',
    items: [
      { id: 'flat-white', nameKey: 'ranna.demoItems.flatWhite', quantity: 2 },
      { id: 'iced-latte', nameKey: 'ranna.demoItems.icedLatte', quantity: 1 },
      { id: 'croissant', nameKey: 'ranna.demoItems.croissant', quantity: 2 },
    ],
  },
  field: {
    number: '042',
    pickupCode: 'WNQF',
    items: [
      { id: 'iced-matcha', nameKey: 'ranna.demoItems.icedMatcha', quantity: 2 },
      { id: 'matcha-cookie', nameKey: 'ranna.demoItems.matchaCookie', quantity: 1 },
    ],
  },
} as const satisfies Record<VenueId, DemoOrder>
