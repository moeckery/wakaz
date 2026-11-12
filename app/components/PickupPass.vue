<script setup lang="ts">
import type { OrderItem, PagerState } from '~/types/pager'

defineProps<{
  code: string
  number: string
  pickup: string
  state: Exclude<PagerState, 'collected'>
  items?: readonly OrderItem[]
}>()
const { t, n } = useI18n()
</script>

<template>
  <section class="pickup-pass" :aria-label="t('ranna.pass.title')">
    <div class="pass-overview">
      <div class="pass-details">
        <dl class="pass-summary">
          <div>
            <dt>{{ t('ranna.orderNumber') }}</dt>
            <dd
              ><bdi dir="ltr" class="pass-number">{{ number }}</bdi></dd
            >
          </div>
        </dl>
        <p class="pass-status" :data-state="state" role="status">
          <span aria-hidden="true" />{{ t(`ranna.pass.status.${state}`) }}
        </p>
        <p class="pass-pickup">{{ pickup }}</p>
      </div>
      <PickupCode class="pass-code" :code="code" />
    </div>
    <table v-if="items?.length" class="pass-items" :aria-label="t('ranna.pass.items')">
      <thead class="sr-only">
        <tr
          ><th scope="col">{{ t('ranna.pass.items') }}</th
          ><th scope="col">{{ t('ranna.pass.quantity') }}</th></tr
        >
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>{{ item.name }}</td><td
            ><bdi dir="ltr"><span aria-hidden="true">×</span>{{ n(item.quantity) }}</bdi></td
          >
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.pickup-pass {
  --pass-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Noto Sans Arabic', monospace;
  text-align: start;
}
.pass-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px;
  gap: 20px;
}
.pass-details {
  min-inline-size: 0;
}
/* Only the order details set the row height; the code fits the stretched cell. */
.pass-code {
  container-type: size;
}
.pass-summary {
  margin: 0;
}
.pass-summary > div {
  min-inline-size: 0;
}
.pass-summary dt {
  margin-block-end: 4px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--secondary);
}
.pass-summary dd {
  margin: 0;
}
.pass-number {
  display: inline-block;
  font-family: var(--pass-mono);
  font-size: 60px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -1.6px;
  font-variant-numeric: tabular-nums;
}
.pass-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-block-start: 6px;
  font-size: 11px;
  font-weight: 400;
  line-height: 1.5;
}
.pass-status > span {
  inline-size: 6px;
  block-size: 6px;
  flex: none;
  border-radius: 50%;
  background: #d16c26;
}
.pass-status[data-state='entry'] > span {
  background: #2875db;
}
.pass-status[data-state='ready'] > span {
  background: #219969;
}
.pass-pickup {
  margin-block-start: 12px;
  color: var(--secondary);
  font-size: 12px;
  line-height: 1.5;
  text-wrap: pretty;
}
.pass-items {
  inline-size: 100%;
  margin-block-start: 14px;
  border-collapse: collapse;
  border-block-start: 1px dashed var(--line);
  table-layout: fixed;
  font-family: var(--pass-mono);
}
.pass-items td {
  padding-block: 6px;
  font-size: 13px;
  line-height: 1.5;
  text-align: start;
  overflow-wrap: anywhere;
}
.pass-items td:last-child {
  inline-size: 56px;
  padding-inline-start: 16px;
  text-align: end;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.pass-items td:last-child span {
  margin-inline-end: 2px;
  color: var(--secondary);
}
</style>
