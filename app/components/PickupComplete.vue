<script setup lang="ts">
import Textarea from 'primevue/textarea'
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui'
import type { FeedbackStatus } from '~/types/pager'
import { feedbackCommentLimit, isPickupRating } from '~/utils/pickupSession'

const props = defineProps<{
  number: string
  rating: number
  comment: string
  feedback: FeedbackStatus
  paused?: boolean
}>()
const emit = defineEmits<{
  'update:rating': [value: number]
  'update:comment': [value: string]
  submit: []
  skip: []
}>()
const { t, n, localeProperties } = useI18n()
const questionId = useId()
const isFinished = computed(() => props.feedback !== 'pending')

function rate(value: unknown) {
  const rating = Number(value)
  if (isPickupRating(rating)) emit('update:rating', rating)
}
</script>

<template>
  <section class="pickup-complete" :aria-label="t('ranna.feedback.collected')">
    <div class="completion-receipt">
      <span
        >{{ t('ranna.orderNumber') }} <bdi dir="ltr">{{ number }}</bdi></span
      >
      <AppIcon name="check" />
    </div>

    <AppFade :paused="paused">
      <form v-if="!isFinished" class="pickup-feedback" @submit.prevent="emit('submit')">
        <h3 :id="questionId">{{ t('ranna.feedback.question') }}</h3>
        <RadioGroupRoot
          :model-value="rating ? String(rating) : undefined"
          :dir="localeProperties.dir === 'rtl' ? 'rtl' : 'ltr'"
          orientation="horizontal"
          class="rating-stars"
          :aria-labelledby="questionId"
          @update:model-value="rate"
        >
          <RadioGroupItem
            v-for="value in 5"
            :key="value"
            :value="String(value)"
            class="rating-star"
            :data-selected="value <= rating"
            :aria-label="t('ranna.feedback.starLabel', { count: n(value) })"
          >
            <AppIcon :name="value <= rating ? 'star-filled' : 'star'" />
          </RadioGroupItem>
        </RadioGroupRoot>
        <Textarea
          :model-value="comment"
          :aria-label="t('ranna.feedback.comment')"
          :placeholder="t('ranna.feedback.comment')"
          :maxlength="feedbackCommentLimit"
          :rows="2"
          class="feedback-comment"
          @update:model-value="emit('update:comment', $event ?? '')"
        />
        <div class="feedback-actions">
          <AppButton type="submit" :disabled="!rating">{{ t('ranna.feedback.submit') }}</AppButton>
          <AppButton type="button" variant="text" @click="emit('skip')">{{
            t('ranna.feedback.skip')
          }}</AppButton>
        </div>
      </form>
    </AppFade>
  </section>
</template>

<style scoped>
.pickup-complete {
  inline-size: 100%;
  text-align: start;
}
.completion-receipt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-block-start: 20px;
  padding: 14px 16px;
  background: var(--surface);
  border-radius: 14px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--secondary);
}
.completion-receipt > span {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
}
.completion-receipt bdi {
  color: var(--ink);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
}
.completion-receipt .icon {
  inline-size: 18px;
  block-size: 18px;
  color: var(--ink);
}
.pickup-feedback {
  margin-block-start: 24px;
}
.pickup-feedback h3 {
  font-size: 19px;
  line-height: 1.5;
  font-weight: 550;
  text-align: center;
  letter-spacing: -0.4px;
}
.pickup-feedback h3:dir(rtl) {
  letter-spacing: 0;
}
.rating-stars {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-block: 14px 18px;
}
.rating-star {
  display: grid;
  place-items: center;
  inline-size: 48px;
  min-inline-size: 44px;
  block-size: 48px;
  flex: 0 1 48px;
  padding: 0;
  border-radius: 50%;
  background: var(--surface);
  color: var(--secondary);
}
.rating-star[data-selected='true'] {
  color: var(--ink);
}
.rating-star .icon {
  inline-size: 25px;
  block-size: 25px;
}
.feedback-comment {
  block-size: 80px;
  resize: vertical;
  min-block-size: 80px;
  max-block-size: 180px;
  font-size: 16px;
}
.feedback-comment::placeholder {
  color: var(--secondary);
  font-size: 13px;
}
.feedback-actions {
  display: grid;
  gap: 4px;
  margin-block-start: 18px;
}
</style>
