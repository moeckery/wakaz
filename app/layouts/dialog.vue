<script setup lang="ts">
import type { RouteLocationRaw, RouteRecordName } from 'vue-router'

const props = defineProps<{ title: string; page: RouteRecordName; parent: RouteLocationRaw }>()
const { t } = useI18n()
const { panel, heading, covered, transition, close, onKeydown } = useLayer(props, {
  trapFocus: true,
})
</script>

<template>
  <div class="layer" data-kind="dialog" @keydown="onKeydown">
    <div class="backdrop" aria-hidden="true" @click="close" />
    <section
      ref="panel"
      class="panel"
      role="dialog"
      :aria-modal="!covered"
      :aria-label="title"
      :inert="covered"
    >
      <header class="panel-header">
        <h1 ref="heading" tabindex="-1">{{ title }}</h1>
        <AppButton variant="icon" icon="x" :aria-label="t('common.close')" @click="close" />
      </header>
      <div class="panel-body"><slot /></div>
    </section>
    <slot name="children" :transition="transition" />
  </div>
</template>
