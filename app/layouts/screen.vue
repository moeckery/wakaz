<script setup lang="ts">
import type { RouteLocationRaw, RouteRecordName } from 'vue-router'

const props = defineProps<{ title: string; page: RouteRecordName; parent?: RouteLocationRaw }>()
const { t } = useI18n()
const { panel, heading, covered, transition, close, onKeydown } = useLayer(props)
</script>

<template>
  <div class="layer" :data-kind="parent ? 'screen' : 'base'" @keydown="onKeydown">
    <section ref="panel" class="panel" :aria-label="title" :inert="covered">
      <slot name="background" />
      <header class="panel-header">
        <AppButton
          v-if="parent"
          variant="icon"
          icon="arrow-left"
          class="back-button"
          :aria-label="t('common.back')"
          @click="close"
        />
        <slot v-else name="brand"
          ><span class="brand-mark" aria-hidden="true"><i /><i /></span
        ></slot>
        <h1 ref="heading" tabindex="-1" :class="{ brand: !parent }">{{ title }}</h1>
        <slot name="actions" />
      </header>
      <div class="panel-body"><slot :covered="covered" /></div>
    </section>
    <slot name="children" :transition="transition" />
  </div>
</template>

<style scoped>
.panel {
  isolation: isolate;
}
</style>
