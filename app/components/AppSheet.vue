<script setup lang="ts">
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  Presence,
} from 'reka-ui'
import type { SheetOptions, SheetSnap } from '~/types/sheet'

const props = withDefaults(
  defineProps<
    SheetOptions & {
      title: string
      description?: string
      closeLabel?: string
      modal?: boolean | 'trap-focus'
      covered?: boolean
    }
  >(),
  {
    closeLabel: 'Close',
    modal: true,
    covered: false,
    snaps: () => ['partial', 'full'],
    handle: true,
  },
)

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ 'after-close': [] }>()
const viewport = useTemplateRef<HTMLElement>('viewport')
const header = useTemplateRef<HTMLElement>('header')
const sheetContent = useTemplateRef<HTMLElement>('sheetContent')
const descriptionId = useId()
const partialHeightRatio = 0.7
const viewportHeight = ref(0)
const partialHeight = ref(0)
const allowedSnaps = computed<SheetSnap[]>(() => {
  const snaps = [...new Set(props.snaps)].filter((snap) => snap === 'partial' || snap === 'full')
  return snaps.length ? snaps : ['partial']
})
const initialSnap = computed(() =>
  props.initial && allowedSnaps.value.includes(props.initial)
    ? props.initial
    : allowedSnaps.value[0]!,
)
const currentSnap = ref<SheetSnap>(initialSnap.value)
const heightBySnap = computed(() => ({ partial: partialHeight.value, full: viewportHeight.value }))
const snapPoints = computed(() => allowedSnaps.value.map((snap) => heightBySnap.value[snap]))
// Keep the selected height semantic so measurement and resizing cannot change it.
const activeSnapPoint = computed<number | string | null>({
  get: () => heightBySnap.value[currentSnap.value],
  set: (value) => {
    const snap = allowedSnaps.value.find((snap) => heightBySnap.value[snap] === value)
    if (snap) currentSnap.value = snap
  },
})
const expanded = computed(() => currentSnap.value === 'full')
const canExpand = computed(() => allowedSnaps.value.includes('full'))
const canCollapse = computed(() => allowedSnaps.value.includes('partial'))
// A partial-only sheet must not overshoot into an unavailable full-height position.
const minimumOffset = computed(() =>
  canExpand.value ? 0 : Math.max(0, viewportHeight.value - partialHeight.value),
)
const partialPercent = computed(() =>
  viewportHeight.value ? Math.round((partialHeight.value / viewportHeight.value) * 100) : 0,
)
let opener: HTMLElement | null = null
let hasRenderedContent = false
const closeWaiters = new Set<() => void>()

// Natural content is measured independently of the scrolling viewport.
watch(
  [viewport, header, sheetContent],
  ([viewportElement, headerElement, contentElement], _, onCleanup) => {
    if (!viewportElement) return
    const measure = () => {
      viewportHeight.value = viewportElement.clientHeight
      const limit = Math.floor(viewportHeight.value * partialHeightRatio)
      partialHeight.value =
        headerElement && contentElement
          ? Math.min(headerElement.offsetHeight + contentElement.offsetHeight, limit)
          : limit
    }
    measure()
    const observer = new ResizeObserver(measure)
    for (const element of [viewportElement, headerElement, contentElement]) {
      if (element) observer.observe(element)
    }
    onCleanup(() => observer.disconnect())
  },
  { flush: 'post' },
)

watch(
  allowedSnaps,
  (snaps) => {
    if (!snaps.includes(currentSnap.value)) currentSnap.value = initialSnap.value
  },
  { flush: 'sync' },
)

watch(
  open,
  (isOpen) => {
    if (!isOpen) return
    resolvePendingCloses()
    currentSnap.value = initialSnap.value
    if (import.meta.client && !sheetContent.value) {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    }
  },
  { flush: 'sync', immediate: true },
)

function resolvePendingCloses() {
  for (const resolve of closeWaiters) resolve()
  closeWaiters.clear()
}

// Presence removes this native ref after its exit motion, including reduced motion.
watch(
  [open, sheetContent],
  ([isOpen, contentElement]) => {
    if (contentElement) hasRenderedContent = true
    if (isOpen || contentElement) return
    resolvePendingCloses()
    if (hasRenderedContent) {
      hasRenderedContent = false
      emit('after-close')
    }
  },
  { flush: 'post' },
)
onBeforeUnmount(resolvePendingCloses)

async function close() {
  const finished = new Promise<void>((resolve) => closeWaiters.add(resolve))
  open.value = false
  await nextTick()
  if (!sheetContent.value) resolvePendingCloses()
  return finished
}

function restoreFocus(event: Event) {
  event.preventDefault()
  if (!props.covered && opener?.isConnected && !opener.closest('[inert]')) {
    opener.focus({ preventScroll: true })
  }
}

function preventExternalDismiss(event: Event) {
  // Only interactions inside this app viewport may dismiss its sheet.
  if (props.covered || !(event.target instanceof Node) || !viewport.value?.contains(event.target)) {
    event.preventDefault()
  }
}

function expand() {
  if (canExpand.value) currentSnap.value = 'full'
}
function collapse() {
  if (canCollapse.value) currentSnap.value = 'partial'
}
const slotControls = computed(() => ({
  close,
  expand,
  collapse,
  expanded: expanded.value,
  partialPercent: partialPercent.value,
  canExpand: canExpand.value,
  canCollapse: canCollapse.value,
}))
defineExpose({ close })
</script>

