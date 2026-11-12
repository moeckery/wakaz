import { demoOrders } from '~/data/orders'
import type { PagerOrder, PagerState, PickupSession } from '~/types/pager'
import { createPickupSession, updatePickupSession, type PickupAction } from '~/utils/pickupSession'

export function usePager() {
  const includeItems = useState('pager-include-items', () => true)
  const { venue } = useVenue()
  const { t } = useI18n()
  const sessions = useState<Record<string, Readonly<PickupSession>>>('pager-sessions', () => ({}))
  const initialSession = createPickupSession()
  const selectedOrder = computed(() => demoOrders[venue.value.id])
  const pickupCode = computed(() => selectedOrder.value.pickupCode)
  const session = computed(() => readonly(sessions.value[pickupCode.value] ?? initialSession))
  const state = computed<PagerState>({
    get: () => session.value.state,
    // Preview controls change the stage without clearing the order's history.
    set: (value) => {
      if (value !== session.value.state)
        sessions.value[pickupCode.value] = { ...session.value, state: value }
    },
  })
  const order = computed<PagerOrder>(() => {
    const source = selectedOrder.value
    return {
      number: source.number,
      pickupCode: source.pickupCode,
      ...(includeItems.value
        ? {
            items: source.items.map((item) => ({
              id: item.id,
              name: t(item.nameKey),
              quantity: item.quantity,
            })),
          }
        : {}),
    }
  })

  function applyAction(action: PickupAction) {
    const current = session.value
    const next = updatePickupSession(current, action)
    if (next === current) return false
    sessions.value[pickupCode.value] = next
    return true
  }

  function resetOrder() {
    delete sessions.value[pickupCode.value]
  }

  return {
    state,
    order,
    includeItems,
    session,
    nudge: () => applyAction({ type: 'nudge' }),
    collect: () => applyAction({ type: 'collect' }),
    setRating: (value: number) => applyAction({ type: 'rate', value }),
    setComment: (value: string) => applyAction({ type: 'comment', value }),
    submitFeedback: () => applyAction({ type: 'submit' }),
    skipFeedback: () => applyAction({ type: 'skip' }),
    resetOrder,
  }
}
