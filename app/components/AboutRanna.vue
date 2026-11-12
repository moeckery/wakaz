<script setup lang="ts">
defineEmits<{ done: [] }>()
const { t } = useI18n()
</script>

<template>
  <div class="about-page">
    <p class="dialog-copy">{{ t('ranna.aboutBody') }}</p>
    <p class="muted">{{ t('ranna.aboutNote') }}</p>
    <p class="icon-credits" lang="en" dir="ltr">
      Solar icons by
      <a href="https://github.com/480-Design/Solar-Icon-Set" target="_blank" rel="noreferrer"
        >480 Design</a
      >
      ·
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer"
        >CC BY 4.0</a
      >. Colors adapted.<br />
      UI icons by <a href="https://hugeicons.com/" target="_blank" rel="noreferrer">Hugeicons</a> ·
      <a href="/HUGEICONS-LICENSE.txt" target="_blank" rel="noreferrer">MIT</a>.
    </p>
    <AppButton @click="$emit('done')">{{ t('common.gotIt') }}</AppButton>
  </div>
</template>

<style scoped>
.dialog-copy {
  line-height: 1.65;
  font-size: 14px;
  color: var(--secondary);
}
.about-page > .primary {
  margin-top: 24px;
}
.about-page > .muted {
  margin-top: 14px;
}
.icon-credits {
  margin-block: 16px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--secondary);
}
.icon-credits a {
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
