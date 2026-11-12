<script setup lang="ts">
const { t } = useI18n()
useHead(() => ({ title: t('ranna.title') }))
</script>

<template>
  <div class="route-page">
    <NuxtLayout name="screen" page="ranna" title="ranna">
      <template #brand><AppIcon name="bell-ring" class="home-brand" /></template>
      <template #actions>
        <AppButton
          :to="{ name: 'ranna-settings' }"
          variant="icon"
          icon="settings-2"
          :aria-label="t('common.settings')"
        />
      </template>
      <template #default="{ covered }"><PagerHome :paused="covered" /></template>
      <template #children="{ transition }"><NuxtPage :transition="transition" /></template>
    </NuxtLayout>
  </div>
</template>

<style scoped>
.home-brand {
  inline-size: 24px;
  block-size: 24px;
}
</style>
