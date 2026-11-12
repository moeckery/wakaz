<script setup lang="ts">
const { t } = useI18n()
const { close } = useLayerNavigation()
</script>

<template>
  <div class="route-page">
    <NuxtLayout
      name="sheet"
      page="ranna-pager-id-settings-appearance"
      :title="t('common.appearance')"
      :parent="{ name: 'ranna-pager-id-settings' }"
    >
      <AppearancePreferences @done="close({ name: 'ranna-pager-id-settings' })" />
    </NuxtLayout>
  </div>
</template>
