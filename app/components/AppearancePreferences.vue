<script setup lang="ts">
import RadioButton from 'primevue/radiobutton'

defineEmits<{ done: [] }>()
const { dark } = useDemoPreferences()
const { t } = useI18n()
const inputId = useId()
</script>

<template>
  <div class="appearance-page">
    <p class="body-copy">{{ t('ranna.appearanceBody') }}</p>
    <fieldset class="choice-list">
      <legend class="sr-only">{{ t('common.appearance') }}</legend>
      <label class="choice" :class="{ selected: !dark }">
        <AppIcon name="sun" /><span>{{ t('common.light') }}</span>
        <RadioButton v-model="dark" :input-id="`${inputId}-light`" :name="inputId" :value="false" />
      </label>
      <label class="choice" :class="{ selected: dark }">
        <AppIcon name="moon" /><span>{{ t('common.dark') }}</span>
        <RadioButton v-model="dark" :input-id="`${inputId}-dark`" :name="inputId" :value="true" />
      </label>
    </fieldset>
    <AppButton @click="$emit('done')">{{ t('common.done') }}</AppButton>
  </div>
</template>

<style scoped>
.choice-list {
  margin: 20px 0 26px;
  padding: 0;
  border: 0;
}
.choice {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--line);
  padding: 20px 2px;
  cursor: pointer;
}
.choice > span {
  flex: 1;
  font-size: 16px;
}
.choice > .icon {
  width: 22px;
  height: 22px;
}
</style>
