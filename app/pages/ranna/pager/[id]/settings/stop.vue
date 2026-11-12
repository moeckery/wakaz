<script setup lang="ts">
import { venues } from '~/data/venues'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { close } = useLayerNavigation()
const { stopTracking } = usePagerTracking()
const stopping = ref(false)

async function confirmStop() {
  if (stopping.value) return
  stopping.value = true
  const venue = venues.find((preset) => preset.id === route.params.id)
  if (venue) stopTracking(venue.id)
  try {
    await router.replace({ name: 'ranna' })
  } finally {
    stopping.value = false
  }
}
</script>

<template>
  <div class="route-page">
    <NuxtLayout
      name="dialog"
      page="ranna-pager-id-settings-stop"
      :title="t('ranna.tracking.stopTitle')"
      :parent="{ name: 'ranna-pager-id-settings' }"
    >
      <p class="body-copy">{{ t('ranna.tracking.stopBody') }}</p>
      <div class="stop-actions">
        <AppButton :disabled="stopping" @click="confirmStop">{{
          t('ranna.tracking.stop')
        }}</AppButton>
        <AppButton
          variant="text"
          :disabled="stopping"
          @click="close({ name: 'ranna-pager-id-settings' })"
          >{{ t('ranna.tracking.keepTracking') }}</AppButton
        >
      </div>
    </NuxtLayout>
  </div>
</template>

<style scoped>
.stop-actions {
  display: grid;
  gap: 4px;
  margin-block-start: 24px;
}
</style>
