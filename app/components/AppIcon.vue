<script setup lang="ts">
import type { IconName } from '~/data/icons'

defineProps<{ name: IconName }>()
</script>

<template>
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <use :href="`/icons.svg#${name}`" />
  </svg>
</template>
