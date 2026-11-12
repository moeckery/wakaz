<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ number: string; pickup: string; to?: RouteLocationRaw }>()
const { t } = useI18n()
</script>

<template>
  <section class="order-card" :aria-label="t('ranna.orderNumber')">
    <dl class="order-details">
      <div class="order-identity">
        <dt>{{ t('ranna.orderNumber') }}</dt>
        <dd
          ><bdi dir="ltr" class="order-number">{{ number }}</bdi></dd
        >
      </div>
      <div class="order-pickup">
        <dt>{{ t('ranna.pickupLabel') }}</dt>
        <dd>{{ pickup }}</dd>
      </div>
    </dl>
    <div class="order-note">
      <AppButton v-if="to" :to="to" variant="text" class="order-pass">
        {{ t('ranna.openPass') }}<AppIcon name="arrow-up-right" />
      </AppButton>
      <p v-else class="order-hint">{{ t('ranna.orderHint') }}</p>
    </div>
  </section>
</template>

<style scoped>
.order-card {
  --order-divider: #d8d8d8;
  inline-size: 100%;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--surface);
  text-align: start;
}
.dark .order-card {
  --order-divider: #434343;
}
.order-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0;
  padding: 21px 23px 18px;
}
.order-details > div {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-inline-size: 0;
}
.order-details dt {
  color: var(--secondary);
  font-size: 11px;
  line-height: 1.5;
}
.order-details dd {
  margin: 0;
}
.order-number {
  display: block;
  font-family: Inter, sans-serif;
  font-size: 49px;
  font-weight: 550;
  line-height: 1;
  letter-spacing: -2px;
  font-variant-numeric: tabular-nums;
}
.order-pickup {
  max-inline-size: 50%;
  text-align: end;
}
.order-pickup dd {
  font-size: 17px;
  font-weight: 550;
  line-height: 1.4;
  letter-spacing: -0.4px;
  overflow-wrap: anywhere;
}
.order-pickup dd:dir(rtl) {
  letter-spacing: 0;
}
.order-note {
  position: relative;
  border-block-start: 1px dashed var(--order-divider);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.5;
}
.order-hint {
  padding: 13px 23px;
}
.order-pass {
  inline-size: 100%;
  justify-content: space-between;
  padding: 12px 23px;
  border-radius: 0 0 20px 20px;
  font-size: 11px;
}
.order-pass:focus-visible {
  outline-offset: -4px;
}
.order-pass:dir(rtl) .icon {
  transform: scaleX(-1);
}
/* The open side overlaps the card stroke, leaving only the concave outline. */
.order-note::before,
.order-note::after {
  content: '';
  position: absolute;
  inset-block-start: -6px;
  inline-size: 6px;
  block-size: 10px;
  border: 1px solid var(--line);
  background: var(--bg);
  pointer-events: none;
}
.order-note::before {
  inset-inline-start: -1px;
  border-inline-start: 0;
  border-start-end-radius: 100% 50%;
  border-end-end-radius: 100% 50%;
}
.order-note::after {
  inset-inline-end: -1px;
  border-inline-end: 0;
  border-start-start-radius: 100% 50%;
  border-end-start-radius: 100% 50%;
}
</style>
