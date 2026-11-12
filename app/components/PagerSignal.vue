<script setup lang="ts">
import type { PagerState } from '~/types/pager'

const props = withDefaults(defineProps<{ state: PagerState; paused?: boolean }>(), {
  paused: false,
})
const rings = useTemplateRef<HTMLSpanElement[]>('rings')
const isSettling = ref(false)
const icons = { entry: 'qr-code', waiting: 'bell', ready: 'check' } as const
let handoffAnimations: Animation[] = []
let motionRevision = 0
let reducedMotion: MediaQueryList | undefined

function cancelHandoff() {
  motionRevision++
  handoffAnimations.forEach((animation) => animation.cancel())
  handoffAnimations = []
  isSettling.value = false
}

// The loop is CSS. Only a state change needs a bridge from its current position.
watch(
  () => props.state,
  async () => {
    const elements = rings.value ?? []
    const previousTransforms = elements.map((ring) => getComputedStyle(ring).transform)
    cancelHandoff()
    if (!elements.length || props.paused || reducedMotion?.matches) return

    const currentRevision = motionRevision
    isSettling.value = true
    await nextTick()
    if (currentRevision !== motionRevision) return

    handoffAnimations = elements.map((ring, index) =>
      ring.animate(
        [{ transform: previousTransforms[index] }, { transform: getComputedStyle(ring).transform }],
        { duration: 320, easing: 'cubic-bezier(.22,.7,.22,1)', fill: 'both' },
      ),
    )

    await Promise.allSettled(handoffAnimations.map((animation) => animation.finished))
    if (currentRevision === motionRevision) cancelHandoff()
  },
)

watch(
  () => props.paused,
  (paused) => {
    if (paused) cancelHandoff()
  },
)
onMounted(() => {
  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.addEventListener('change', cancelHandoff)
})
onBeforeUnmount(() => {
  cancelHandoff()
  reducedMotion?.removeEventListener('change', cancelHandoff)
})
</script>

<template>
  <div
    class="pager-signal"
    :data-state="state"
    :data-paused="paused || isSettling"
    aria-hidden="true"
  >
    <span v-for="ring in 3" :key="ring" ref="rings" class="signal-ring" />
    <span class="signal-core">
      <svg
        v-for="(icon, status) in icons"
        :key="status"
        class="signal-icon"
        :data-icon="status"
        viewBox="0 0 24 24"
        focusable="false"
      >
        <use :href="`/solar.svg#${icon}`" />
      </svg>
    </span>
  </div>
</template>

<style scoped>
.pager-signal {
  --signal-entry: #3478f6;
  --signal-waiting: #e76224;
  --signal-ready: #15764b;
  --signal-ink: #fff;
  --signal-color: var(--signal-waiting);
  position: relative;
  display: grid;
  place-items: center;
  inline-size: 222px;
  block-size: 214px;
  flex-shrink: 0;
  isolation: isolate;
}
.dark .pager-signal {
  --signal-entry: #8db8ff;
  --signal-waiting: #f39a68;
  --signal-ready: #86d6aa;
  --signal-ink: #171717;
}
.pager-signal[data-state='entry'] {
  --signal-color: var(--signal-entry);
}
.pager-signal[data-state='ready'],
.pager-signal[data-state='collected'] {
  --signal-color: var(--signal-ready);
}
.signal-ring {
  --ring-scale: 1.42;
  --ring-phase: -0.32s;
  position: absolute;
  inline-size: 92px;
  block-size: 92px;
  border-radius: 50%;
  background: var(--signal-color);
  opacity: 0.18;
  transform: scale(var(--ring-scale));
  transition: background-color 320ms ease;
}
.signal-ring:nth-child(2) {
  --ring-scale: 1.9;
  --ring-phase: -0.16s;
  opacity: 0.1;
}
.signal-ring:nth-child(3) {
  --ring-scale: 2.4;
  --ring-phase: 0s;
  opacity: 0.05;
}
.pager-signal[data-state='entry'] .signal-ring:nth-child(1) {
  --ring-scale: 1.21;
}
.pager-signal[data-state='entry'] .signal-ring:nth-child(2) {
  --ring-scale: 1.45;
}
.pager-signal[data-state='entry'] .signal-ring:nth-child(3) {
  --ring-scale: 1.7;
}
.pager-signal[data-state='waiting'] .signal-ring {
  will-change: transform;
  animation: pager-breathe 3.2s ease-in-out var(--ring-phase) infinite;
}
.pager-signal[data-paused='true'] .signal-ring {
  animation-play-state: paused;
}
.signal-core {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  inline-size: 92px;
  block-size: 92px;
  border-radius: 50%;
  background: var(--signal-color);
  color: var(--signal-ink);
  transition:
    background-color 320ms ease,
    color 320ms ease;
}
.signal-icon {
  grid-area: 1/1;
  inline-size: 38px;
  block-size: 38px;
  fill: none;
  stroke: none;
  opacity: 0;
  transition: opacity 160ms ease;
}
.signal-icon[data-icon='ready'] {
  inline-size: 48px;
  block-size: 48px;
}
.pager-signal[data-state='entry'] [data-icon='entry'],
.pager-signal[data-state='waiting'] [data-icon='waiting'],
.pager-signal[data-state='ready'] [data-icon='ready'],
.pager-signal[data-state='collected'] [data-icon='ready'] {
  opacity: 1;
}
@keyframes pager-breathe {
  0%,
  100% {
    transform: scale(var(--ring-scale));
  }
  50% {
    transform: scale(calc(var(--ring-scale) * 0.84));
  }
}
@media (prefers-reduced-motion: reduce) {
  .pager-signal .signal-ring {
    animation: none;
    will-change: auto;
  }
  .signal-ring,
  .signal-core,
  .signal-icon {
    transition: none;
  }
}
</style>
