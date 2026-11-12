<script setup lang="ts">
const { t } = useI18n()
const { close } = useLayerNavigation()
</script>

<template>
  <div class="route-page">
    <NuxtLayout
      name="sheet"
      page="ranna-settings-appearance"
      :title="t('common.appearance')"
      :parent="{ name: 'ranna-settings' }"
    >
      <AppearancePreferences @done="close({ name: 'ranna-settings' })" />
    </NuxtLayout>
  </div>
</template>
