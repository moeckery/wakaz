<script setup lang="ts">
const { t } = useI18n()
const { close } = useLayerNavigation()
</script>

<template>
  <div class="route-page">
    <NuxtLayout
      name="dialog"
      page="ranna-pager-id-settings-about"
      :title="t('ranna.about')"
      :parent="{ name: 'ranna-pager-id-settings' }"
    >
      <AboutRanna @done="close({ name: 'ranna-pager-id-settings' })" />
    </NuxtLayout>
  </div>
</template>
