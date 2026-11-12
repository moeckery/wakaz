import type { RouteLocationRaw, RouteRecordName } from 'vue-router'

interface LayerOptions {
  page: RouteRecordName
  parent?: RouteLocationRaw
}

interface LayerBehavior {
  trapFocus?: boolean
}

const focusableSelector =
  'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]'

// Layouts share interaction behavior; pages explicitly own their child outlets.
export function useLayer(options: LayerOptions, { trapFocus = false }: LayerBehavior = {}) {
  const router = useRouter()
  const navigation = useLayerNavigation()
  const panel = ref<HTMLElement>()
  const heading = ref<HTMLElement>()
  const active = computed(() => router.currentRoute.value.name === options.page)
  const covered = ref(!active.value)
  let returnFocus: HTMLElement | null = null

  watch(
    active,
    (isActive) => {
      if (isActive) return // Wait for the child's exit before enabling this panel.
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      covered.value = true
    },
    { flush: 'sync' },
  )

  async function restoreFocus() {
    if (!active.value) return
    covered.value = false
    await nextTick()
    // A new child may have opened while this panel was being restored.
    if (!active.value || covered.value) return
    const target =
      returnFocus?.isConnected && !returnFocus.closest('[inert]') ? returnFocus : heading.value
    target?.focus({ preventScroll: true })
    returnFocus = null
  }

  const transition = {
    name: 'layer',
    onAfterLeave: restoreFocus,
    onLeaveCancelled: restoreFocus,
  }

  function close() {
    if (!covered.value && options.parent) void navigation.close(options.parent)
  }

  function onKeydown(event: KeyboardEvent) {
    if (covered.value) return
    if (event.key === 'Escape' && options.parent) {
      event.preventDefault()
      event.stopPropagation()
      close()
    }
    if (event.key !== 'Tab' || !trapFocus || !panel.value) return
    const controls = [...panel.value.querySelectorAll<HTMLElement>(focusableSelector)].filter(
      (element) =>
        element.tabIndex >= 0 &&
        !element.matches(':disabled') &&
        !element.closest('[inert]') &&
        element.getClientRects().length > 0 &&
        getComputedStyle(element).visibility === 'visible',
    )
    const first = controls[0]
    const last = controls.at(-1)
    const focused = document.activeElement
    if (
      !controls.includes(focused as HTMLElement) ||
      (event.shiftKey && focused === first) ||
      (!event.shiftKey && focused === last)
    ) {
      event.preventDefault()
      const nextControl = (event.shiftKey ? last : first) ?? heading.value
      nextControl?.focus({ preventScroll: true })
    }
  }

  onMounted(async () => {
    await nextTick()
    if (!covered.value && options.parent) heading.value?.focus({ preventScroll: true })
  })

  return { panel, heading, covered, transition, close, onKeydown }
}
