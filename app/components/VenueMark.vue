<script setup lang="ts">
import type { Venue } from '~/types/venue'

// The surrounding venue surface supplies the shared contrast tokens.
defineProps<{ venue: Venue }>()
</script>

<template>
  <span class="venue-mark" aria-hidden="true">
    <img v-if="venue.logo" :src="venue.logo" alt="" />
    <span v-else>{{ venue.monogram }}</span>
  </span>
</template>

<style scoped>
.venue-mark {
  display: grid;
  place-items: center;
  inline-size: 44px;
  block-size: 44px;
  flex: none;
  padding: 7px;
  border: 1px solid var(--venue-mark-line);
  border-radius: 50%;
  background: var(--venue-color);
  color: var(--venue-ink);
}
.venue-mark > span {
  font-family: Georgia, serif;
  font-style: italic;
  font-size: 32px;
  line-height: 0.8;
  padding-inline-end: 3px;
}
.venue-mark img {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: contain;
}
</style>
