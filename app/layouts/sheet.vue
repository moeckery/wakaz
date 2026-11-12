<script setup lang="ts">
import AppSheet from '~/components/AppSheet.vue'
import type { RouteLocationNormalized, RouteLocationRaw, RouteRecordName } from 'vue-router'
import type { SheetOptions } from '~/types/sheet'

const props = withDefaults(
  defineProps<
    SheetOptions & {
      title: string
      page: RouteRecordName
      parent: RouteLocationRaw
    }
  >(),
  { handle: true },
)
const { t } = useI18n()
const { covered, transition } = useLayer(props)
const navigation = useLayerNavigation()
const router = useRouter()
const sheet = useTemplateRef<InstanceType<typeof AppSheet>>('sheet')
const open = ref(true)
let closingForNavigation = false
let pendingDestination: RouteLocationNormalized | undefined

function updateOpen(value: boolean) {
  open.value = value
  if (!value && !closingForNavigation && !covered.value) void navigation.close(props.parent)
}

// Browser Back and page actions share the same close lifecycle as a swipe.
onBeforeRouteLeave(async (to) => {
  closingForNavigation = true
  pendingDestination = to
  await sheet.value?.close()
  if (open.value) return false
})

function restoreAfterFailure(to: RouteLocationNormalized) {
  const stillMounted = router.currentRoute.value.matched.some(
    (record) => record.name === props.page,
  )
  if (to === pendingDestination && stillMounted) {
    closingForNavigation = false
    pendingDestination = undefined
    open.value = true
  }
}
const stopAfterEach = router.afterEach((to, _from, failure) => {
  if (failure) restoreAfterFailure(to)
})
const stopOnError = router.onError((_error, to) => restoreAfterFailure(to))
onBeforeUnmount(() => {
  stopAfterEach()
  stopOnError()
})
</script>

<template>
  <div class="layer" data-kind="sheet">
    <AppSheet
      ref="sheet"
      :open="open"
      :title="title"
      :close-label="t('common.close')"
      :snaps="snaps"
      :initial="initial"
      :handle="handle"
      :modal="covered ? false : 'trap-focus'"
      :covered="covered"
      @update:open="updateOpen"
    >
      <slot />
    </AppSheet>
    <slot name="children" :transition="transition" />
  </div>
</template>
