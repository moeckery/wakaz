<script setup lang="ts">
withDefaults(defineProps<{ paused?: boolean }>(), { paused: false })

// A departing control stays visible briefly, but must stop accepting input immediately.
function deactivate(element: Element) {
  element.setAttribute('inert', '')
}
function activate(element: Element) {
  element.removeAttribute('inert')
}
</script>

<template>
  <div class="app-fade" :data-paused="paused">
    <Transition
      name="app-fade"
      :css="!paused"
      @before-leave="deactivate"
      @before-enter="activate"
      @leave-cancelled="activate"
    >
      <slot />
    </Transition>
  </div>
</template>

<style scoped>
.app-fade {
  position: relative;
  display: grid;
  inline-size: 100%;
}
.app-fade > :deep(*) {
  grid-area: 1 / 1;
  min-inline-size: 0;
}
.app-fade > :deep(.app-fade-enter-active) {
  transition: opacity 200ms ease-out;
}
.app-fade > :deep(.app-fade-leave-active) {
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
  transition: opacity 140ms ease-out;
  pointer-events: none;
}
.app-fade > :deep(.app-fade-enter-from),
.app-fade > :deep(.app-fade-leave-to) {
  opacity: 0;
}
.app-fade[data-paused='true'] > :deep(.app-fade-enter-active),
.app-fade[data-paused='true'] > :deep(.app-fade-leave-active) {
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .app-fade > :deep(.app-fade-enter-active),
  .app-fade > :deep(.app-fade-leave-active) {
    transition: none;
  }
}
</style>
