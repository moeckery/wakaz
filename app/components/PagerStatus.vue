<script setup lang="ts">
import type { FeedbackStatus, PagerState } from '~/types/pager'

const props = withDefaults(
  defineProps<{
    state: PagerState
    paused?: boolean
    feedback?: FeedbackStatus
    venue?: string
  }>(),
  { paused: false, feedback: 'pending', venue: '' },
)
const { t, locale } = useI18n()
const { arabicTextBy } = useDemoPreferences()
const detailIcons = {
  entry: 'qr-code',
  waiting: 'clock',
  ready: 'map-pin',
  collected: 'check',
} as const
const detailIcon = computed(() => detailIcons[props.state])
const collected = computed(() => props.state === 'collected')
const copy = computed(() => {
  if (collected.value) {
    return {
      label: t('ranna.feedback.collected'),
      title: t(props.feedback === 'submitted' ? 'ranna.feedback.thanks' : 'ranna.feedback.title'),
      body: t(
        props.feedback === 'submitted'
          ? 'ranna.feedback.thanksBody'
          : props.feedback === 'skipped'
            ? 'ranna.feedback.finishedBody'
            : 'ranna.feedback.body',
        { venue: props.venue },
      ),
    }
  }
  return {
    label: t(`ranna.states.${props.state}.label`),
    title: t(`ranna.states.${props.state}.title`),
    body: t(`ranna.states.${props.state}.body`),
  }
})
const heading = useTemplateRef<HTMLHeadingElement>('heading')
const statusCopy = useTemplateRef<HTMLDivElement>('statusCopy')
const signalMotion = useTemplateRef<HTMLDivElement>('signalMotion')
let layoutAnimations: Animation[] = []
let reducedMotion: MediaQueryList | undefined
let layoutRevision = 0

function focus() {
  if (!props.paused && !heading.value?.closest('[inert]'))
    heading.value?.focus({ preventScroll: true })
}
defineExpose({ focus })

// Feedback removes its focused submit/skip control. Focus the persistent result heading.
watch(
  () => props.feedback,
  async (value, previous) => {
    if (!collected.value || value === 'pending' || previous !== 'pending') return
    await nextTick()
    if (collected.value) focus()
  },
)

function cancelMovement() {
  layoutRevision++
  layoutAnimations.forEach((animation) => animation.cancel())
  layoutAnimations = []
}

// Bridge the compact collected layout once, keeping both signal and heading continuous.
watch(
  collected,
  async () => {
    const parts = [
      { element: signalMotion.value, anchor: signalMotion.value, scale: true },
      { element: statusCopy.value, anchor: heading.value, scale: false },
    ].flatMap((part) =>
      part.element && part.anchor
        ? [
            {
              ...part,
              element: part.element,
              anchor: part.anchor,
              from: part.anchor.getBoundingClientRect(),
            },
          ]
        : [],
    )
    cancelMovement()
    const currentRevision = layoutRevision
    if (props.paused || reducedMotion?.matches) return

    await nextTick()
    if (currentRevision !== layoutRevision || props.paused || reducedMotion?.matches) return
    layoutAnimations = parts.flatMap(({ element, anchor, from, scale }) => {
      if (!element.isConnected) return []
      const to = anchor.getBoundingClientRect()
      const width = Number.parseFloat(getComputedStyle(anchor).width)
      if (!from.width || !to.width || !width) return []
      // Rects include preview scaling; transforms use local CSS pixels.
      const previewScale = to.width / width
      const x = (from.left + from.width / 2 - to.left - to.width / 2) / previewScale
      const y = (from.top - to.top + (scale ? (from.height - to.height) / 2 : 0)) / previewScale
      return [
        element.animate(
          [
            { transform: `translate(${x}px, ${y}px) scale(${scale ? from.width / to.width : 1})` },
            { transform: 'none' },
          ],
          { duration: 320, easing: 'cubic-bezier(.22,.7,.22,1)', fill: 'both' },
        ),
      ]
    })
    await Promise.allSettled(layoutAnimations.map((animation) => animation.finished))
    if (currentRevision === layoutRevision) {
      layoutAnimations.forEach((animation) => animation.cancel())
      layoutAnimations = []
    }
  },
  { flush: 'pre' },
)

