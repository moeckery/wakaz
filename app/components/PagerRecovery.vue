<script setup lang="ts">
import { demoOrders } from '~/data/orders'
import type { VenueId } from '~/data/venues'
import type { Venue } from '~/types/venue'
import { venuePalette } from '~/utils/venueColor'

const props = defineProps<{ venue: Venue & { id: VenueId } }>()
defineEmits<{ restore: [] }>()
const { t, locale } = useI18n()
const { dark } = useDemoPreferences()
const { colorFor } = useVenue()
const language = computed(() => (locale.value === 'ar' ? 'ar' : 'en'))
const order = computed(() => demoOrders[props.venue.id])
const style = computed(() => {
  const palette = venuePalette(colorFor(props.venue.id), dark.value ? '#161616' : '#fff')
  return {
    '--venue-color': palette.background,
    '--venue-ink': palette.foreground,
    '--venue-mark-line': palette.markLine,
  }
})
</script>

<template>
  <AppButton variant="row" class="pager-recovery" :style="style" @click="$emit('restore')">
    <span class="recovery-identity">
      <VenueMark :venue="venue" class="recovery-mark" />
      <span class="recovery-copy">
        <strong>{{ venue.name[language] }}</strong>
        <span>{{ t('ranna.home.order', { number: order.number }) }}</span>
      </span>
      <span class="recovery-action">
        <AppIcon name="rotate-ccw" />{{ t('ranna.home.restore') }}
      </span>
    </span>
  </AppButton>
</template>

<style scoped>
.pager-recovery {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
  font-weight: 400;
}
.recovery-identity {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 17px;
  color: var(--ink);
}
.recovery-mark {
  inline-size: 40px;
  block-size: 40px;
  background: var(--venue-color);
  color: var(--venue-ink);
}
.recovery-copy {
  flex: 1;
  min-inline-size: 0;
}
.recovery-copy strong {
  display: block;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
}
.recovery-copy > span {
  display: block;
  margin-block-start: 3px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--secondary);
}
.recovery-action {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 550;
  line-height: 1.5;
}
.recovery-action .icon {
  inline-size: 15px;
  block-size: 15px;
}
</style>
