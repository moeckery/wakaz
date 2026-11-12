<script setup lang="ts">
import type { PagerState } from '~/types/pager'

defineProps<{
  state: Exclude<PagerState, 'collected'>
  nudged: boolean
  paused?: boolean
}>()
defineEmits<{ start: []; nudge: []; collect: [] }>()
const { t } = useI18n()
const nudgeHintId = useId()
</script>

<template>
  <AppFade class="pager-actions" :paused="paused">
    <div :key="state">
      <AppButton v-if="state === 'entry'" icon="arrow-right" @click="$emit('start')">
        {{ t('ranna.start') }}
      </AppButton>
      <AppButton v-else-if="state === 'ready'" icon="check" @click="$emit('collect')">
        {{ t('ranna.actions.collect') }}
      </AppButton>
      <template v-else>
        <AppButton
          :icon="nudged ? 'check' : 'bell'"
          :disabled="nudged"
          :aria-describedby="nudgeHintId"
          @click="$emit('nudge')"
        >
          {{ t(nudged ? 'ranna.actions.nudged' : 'ranna.actions.nudge') }}
        </AppButton>
        <p :id="nudgeHintId" class="sr-only">{{ t('ranna.actions.nudgeHint') }}</p>
        <p class="sr-only" role="status">{{ nudged ? t('ranna.actions.nudged') : '' }}</p>
      </template>
    </div>
  </AppFade>
</template>

<style scoped>
.pager-actions {
  min-block-size: 54px;
}
.pager-actions .primary:disabled {
  opacity: 1;
  background: var(--surface);
  color: var(--secondary);
}
</style>
