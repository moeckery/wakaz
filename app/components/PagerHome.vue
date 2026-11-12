<script setup lang="ts">
import type { VenueId } from '~/data/venues'

withDefaults(defineProps<{ paused?: boolean }>(), { paused: false })
const { t } = useI18n()
const router = useRouter()
const { lastRemovedVenue, startTracking, restoreLastRemoved } = usePagerTracking()
const opening = ref(false)

async function openPager(id: VenueId) {
  if (opening.value) return
  opening.value = true
  startTracking(id)
  try {
    await router.replace({ name: 'ranna-pager-id', params: { id } })
  } finally {
    opening.value = false
  }
}

function restorePager() {
  const id = restoreLastRemoved()
  if (id) void openPager(id)
}
</script>

<template>
  <div class="pager-home">
    <section class="scan-section" aria-labelledby="scan-heading">
      <div class="home-intro">
        <h2 id="scan-heading">{{ t('ranna.home.scan') }}</h2>
        <p>{{ t('ranna.home.scanHint') }}</p>
      </div>
      <PagerScanner :paused="paused || opening" @detected="openPager" />
    </section>

    <section v-if="lastRemovedVenue" class="removed-pager" aria-labelledby="removed-heading">
      <h2 id="removed-heading" class="section-heading">{{ t('ranna.home.lastRemoved') }}</h2>
      <PagerRecovery :venue="lastRemovedVenue" @restore="restorePager" />
    </section>
  </div>
</template>

<style scoped>
.pager-home {
  display: grid;
  align-content: start;
  gap: 28px;
}
.home-intro {
  margin-block: 8px 22px;
}
.home-intro h2 {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.9px;
  text-wrap: balance;
}
.home-intro h2:dir(rtl) {
  letter-spacing: 0;
  line-height: 1.5;
}
.home-intro p {
  margin-block-start: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--secondary);
  text-wrap: pretty;
}
.section-heading {
  margin-block-end: 12px;
  font-size: 13px;
  font-weight: 550;
  line-height: 1.5;
}
.removed-pager .section-heading {
  color: var(--secondary);
}
</style>
