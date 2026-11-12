<script setup lang="ts">
const { venue, identity, style } = useVenue()
</script>

<template>
  <NuxtLink
    :to="{ name: 'ranna-pager-id-venue', params: { id: venue.id } }"
    class="venue-ribbon"
    :style="style"
  >
    <span class="venue-panel">
      <VenueMark :venue="venue" />
      <span class="venue-copy">
        <strong>{{ identity.name }}</strong>
        <span>{{ identity.branch }}</span>
      </span>
      <AppIcon name="chevron-right" class="venue-chevron" />
    </span>
  </NuxtLink>
</template>

<style scoped>
.venue-ribbon {
  display: flex;
  flex: none;
  min-block-size: 64px;
  padding: 3px;
  border: 1px solid color-mix(in srgb, var(--venue-color) 24%, transparent);
  border-radius: 16px;
  background: color-mix(in srgb, var(--venue-color) 18%, transparent);
}
.venue-panel {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-inline-size: 0;
  padding: 5px 11px;
  border: 1px solid var(--venue-border);
  border-radius: 12px;
  background: var(--venue-color);
  color: var(--venue-ink);
  box-shadow: 0 1px 2px #00000014;
}
.venue-ribbon:active {
  opacity: 0.88;
}
.venue-ribbon:focus-visible {
  outline-color: var(--ink);
}
.dark .venue-panel {
  box-shadow: 0 1px 2px #0003;
}
.venue-copy {
  flex: 1;
  min-inline-size: 0;
  text-align: start;
}
.venue-copy strong {
  display: block;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.venue-copy > span {
  display: block;
  margin-block-start: 2px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--venue-secondary);
}
.venue-chevron {
  inline-size: 17px;
  block-size: 17px;
}
.venue-chevron:dir(rtl) {
  transform: scaleX(-1);
}
</style>
