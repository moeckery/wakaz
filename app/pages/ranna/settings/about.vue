<script setup lang="ts">
const { t } = useI18n()
const { close } = useLayerNavigation()
</script>

<template>
  <div class="route-page">
    <NuxtLayout
      name="dialog"
      page="ranna-settings-about"
      :title="t('ranna.about')"
      :parent="{ name: 'ranna-settings' }"
    >
      <AboutRanna @done="close({ name: 'ranna-settings' })" />
    </NuxtLayout>
  </div>
</template>
