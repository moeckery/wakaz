<script setup lang="ts">
const { t } = useI18n()
const {
  state,
  order,
  session,
  nudge,
  collect,
  setRating,
  setComment,
  submitFeedback,
  skipFeedback,
} = usePager()
const { identity } = useVenue()
const route = useRoute()
const router = useRouter()
const pagerStatus = useTemplateRef('pagerStatus')
const mounts = useState('home-mounts', () => 0)
onMounted(async () => {
  mounts.value++
  await nextTick()
  if (router.currentRoute.value.name === 'ranna-pager-id') pagerStatus.value?.focus()
})
useHead(() => ({ title: t('ranna.title') }))

async function confirmPickup() {
  if (!collect()) return
  await nextTick()
  pagerStatus.value?.focus()
}
</script>

<template>
  <div class="route-page pager-page">
    <NuxtLayout name="screen" page="ranna-pager-id" title="ranna">
      <template #background>
        <VenueGlow />
      </template>
      <template #brand><AppIcon name="bell-ring" class="pager-brand" /></template>
      <template #actions>
        <AppButton
          :to="{ name: 'ranna-pager-id-settings', params: { id: route.params.id } }"
          variant="icon"
          icon="settings-2"
          :aria-label="t('common.settings')"
        />
      </template>
      <template #default="{ covered }">
        <div class="pager-home" :data-collected="state === 'collected'">
          <VenueRibbon />
          <PagerStatus
            ref="pagerStatus"
            :state="state"
            :feedback="session.feedback"
            :venue="identity.name"
            :paused="covered"
          >
            <AppFade :paused="covered">
              <PickupComplete
                v-if="state === 'collected'"
                :number="order.number"
                :paused="covered"
                :rating="session.rating"
                :comment="session.comment"
                :feedback="session.feedback"
                @update:rating="setRating"
                @update:comment="setComment"
                @submit="submitFeedback"
                @skip="skipFeedback"
              />
            </AppFade>
          </PagerStatus>
          <AppFade class="pager-footer" :paused="covered">
            <div v-if="state !== 'collected'" class="pager-order">
              <OrderCard
                :number="order.number"
                :pickup="t('ranna.counter')"
                :to="{ name: 'ranna-pager-id-pickup', params: { id: route.params.id } }"
              />
              <PagerActions
                :state="state"
                :nudged="session.nudged"
                :paused="covered"
                @start="state = 'waiting'"
                @nudge="nudge"
                @collect="confirmPickup"
              />
            </div>
          </AppFade>
        </div>
      </template>
      <template #children="{ transition }">
        <NuxtPage :transition="transition" />
      </template>
    </NuxtLayout>
  </div>
</template>

<style scoped>
/* Tracking replaces the entry experience, including any open child layers on exit. */
.pager-page.layer-enter-active {
  transition:
    opacity 220ms ease-out,
    transform 220ms cubic-bezier(0.22, 0.7, 0.22, 1);
}
.pager-page.layer-leave-active {
  transition: opacity 160ms ease;
}
.pager-page.layer-enter-from {
  opacity: 0;
  transform: scale(1.035);
}
.pager-page.layer-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .pager-page.layer-enter-from,
  .pager-page.layer-leave-to {
    opacity: 1;
    transform: none;
  }
}
.pager-brand {
  inline-size: 24px;
  block-size: 24px;
}
.pager-home {
  position: relative;
  min-block-size: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
}
.pager-home[data-collected='true'] {
  grid-template-rows: auto 1fr;
  gap: 20px;
}
.pager-home[data-collected='true'] .pager-footer {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
}
/* The departing ticket keeps its bottom anchor while the collected layout takes over. */
.pager-footer :deep(> .app-fade-leave-active) {
  inset-block-start: auto;
  inset-block-end: 0;
}
.pager-order {
  display: grid;
  gap: 24px;
}
</style>
