<script setup lang="ts">
import { FocusScope } from 'reka-ui'

const { dark } = useDemoPreferences()
const route = useRoute()
const framed = ref(route.query.preview !== 'off')
const inspecting = ref(false)
const scale = ref(1)
const restoreButton = useTemplateRef<HTMLButtonElement>('restoreButton')
let inspectorTrigger: HTMLElement | null = null
const frameStyle = computed(() =>
  framed.value
    ? {
        width: `${440 * scale.value}px`,
        height: `${956 * scale.value}px`,
      }
    : {},
)

function fit() {
  const availableWidth = innerWidth <= 900 ? innerWidth - 40 : innerWidth - 320 - 64 - 48
  scale.value = Math.max(0.2, Math.min(1, (innerHeight - 80) / 956, availableWidth / 440))
}

async function showFullscreen() {
  inspectorTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
  framed.value = false
  inspecting.value = false
  await nextTick()
  restoreButton.value?.focus()
}

async function showInspector() {
  framed.value = true
  inspecting.value = true
  await nextTick()
  if (inspectorTrigger?.isConnected) inspectorTrigger.focus()
}

function leaveInspector(event: FocusEvent) {
  if (
    event.relatedTarget instanceof Node &&
    !(event.currentTarget as HTMLElement).contains(event.relatedTarget)
  ) {
    inspecting.value = false
  }
}

onMounted(() => {
  fit()
  addEventListener('resize', fit)
})
onBeforeUnmount(() => removeEventListener('resize', fit))
</script>

<template>
  <div class="workbench" :class="{ unframed: !framed }" dir="ltr" lang="en">
    <FocusScope
      as-child
      :present="framed && inspecting"
      @mount-auto-focus.prevent
      @unmount-auto-focus.prevent
    >
      <DemoInspector
        v-show="framed"
        @pointerenter="inspecting = true"
        @focusin="inspecting = true"
        @focusout="leaveInspector"
        @fullscreen="showFullscreen"
      />
    </FocusScope>
    <div
      class="device-stage"
      :style="frameStyle"
      @pointerdown.capture="inspecting = false"
      @focusin="inspecting = false"
    >
      <div
        class="device"
        :class="{ dark }"
        :style="{ transform: framed ? `scale(${scale})` : undefined }"
      >
        <div v-show="framed" class="status-bar" aria-hidden="true">
          <b>9:41</b>
          <span class="island" />
          <span class="status-icons">▮▮▮ <span class="battery" /></span>
        </div>
        <slot />
        <div v-show="framed" class="home-indicator" aria-hidden="true" />
      </div>
    </div>
    <button v-if="!framed" ref="restoreButton" class="restore-inspector" @click="showInspector"
      >Show inspector</button
    >
  </div>
</template>

<style scoped>
.workbench {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 64px;
  padding: 32px 24px;
  background: #181818;
  color: #fafafa;
}
.device-stage {
  position: relative;
  flex-shrink: 0;
}
.workbench:not(.unframed) .device {
  --app-safe-top: 0px;
  --app-safe-right: 0px;
  --app-safe-bottom: 0px;
  --app-safe-left: 0px;
}
.device {
  position: absolute;
  inset: 0 auto auto 0;
  width: 440px;
  height: 956px;
  padding: 68px 0 34px;
  transform-origin: top left;
  background: #fff;
  color: #171717;
  border-radius: 57px;
  overflow: hidden;
  box-shadow:
    0 0 0 6px #050505,
    0 0 0 8px #555,
    0 24px 70px #0004;
}
.device.dark {
  background: #161616;
  color: #f7f7f7;
}
.status-bar {
  height: 68px;
  position: absolute;
  top: 0;
  inset-inline: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 34px 2px 40px;
  direction: ltr;
}
.status-bar b {
  font-size: 16px;
  font-weight: 600;
}
.island {
  position: absolute;
  top: 12px;
  left: 157px;
  width: 126px;
  height: 36px;
  border-radius: 24px;
  background: #050505;
}
.status-icons {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}
.battery {
  width: 24px;
  height: 12px;
  border: 1px solid currentColor;
  border-radius: 3px;
  padding: 2px;
  display: block;
  position: relative;
}
.battery::before {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  background: currentColor;
  border-radius: 1px;
}
.battery::after {
  content: '';
  position: absolute;
  width: 2px;
  height: 5px;
  background: currentColor;
  right: -4px;
  top: 2px;
  border-radius: 2px;
}
.home-indicator {
  position: absolute;
  z-index: 100;
  bottom: 9px;
  left: 150px;
  width: 140px;
  height: 5px;
  border-radius: 5px;
  background: currentColor;
  pointer-events: none;
}
@media (max-width: 900px) {
  .workbench {
    flex-direction: column;
    justify-content: flex-start;
    gap: 40px;
    padding: 32px 20px;
    overflow-y: auto;
  }
  .device-stage {
    order: -1;
  }
}
.workbench.unframed {
  display: block;
  padding: 0;
  overflow: hidden;
}
.unframed .device-stage {
  width: 100%;
  height: 100%;
}
.unframed .device {
  width: 100%;
  height: 100%;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
}
.restore-inspector {
  position: fixed;
  z-index: 200;
  inset-block-end: max(12px, env(safe-area-inset-bottom));
  inset-inline-end: max(12px, env(safe-area-inset-right));
  min-height: 36px;
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 10px;
  background: #232323;
  color: #fafafa;
  font-size: 11px;
  box-shadow: 0 2px 8px #0002;
}
</style>
