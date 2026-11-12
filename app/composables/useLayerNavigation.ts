import type { RouteLocationRaw } from 'vue-router'

export function useLayerNavigation() {
  const router = useRouter()
  const closing = useState('layer-closing', () => false)

  async function close(parent: RouteLocationRaw) {
    if (closing.value) return
    const parentPath = router.resolve(parent).fullPath
    closing.value = true

    if (router.options.history.state.back !== parentPath) {
      try {
        await router.replace(parentPath)
      } finally {
        closing.value = false
      }
      return
    }

    // Back has no promise. Release the guard on success, cancellation, or a router error.
    const unsubscribe: (() => void)[] = []
    const finish = () => {
      closing.value = false
      unsubscribe.splice(0).forEach((stop) => stop())
    }
    unsubscribe.push(router.afterEach(finish), router.onError(finish))
    try {
      router.back()
    } catch (error) {
      finish()
      throw error
    }
  }

  return { close }
}
