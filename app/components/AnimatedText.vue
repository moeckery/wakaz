<script setup lang="ts">
import {
  createTextLayer,
  measureTextLayer,
  snapshotText,
  textMotion,
  type TextGranularity,
  type TextLayer,
} from '~/utils/textMotion'

/** Changing, non-interactive copy. The parent owns heading semantics and announcements. */
const props = withDefaults(
  defineProps<{
    text: string
    paused?: boolean
    locale?: string
    by?: TextGranularity
    variant?: 'wave' | 'fade'
  }>(),
  { paused: false, by: 'character', variant: 'wave' },
)

type TextChange = {
  id: number
  phase: 'preparing' | 'wave' | 'fade'
  handoffDelayMs: number
  outgoing: TextLayer
  incoming: TextLayer
}
type CatchUp = { id: number; phase: 'catch-up'; snapshotHtml: string }

// A single state prevents a wave and catch-up fade from owning the same text at once.
const transition = shallowRef<TextChange | CatchUp>()
const textChange = computed(() =>
  transition.value?.phase !== 'catch-up' ? transition.value : undefined,
)
const catchUp = computed(() =>
  transition.value?.phase === 'catch-up' ? transition.value : undefined,
)
const layers = computed(() =>
  !textChange.value
    ? []
    : textChange.value.phase === 'fade'
      ? [textChange.value.outgoing]
      : [textChange.value.outgoing, textChange.value.incoming],
)
const root = useTemplateRef<HTMLSpanElement>('root')
const segmenter = computed(() =>
  typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(props.locale, { granularity: 'grapheme' })
    : undefined,
)
const quietIntervalMs = textMotion.enterDelayMs + textMotion.enterMs + textMotion.maxStaggerMs
const timing = {
  '--text-duration': `${textMotion.enterMs}ms`,
  '--text-exit-duration': `${textMotion.leaveMs}ms`,
  '--text-enter-delay': `${textMotion.enterDelayMs}ms`,
  '--text-handoff-duration': `${textMotion.handoffMs}ms`,
  '--text-catch-up-duration': `${textMotion.catchUpMs}ms`,
}
let mounted = false
let revision = 0
let lastChangeAt = -Infinity
let reducedMotion: MediaQueryList | undefined

function settle() {
  revision++
  transition.value = undefined
}

async function finishTransition(id: number) {
  // Follow the actual animation clock. An older completion cannot clear a newer run.
  const animations = root.value?.getAnimations({ subtree: true }) ?? []
  await Promise.allSettled(animations.map((animation) => animation.finished))
  if (id === revision) settle()
}

async function startCatchUp() {
  const snapshotHtml = snapshotText(root.value)
  settle()
  const id = revision
  transition.value = { id, phase: 'catch-up', snapshotHtml }
  await nextTick()
  if (id === revision) await finishTransition(id)
}

async function startTextChange(previous: string, text: string) {
  settle()
  const id = revision
  const outgoing = createTextLayer(previous, props.by, segmenter.value)
  const incoming = createTextLayer(text, props.by, segmenter.value)
  const canWave =
    props.variant === 'wave' &&
    Boolean(segmenter.value) &&
    outgoing.units.length > 0 &&
    incoming.units.length > 0 &&
    Math.max(outgoing.graphemeCount, incoming.graphemeCount) <= textMotion.maxAnimatedGraphemes

  transition.value = {
    id,
    phase: canWave ? 'preparing' : 'fade',
    handoffDelayMs: 0,
    outgoing,
    incoming,
  }
  await nextTick()
  if (id !== revision) return

  if (canWave) {
    const measuredOutgoing = measureTextLayer(
      outgoing,
      root.value?.querySelector<HTMLElement>('[data-layer="0"] .text-measure') ?? null,
    )
    const measuredIncoming = measureTextLayer(
      incoming,
      root.value?.querySelector<HTMLElement>('.text-static') ?? null,
    )
    const lastIndex = Math.max(0, ...(measuredIncoming?.crops ?? []).map((crop) => crop.index))
    const handoffDelayMs = Math.max(
      0,
      textMotion.enterDelayMs +
        textMotion.enterMs +
        lastIndex * incoming.staggerMs -
        textMotion.handoffMs,
    )
    transition.value = {
      id,
      phase: measuredOutgoing && measuredIncoming ? 'wave' : 'fade',
      handoffDelayMs,
      outgoing: measuredOutgoing ?? outgoing,
      incoming: measuredIncoming ?? incoming,
    }
    await nextTick()
    if (id !== revision) return
  }
  await finishTransition(id)
}

watch(
  () => [props.text, props.paused, props.locale, props.variant, props.by] as const,
  async (
    [text, paused, locale, variant, by],
    [previous, , previousLocale, previousVariant, previousBy],
  ) => {
    const configurationChanged =
      locale !== previousLocale || variant !== previousVariant || by !== previousBy
    if (
      !mounted ||
      paused ||
      reducedMotion?.matches ||
      document.hidden ||
      configurationChanged ||
      text === previous
    ) {
      settle()
      lastChangeAt = -Infinity
      return
    }

    const now = performance.now()
    const rapid = now - lastChangeAt < quietIntervalMs
    lastChangeAt = now
    // Keep the running fade and snapshot; only the incoming text tracks the newest value.
    if (catchUp.value) return
    if (textChange.value || rapid) await startCatchUp()
    else await startTextChange(previous, text)
  },
)

function onVisibilityChange() {
  if (document.hidden) settle()
}

