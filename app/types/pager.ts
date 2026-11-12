export type PagerState = 'entry' | 'waiting' | 'ready' | 'collected'
export type FeedbackStatus = 'pending' | 'submitted' | 'skipped'
export type PickupRating = 1 | 2 | 3 | 4 | 5

export interface PickupSession {
  state: PagerState
  nudged: boolean
  rating: 0 | PickupRating
  comment: string
  feedback: FeedbackStatus
}

export interface OrderItem {
  id: string
  name: string
  quantity: number
}

export interface PagerOrder {
  number: string
  pickupCode: string
  items?: readonly OrderItem[]
}
