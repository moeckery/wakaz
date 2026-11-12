<script setup lang="ts">
const { localeProperties } = useI18n()
useHead(() => ({
  htmlAttrs: { lang: localeProperties.value.language, dir: localeProperties.value.dir },
}))
</script>

<template>
  <DemoPreview>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </DemoPreview>
</template>
