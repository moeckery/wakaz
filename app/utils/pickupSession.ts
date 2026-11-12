import type { PickupRating, PickupSession } from '../types/pager'

export const feedbackCommentLimit = 500

export function isPickupRating(value: number): value is PickupRating {
  return Number.isInteger(value) && value >= 1 && value <= 5
}

export type PickupAction =
  | { type: 'nudge' | 'collect' | 'submit' | 'skip' }
  | { type: 'rate'; value: number }
  | { type: 'comment'; value: string }

export function createPickupSession(): PickupSession {
  return { state: 'waiting', nudged: false, rating: 0, comment: '', feedback: 'pending' }
}

// Return the same object when an action is unavailable, including repeat taps.
export function updatePickupSession(
  session: Readonly<PickupSession>,
  action: PickupAction,
): Readonly<PickupSession> {
  if (action.type === 'nudge') {
    return session.state === 'waiting' && !session.nudged ? { ...session, nudged: true } : session
  }
  if (action.type === 'collect') {
    return session.state === 'ready' ? { ...session, state: 'collected' } : session
  }
  if (session.state !== 'collected' || session.feedback !== 'pending') return session

  switch (action.type) {
    case 'rate':
      return isPickupRating(action.value) && action.value !== session.rating
        ? { ...session, rating: action.value }
        : session
    case 'comment': {
      const comment = action.value.slice(0, feedbackCommentLimit)
      return comment !== session.comment ? { ...session, comment } : session
    }
    case 'submit':
      return isPickupRating(session.rating)
        ? { ...session, comment: session.comment.trim(), feedback: 'submitted' }
        : session
    case 'skip':
      return { ...session, feedback: 'skipped' }
  }
}
