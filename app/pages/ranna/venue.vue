<script setup lang="ts">
const { selectedId } = useVenue()
const route = useRoute()
await navigateTo(
  { name: 'ranna-pager-id-venue', params: { id: selectedId.value }, query: route.query },
  { replace: true },
)
</script>

<template><div /></template>
