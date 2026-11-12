<script setup lang="ts">
definePageMeta({
  redirect: (to) =>
    to.fullPath
      .replace(/^\/lab(?=\/|\?|#|$)/, '/ranna')
      .replace(/^\/ranna\/about\/?(?=\?|#|$)/, '/ranna/settings/about'),
})
</script>

<template>
  <div />
</template>
