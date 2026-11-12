<script setup lang="ts">
import type { SheetSnap } from '~/types/sheet'

const open = ref(false)
const itemCount = ref(12)
const snaps = ref<SheetSnap[]>(['partial', 'full'])
const initial = ref<SheetSnap>('partial')
const handle = ref(true)

function setSnaps(value: SheetSnap[]) {
  snaps.value = value
  if (!value.includes(initial.value)) initial.value = value[0]!
}

const description = computed(() => {
  if (!handle.value)
    return snaps.value.length === 1
      ? 'Scroll through the content. Use the close button when you’re done.'
      : 'Scroll the content and use the available buttons to change height or close.'
  if (snaps.value.length === 1) {
    return `This sheet stays at ${snaps.value[0]} height. Scroll inside, or pull the top handle down to close.`
  }
  return 'Scroll here at any height. Pull the handle up to expand, or drag it down to close.'
})
</script>

<template>
  <div class="sheet-demo" lang="en" dir="ltr">
    <header class="demo-header">
      <AppButton to="/ranna" variant="icon" icon="arrow-left" aria-label="Back to Ranna" />
      <h1>Sheet demo</h1>
    </header>
    <div class="demo-main">
      <div class="demo-intro">
        <p class="eyebrow">MAKE IT YOURS</p>
        <h2>A little more room.</h2>
        <p class="body-copy"
          >Choose the heights, opening position, and handle. Then try your sheet.</p
        >
        <div class="demo-options">
          <fieldset class="option-group">
            <legend>Content</legend>
            <div class="option-buttons">
              <AppButton :aria-pressed="itemCount === 1" @click="itemCount = 1"
                >Short content</AppButton
              >
              <AppButton :aria-pressed="itemCount === 12" @click="itemCount = 12"
                >Long content</AppButton
              >
            </div>
          </fieldset>
          <fieldset class="option-group">
            <legend>Allowed heights</legend>
            <div class="option-buttons">
              <AppButton :aria-pressed="snaps.length === 2" @click="setSnaps(['partial', 'full'])"
                >Both</AppButton
              >
              <AppButton
                :aria-pressed="snaps.length === 1 && snaps[0] === 'partial'"
                @click="setSnaps(['partial'])"
                >Partial only</AppButton
              >
              <AppButton
                :aria-pressed="snaps.length === 1 && snaps[0] === 'full'"
                @click="setSnaps(['full'])"
                >Full only</AppButton
              >
            </div>
          </fieldset>
          <fieldset class="option-group">
            <legend>Opening height</legend>
            <div class="option-buttons">
              <AppButton
                :aria-pressed="initial === 'partial'"
                :disabled="!snaps.includes('partial')"
                @click="initial = 'partial'"
                >Partial</AppButton
              >
              <AppButton
                :aria-pressed="initial === 'full'"
                :disabled="!snaps.includes('full')"
                @click="initial = 'full'"
                >Full</AppButton
              >
            </div>
          </fieldset>
          <fieldset class="option-group">
            <legend>Drag handle</legend>
            <div class="option-buttons">
              <AppButton :aria-pressed="handle" @click="handle = true">Shown</AppButton>
              <AppButton :aria-pressed="!handle" @click="handle = false">Hidden</AppButton>
            </div>
          </fieldset>
        </div>
        <AppButton
          class="open-sheet"
          aria-haspopup="dialog"
          :aria-expanded="open"
          @click="open = true"
          >Open sheet</AppButton
        >
        <p class="demo-note"
          >Partial fits the content up to 70% of the screen. Longer content scrolls inside.</p
        >
      </div>
    </div>

    <AppSheet
      v-model:open="open"
      title="Make some space."
      :snaps="snaps"
      :initial="initial"
      :handle="handle"
      :description="description"
      close-label="Close sheet"
    >
      <template #status="{ expanded, partialPercent }">
        <p class="sheet-status" aria-live="polite">{{
          expanded ? 'Full height · 100%' : `Partial · ${partialPercent}%`
        }}</p>
      </template>
      <template #default="{ expanded, expand, collapse, canExpand, canCollapse }">
        <div class="snap-actions" aria-label="Sheet height">
          <AppButton :aria-pressed="!expanded" :disabled="!canCollapse" @click="collapse"
            >Partial height</AppButton
          >
          <AppButton :aria-pressed="expanded" :disabled="!canExpand" @click="expand"
            >Full height</AppButton
          >
        </div>
        <p class="eyebrow scroll-label">SCROLL TEST</p>
        <ol class="sample-list">
          <li v-for="index in itemCount" :key="index">
            <span class="sample-number">{{ String(index).padStart(2, '0') }}</span>
            <div>
              <strong>Room to explore</strong>
              <p>{{
                handle
                  ? 'Scroll through the content. Pull the top handle down to close.'
                  : 'Scroll through the content. The sheet stays in place while you read.'
              }}</p>
            </div>
          </li>
        </ol>
        <p class="end-note">You reached the end.</p>
      </template>
    </AppSheet>
  </div>
</template>

<style scoped>
.sheet-demo {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}
.demo-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 28px;
  flex: none;
}
.demo-header h1 {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.7px;
}
.demo-main {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  touch-action: pan-y pinch-zoom;
}
.demo-intro {
  padding: 28px;
  max-width: 520px;
  margin-inline: auto;
}
.demo-intro h2 {
  font-size: 36px;
  line-height: 1.1;
  letter-spacing: -1.5px;
  margin: 12px 0 16px;
}
.open-sheet {
  margin-top: 28px;
}
.demo-note {
  margin-top: 18px;
  color: var(--secondary);
  font-size: 12px;
  line-height: 1.6;
}
.sheet-status {
  font-size: 11px;
  font-weight: 500;
  color: var(--secondary);
  margin-bottom: 8px;
  font-variant-numeric: tabular-nums;
}
.demo-options {
  display: grid;
  gap: 22px;
  margin-top: 28px;
}
.option-group {
  padding: 0;
  margin: 0;
  border: 0;
  min-width: 0;
}
.option-group legend {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 9px;
  padding: 0;
}
.option-buttons {
  display: flex;
  gap: 8px;
}
.snap-actions {
  display: flex;
  gap: 8px;
  margin: 22px 0 30px;
}
.snap-actions .primary,
.option-buttons .primary {
  min-height: 42px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 12px;
}
.snap-actions .primary[aria-pressed='false'],
.option-buttons .primary[aria-pressed='false'] {
  background: var(--surface);
  color: var(--ink);
}
.scroll-label {
  margin-bottom: 6px;
}
.sample-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.sample-list li {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 22px 0;
  border-bottom: 1px solid var(--line);
}
.sample-number {
  color: var(--secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  padding-top: 2px;
}
.sample-list strong {
  font-size: 14px;
  font-weight: 550;
}
.sample-list p {
  font-size: 12px;
  line-height: 1.6;
  color: var(--secondary);
  margin-top: 6px;
}
.end-note {
  color: var(--secondary);
  text-align: center;
  font-size: 12px;
  padding: 28px 0 8px;
}
</style>
