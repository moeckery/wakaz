<script setup lang="ts">
const { color } = useVenue()
const glow = useTemplateRef<HTMLDivElement>('glow')
let observer: ResizeObserver | undefined
let scroller: HTMLElement | null = null
let alignGlow: (() => void) | undefined

onMounted(() => {
  const backdrop = glow.value
  const panel = backdrop?.parentElement
  const ribbon = panel?.querySelector<HTMLElement>('.venue-ribbon')
  scroller = ribbon?.closest<HTMLElement>('.panel-body') ?? null
  if (!backdrop || !panel || !ribbon || !scroller) return

  let previousCenter: number | undefined
  alignGlow = () => {
    const panelBounds = panel.getBoundingClientRect()
    if (!panelBounds.height) return
    const ribbonBounds = ribbon.getBoundingClientRect()
    // The preview scales screen coordinates; the glow uses local CSS pixels.
    const center =
      ((ribbonBounds.top + ribbonBounds.height / 2 - panelBounds.top) * panel.clientHeight) /
      panelBounds.height
    if (center === previousCenter) return
    previousCenter = center
    backdrop.style.setProperty('--glow-y', `${center}px`)
  }

  observer = new ResizeObserver(alignGlow)
  for (const element of [panel, scroller, ribbon]) observer.observe(element)
  scroller.addEventListener('scroll', alignGlow, { passive: true })
  alignGlow()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (alignGlow) scroller?.removeEventListener('scroll', alignGlow)
})
</script>

<template>
  <div ref="glow" class="venue-glow" :style="{ '--venue-color': color }" aria-hidden="true" />
</template>

<style scoped>
.venue-glow {
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
  block-size: 36%;
  z-index: -1;
  pointer-events: none;
  opacity: 0.28;
  mask-image: linear-gradient(to bottom, transparent, #000 48px);
  background: radial-gradient(
    ellipse 85% 50% at 50% var(--glow-y, 0px),
    var(--venue-color) 0%,
    color-mix(in srgb, var(--venue-color) 68%, transparent) 38%,
    color-mix(in srgb, var(--venue-color) 24%, transparent) 70%,
    transparent 100%
  );
}
.dark .venue-glow {
  opacity: 0.44;
}
</style>
