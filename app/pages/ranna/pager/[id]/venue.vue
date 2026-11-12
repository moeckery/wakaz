<script setup lang="ts">
const { t } = useI18n()
const { venue, identity, style } = useVenue()
const { close } = useLayerNavigation()
const route = useRoute()
const parent = computed(() => ({ name: 'ranna-pager-id', params: { id: route.params.id } }))
</script>

<template>
  <div class="route-page">
    <NuxtLayout
      name="sheet"
      page="ranna-pager-id-venue"
      :title="t('ranna.venueDetails')"
      :parent="parent"
    >
      <div class="venue-details">
        <div class="venue-identity" :style="style">
          <VenueMark :venue="venue" />
          <h3>{{ identity.name }}</h3>
          <p>{{ identity.branch }}</p>
        </div>
        <dl class="venue-facts">
          <div
            ><dt><AppIcon name="map-pin" />{{ t('ranna.location') }}</dt
            ><dd>{{ identity.address }}</dd></div
          >
          <div
            ><dt><AppIcon name="ticket" />{{ t('ranna.collection') }}</dt
            ><dd
              >{{ t('ranna.counter') }}<span>{{ t('ranna.collectionHint') }}</span></dd
            ></div
          >
        </dl>
        <AppButton @click="close(parent)">{{ t('common.done') }}</AppButton>
      </div>
    </NuxtLayout>
  </div>
</template>

<style scoped>
.venue-identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 26px 20px;
  border: 1px solid var(--venue-border);
  border-radius: 20px;
  background: var(--venue-color);
  color: var(--venue-ink);
  text-align: center;
}
.venue-identity .venue-mark {
  inline-size: 52px;
  block-size: 52px;
  margin-block-end: 12px;
}
.venue-identity h3 {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
}
.venue-identity p {
  margin-block-start: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--venue-secondary);
}
.venue-facts {
  margin: 22px 0 26px;
  display: grid;
  gap: 20px;
}
.venue-facts dt {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--secondary);
}
.venue-facts dt .icon {
  inline-size: 16px;
  block-size: 16px;
}
.venue-facts dd {
  margin: 7px 0 0;
  font-size: 14px;
  line-height: 1.6;
}
.venue-facts dd span {
  display: block;
  margin-block-start: 3px;
  color: var(--secondary);
  font-size: 12px;
}
</style>