<template>
  <div ref="viewport" class="app-sheet-layer">
    <DrawerRoot
      v-model:open="open"
      v-model:snap-point="activeSnapPoint"
      :snap-points="snapPoints"
      :modal="modal"
    >
      <DrawerPortal disabled>
        <!-- The app viewport owns scrolling; a backdrop must not lock the whole document. -->
        <Presence v-if="modal !== false" :present="open">
          <div class="sheet-overlay" :data-state="open ? 'open' : 'closed'" aria-hidden="true" />
        </Presence>
        <DrawerContent
          class="app-sheet"
          :data-snap="expanded ? 'full' : 'partial'"
          :data-handle="handle"
          :data-reka-swipe-ignore="handle ? undefined : ''"
          :style="{ '--sheet-min-offset': `${minimumOffset}px` }"
          :aria-describedby="description ? descriptionId : undefined"
          :aria-modal="!covered && modal !== false"
          :inert="covered"
          :initial-focus="!covered"
          :final-focus="false"
          @close-auto-focus="restoreFocus"
          @escape-key-down="preventExternalDismiss"
          @interact-outside="preventExternalDismiss"
        >
          <div class="sheet-frame">
            <div ref="header" class="sheet-chrome">
              <div v-if="handle" class="grab-region" data-testid="sheet-drag-handle">
                <DrawerHandle class="sheet-handle" />
              </div>
              <header class="sheet-header" data-reka-swipe-ignore>
                <div class="sheet-heading">
                  <slot name="status" v-bind="slotControls" />
                  <DrawerTitle class="sheet-title">{{ title }}</DrawerTitle>
                </div>
                <DrawerClose as-child>
                  <AppButton variant="icon" icon="x" :aria-label="closeLabel" />
                </DrawerClose>
              </header>
            </div>
            <div class="sheet-scroll" data-testid="sheet-scroll" data-reka-swipe-ignore>
              <div ref="sheetContent" class="sheet-content">
                <DrawerDescription
                  v-if="description"
                  :id="descriptionId"
                  class="sheet-description"
                  >{{ description }}</DrawerDescription
                >
                <slot v-bind="slotControls" />
              </div>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </DrawerRoot>
  </div>
</template>

<style scoped>
.app-sheet-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}
.sheet-overlay {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 0.36);
  pointer-events: auto;
}
.sheet-overlay[data-state='open'] {
  animation: overlay-in 280ms ease;
}
.sheet-overlay[data-state='closed'] {
  animation: overlay-out 280ms ease;
}
.app-sheet {
  --sheet-offset: max(
    var(--sheet-min-offset, 0px),
    calc(var(--drawer-snap-point-offset, 0px) + var(--drawer-swipe-movement-y, 0px))
  );
  position: absolute;
  inset: auto 0 0;
  height: 100%;
  max-height: 100%;
  background: var(--bg);
  color: var(--ink);
  border-radius: 28px 28px 0 0;
  outline: none;
  box-shadow: 0 -12px 40px #0001;
  pointer-events: auto;
  transform: translateY(var(--sheet-offset));
  transition: transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-frame {
  display: flex;
  flex-direction: column;
  height: clamp(0px, calc(100% - var(--sheet-offset)), 100%);
  overflow: hidden;
  transition: height 320ms cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-chrome {
  flex: none;
}
.app-sheet[data-state='open'] {
  animation: sheet-in 320ms cubic-bezier(0.32, 0.72, 0, 1);
}
.app-sheet[data-state='closed'] {
  animation: sheet-out 280ms cubic-bezier(0.32, 0.72, 0, 1);
}
.app-sheet[data-swiping],
.app-sheet[data-swiping] .sheet-frame {
  transition-duration: 0ms;
  user-select: none;
}
.grab-region {
  height: 32px;
  display: grid;
  place-items: center;
  flex: none;
  touch-action: none;
  cursor: grab;
}
.sheet-handle {
  width: 36px;
  height: 4px;
  margin: 0;
  border-radius: 4px;
  background: var(--secondary);
  opacity: 0.45;
}
.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 28px 22px;
  flex: none;
}
.app-sheet[data-handle='false'] .sheet-header {
  padding-top: 24px;
}
.sheet-heading {
  min-width: 0;
}
.sheet-title {
  font-size: 27px;
  font-weight: 600;
  letter-spacing: -0.8px;
  overflow-wrap: anywhere;
}
.sheet-title:dir(rtl) {
  letter-spacing: 0;
}
.sheet-scroll {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-x: none;
  overscroll-behavior-y: contain;
  touch-action: pan-y pinch-zoom;
  scrollbar-width: none;
}
.sheet-content {
  display: flow-root;
  padding: 0 28px 28px;
}
.sheet-description {
  color: var(--secondary);
  font-size: 14px;
  line-height: 1.6;
}
@keyframes sheet-in {
  from {
    translate: 0 100%;
  }
}
@keyframes sheet-out {
  to {
    translate: 0 100%;
  }
}
@keyframes overlay-in {
  from {
    opacity: 0;
  }
}
@keyframes overlay-out {
  to {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .app-sheet,
  .sheet-overlay,
  .sheet-frame {
    animation: none !important;
    transition: none !important;
  }
}
</style>
