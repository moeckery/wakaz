<script setup lang="ts">
import { renderSVG } from 'uqr'
import { toBraille } from '~/utils/braille'

const props = defineProps<{ code: string }>()
const { t } = useI18n()
const id = useId()
const markerMaskId = `${id}-marker-mask`
const markerBlurId = `${id}-marker-blur`
// QR and assistive text retain the letters; the visual fallback uses Braille cells.
const displayCode = computed(() => toBraille(props.code))
const spokenCode = computed(() => [...props.code].join(' '))
const qrSource = computed(
  () =>
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      renderSVG(props.code, {
        border: 2,
        ecc: 'M',
        blackColor: '#000000',
        whiteColor: 'none',
      }),
    )}`,
)
</script>

<template>
  <div class="pickup-code">
    <div class="qr-frame">
      <img
        class="pickup-qr"
        :src="qrSource"
        :alt="t('ranna.pass.qrLabel')"
        width="145"
        height="145"
      />
      <svg class="qr-motion" viewBox="0 0 161 161" fill="none" aria-hidden="true">
        <defs>
          <filter
            :id="markerBlurId"
            filterUnits="userSpaceOnUse"
            x="-32"
            y="-32"
            width="225"
            height="225"
          >
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <mask
            :id="markerMaskId"
            maskUnits="userSpaceOnUse"
            x="-32"
            y="-32"
            width="225"
            height="225"
          >
            <rect
              class="qr-marker-mask"
              x="1"
              y="1"
              width="159"
              height="159"
              rx="18"
              pathLength="100"
              :filter="`url(#${markerBlurId})`"
            />
          </mask>
        </defs>
        <rect class="qr-outline" x="1" y="1" width="159" height="159" rx="18" />
        <rect
          class="qr-marker"
          x="1"
          y="1"
          width="159"
          height="159"
          rx="18"
          :mask="`url(#${markerMaskId})`"
        />
      </svg>
    </div>
    <dl class="code-fallback">
      <dt class="sr-only">{{ t('ranna.pass.codeLabel') }}</dt>
      <dd>
        <bdi class="braille-code" dir="ltr" aria-hidden="true">{{ displayCode }}</bdi>
        <span class="sr-only"
          ><bdi dir="ltr" lang="en">{{ spokenCode }}</bdi></span
        >
      </dd>
    </dl>
  </div>
</template>

<style scoped>
.pickup-code {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  justify-items: center;
  gap: 6px;
}
.qr-frame {
  position: relative;
  block-size: min(100%, 100cqi);
  max-inline-size: 100%;
  aspect-ratio: 1;
  align-self: end;
  padding: 8px;
}
.pickup-qr {
  display: block;
  inline-size: 100%;
  block-size: 100%;
}
.dark .pickup-qr {
  filter: invert(1);
}
.qr-motion {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  overflow: visible;
  pointer-events: none;
}
.qr-outline,
.qr-marker {
  stroke-width: 2.5;
  vector-effect: non-scaling-stroke;
}
.qr-outline {
  stroke: var(--line);
}
.qr-marker {
  stroke: var(--ink);
}
/* Soften the moving mask, keeping the visible border itself crisp. */
.qr-marker-mask {
  stroke: #fff;
  stroke-width: 24;
  stroke-dasharray: 16 84;
  animation: pickup-marker 4s linear infinite;
}
.code-fallback {
  margin: 0;
  text-align: center;
  line-height: 1;
}
.code-fallback dd {
  margin: 0;
}
.braille-code {
  display: block;
  color: var(--secondary);
  font-family: 'Segoe UI Symbol', 'Apple Symbols', 'Noto Sans Symbols 2', sans-serif;
  font-size: 20px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
@keyframes pickup-marker {
  to {
    stroke-dashoffset: -100;
  }
}
@media (prefers-reduced-motion: reduce) {
  .qr-marker-mask {
    animation: none;
  }
}
</style>
