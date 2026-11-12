<script setup lang="ts">
const { t } = useI18n()
const { state, order, session, setRating, setComment, submitFeedback, skipFeedback } = usePager()
const { identity } = useVenue()
</script>

<template>
  <div class="route-page">
    <NuxtLayout
      name="sheet"
      page="ranna-pager-id-pickup"
      :title="t('ranna.pass.title')"
      :parent="{ name: 'ranna-pager-id', params: { id: $route.params.id } }"
    >
      <PickupPass
        v-if="state !== 'collected'"
        :code="order.pickupCode"
        :number="order.number"
        :pickup="t('ranna.counter')"
        :state="state"
        :items="order.items"
      />
      <PagerStatus v-else :state="state" :feedback="session.feedback" :venue="identity.name">
        <PickupComplete
          :number="order.number"
          :rating="session.rating"
          :comment="session.comment"
          :feedback="session.feedback"
          @update:rating="setRating"
          @update:comment="setComment"
          @submit="submitFeedback"
          @skip="skipFeedback"
        />
      </PagerStatus>
    </NuxtLayout>
  </div>
</template>