watch(
  () => props.paused,
  (paused) => {
    if (paused) cancelMovement()
  },
)
onMounted(() => {
  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.addEventListener('change', cancelMovement)
  addEventListener('resize', cancelMovement)
})
onBeforeUnmount(() => {
  cancelMovement()
  reducedMotion?.removeEventListener('change', cancelMovement)
  removeEventListener('resize', cancelMovement)
})
</script>

<template>
  <div class="pager-status" :data-collected="collected">
    <div class="signal-space">
      <div ref="signalMotion" class="signal-motion">
        <PagerSignal :state="state" :paused="paused" />
      </div>
    </div>
    <div
      ref="statusCopy"
      class="status-copy"
      role="status"
      :aria-live="paused ? 'off' : 'polite'"
      aria-atomic="true"
    >
      <p class="status-label"><i v-if="!collected" aria-hidden="true" />{{ copy.label }}</p>
      <h2 ref="heading" class="status-title" tabindex="-1">
        <AnimatedText
          :text="copy.title"
          :locale="locale"
          :by="locale === 'ar' ? arabicTextBy : 'character'"
          :paused="paused"
        />
      </h2>
      <p class="status-body">
        <AnimatedText :text="copy.body" :locale="locale" :paused="paused" variant="fade" />
      </p>
      <p v-if="!collected" class="status-detail">
        <AppIcon :name="detailIcon" />
        <span>{{ t(`ranna.states.${state}.meta`, { counter: t('ranna.counter') }) }}</span>
      </p>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.pager-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-block: 22px 32px;
  text-align: center;
}
.pager-status[data-collected='true'] {
  justify-content: flex-start;
  padding-block: 12px 8px;
}
.signal-space {
  position: relative;
  inline-size: 222px;
  block-size: 214px;
  flex: none;
}
.signal-motion {
  position: absolute;
  inset: 0;
  margin: auto;
  inline-size: 222px;
  block-size: 214px;
  transform-origin: center;
}
.signal-motion :deep(.pager-signal) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(var(--signal-size, 1));
}
.pager-status[data-collected='true'] .signal-space {
  block-size: 128px;
}
.pager-status[data-collected='true'] .signal-motion {
  --signal-size: 0.58;
  inline-size: calc(222px * var(--signal-size));
  block-size: calc(214px * var(--signal-size));
}
.status-copy {
  inline-size: 100%;
}
.status-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-block-size: 1.5em;
  margin-block: 4px 8px;
  font-size: 12px;
  line-height: 1.5;
  font-weight: 550;
  color: var(--secondary);
}
.status-label i {
  inline-size: 5px;
  block-size: 5px;
  flex: none;
  border-radius: 50%;
  background: currentColor;
}
/* Reserve room for Arabic line metrics and two lines of copy, without clipping longer text. */
.status-title {
  display: grid;
  align-items: center;
  min-block-size: 1.5em;
  font-size: 35px;
  font-weight: 650;
  line-height: 1.2;
  letter-spacing: -1.65px;
  text-wrap: balance;
  overflow-wrap: break-word;
}
.status-title:dir(rtl) {
  letter-spacing: 0;
  line-height: 1.5;
}
.status-title:focus {
  outline: none;
}
.status-body {
  display: grid;
  align-items: center;
  min-block-size: 3em;
  max-inline-size: 310px;
  margin: 8px auto 0;
  color: var(--secondary);
  font-size: 14px;
  line-height: 1.5;
  text-wrap: pretty;
}
.status-detail {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-block-size: 1.5em;
  margin-block-start: 16px;
  font-size: 12px;
  line-height: 1.5;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.status-detail .icon {
  inline-size: 15px;
  block-size: 15px;
}
.pager-status[data-collected='true'] .status-label {
  margin: 0 0 4px;
  font-weight: 400;
}
.pager-status[data-collected='true'] .status-title {
  min-block-size: 0;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -1.2px;
}
.pager-status[data-collected='true'] .status-title:dir(rtl) {
  letter-spacing: 0;
}
.pager-status[data-collected='true'] .status-body {
  min-block-size: 0;
  font-size: 13px;
}
</style>