onMounted(() => {
  mounted = true
  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.addEventListener('change', settle)
  document.addEventListener('visibilitychange', onVisibilityChange)
  addEventListener('resize', settle)
  document.fonts?.addEventListener('loadingdone', settle)
})
onBeforeUnmount(() => {
  mounted = false
  settle()
  reducedMotion?.removeEventListener('change', settle)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  removeEventListener('resize', settle)
  document.fonts?.removeEventListener('loadingdone', settle)
})
</script>

<template>
  <span
    ref="root"
    class="animated-text"
    :lang="locale"
    :data-motion="transition?.phase"
    :style="{ ...timing, '--text-handoff-delay': `${textChange?.handoffDelayMs ?? 0}ms` }"
  >
    <span class="sr-only">{{ text }}</span>
    <span class="text-static" aria-hidden="true">{{ text }}</span>
    <span
      v-if="catchUp"
      :key="catchUp.id"
      class="text-snapshot"
      aria-hidden="true"
      v-html="catchUp.snapshotHtml"
    />
    <template v-if="textChange">
      <span
        v-for="(layer, index) in layers"
        :key="`${textChange.id}-${index}`"
        class="text-layer"
        :class="[
          index ? 'text-enter' : 'text-leave',
          textChange.phase === 'fade' ? 'text-fade' : 'text-wave',
        ]"
        :data-layer="index"
        :data-ready="textChange.phase !== 'preparing'"
        :style="{ '--text-step': `${layer.staggerMs}ms` }"
        aria-hidden="true"
      >
        <template v-if="textChange.phase !== 'fade'">
          <span v-if="!index" class="text-measure">{{ layer.text }}</span>
          <span
            v-for="(crop, cropIndex) in layer.crops"
            :key="cropIndex"
            class="text-glyph"
            :style="{
              '--text-index': crop.index,
              left: `${crop.left}px`,
              top: `${crop.top}px`,
              width: `${crop.right - crop.left}px`,
              height: `${crop.bottom - crop.top}px`,
            }"
          >
            <span class="text-crop"
              ><span
                class="text-ink"
                :style="{
                  width: `${layer.width}px`,
                  left: `${-crop.left}px`,
                  top: `${-crop.top}px`,
                }"
                >{{ layer.text }}</span
              ></span
            >
          </span>
        </template>
        <template v-else>{{ layer.text }}</template>
      </span>
    </template>
  </span>
</template>

<style scoped>
.animated-text {
  --text-distance: 6px;
  --text-blur: 5px;
  position: relative;
  display: block;
  isolation: isolate;
}
.text-static,
.text-measure {
  display: block;
}
.text-layer {
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
  display: block;
  pointer-events: none;
}
.animated-text[data-motion='preparing'] > .text-static {
  opacity: 0;
}
.animated-text[data-motion='wave'] > .text-static {
  animation: text-final-in var(--text-handoff-duration) linear var(--text-handoff-delay) both;
}
.animated-text[data-motion='wave'] > .text-enter {
  animation: text-final-out var(--text-handoff-duration) linear var(--text-handoff-delay) both;
}
/* Add the two matching renderings without dimming their shared strokes mid-handoff. */
.animated-text[data-motion='wave'] > .text-static,
.animated-text[data-motion='wave'] > .text-enter {
  mix-blend-mode: plus-lighter;
}
.animated-text[data-motion='fade'] > .text-static {
  animation: text-fade-in var(--text-duration) ease both;
}
.animated-text[data-motion='catch-up'] > .text-static {
  animation: text-catch-up-in var(--text-catch-up-duration) linear both;
  mix-blend-mode: plus-lighter;
}
.text-snapshot {
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
  pointer-events: none;
  user-select: none;
  animation: text-final-out var(--text-catch-up-duration) linear both;
  mix-blend-mode: plus-lighter;
}
.text-glyph,
.text-leave,
.animated-text > .sr-only {
  user-select: none;
}
.text-wave[data-ready='true'] .text-measure {
  visibility: hidden;
}
.text-glyph {
  position: absolute;
  display: block;
  pointer-events: none;
  will-change: transform, opacity;
}
.text-crop {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.text-ink {
  position: absolute;
  display: block;
}
.text-wave.text-enter .text-glyph {
  animation: text-rise var(--text-duration) cubic-bezier(0.22, 0.7, 0.22, 1) both;
  animation-delay: calc(var(--text-enter-delay) + var(--text-index) * var(--text-step));
}
.text-wave.text-leave .text-glyph {
  animation: text-depart var(--text-exit-duration) ease-out both;
  animation-delay: calc(var(--text-index) * var(--text-step));
}
.text-fade.text-leave {
  animation: text-fade-out var(--text-exit-duration) ease both;
}
@keyframes text-rise {
  from {
    opacity: 0;
    filter: blur(var(--text-blur));
    transform: translate3d(0, var(--text-distance), 0);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: translate3d(0, 0, 0);
  }
}
@keyframes text-depart {
  from {
    opacity: 1;
    filter: blur(0);
    transform: translate3d(0, 0, 0);
  }
  to {
    opacity: 0;
    filter: blur(var(--text-blur));
    transform: translate3d(0, calc(-1 * var(--text-distance)), 0);
  }
}
@keyframes text-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes text-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes text-final-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes text-final-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes text-catch-up-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .text-static,
  .text-layer,
  .text-glyph,
  .text-snapshot {
    animation: none !important;
  }
  .animated-text[data-motion] > .text-static {
    opacity: 1;
  }
  .text-layer,
  .text-snapshot {
    display: none;
  }
}
</style>
