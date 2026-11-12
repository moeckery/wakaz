<script setup lang="ts">
import { renderSVG } from 'uqr'
import decoderUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'
import type { DetectedBarcode } from 'vue-qrcode-reader'
import type { VenueId } from '~/data/venues'
import { parsePagerQr } from '~/utils/pagerQr'

const props = defineProps<{ paused?: boolean }>()
const emit = defineEmits<{ detected: [id: VenueId] }>()
const { t } = useI18n()
const { liveCamera } = useDemoPreferences()
const { venue, identity } = useVenue()

type CameraIssue = 'permission' | 'missing' | 'unsupported' | 'insecure' | 'busy' | 'unavailable'
type CameraState = { status: 'opening' | 'ready' } | { status: 'error'; issue: CameraIssue }
const camera = ref<CameraState>({ status: 'opening' })
const accepted = ref(false)
const unrecognized = ref(false)
const attempt = ref(0)
const visible = ref(true)
const running = computed(
  () =>
    liveCamera.value &&
    !props.paused &&
    visible.value &&
    !accepted.value &&
    camera.value.status !== 'error',
)
const demoValue = computed(() => `ranna:demo:${venue.value.id}`)
const demoQr = computed(
  () =>
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderSVG(demoValue.value, { border: 1, ecc: 'M', whiteColor: '#fff', blackColor: '#171717' }))}`,
)

// Load the camera decoder on demand and keep its fallback WASM on this origin.
const QrcodeStream = defineAsyncComponent({
  async loader() {
    const reader = await import('vue-qrcode-reader')
    reader.setZXingModuleOverrides({
      locateFile: (path, prefix) => (path.endsWith('.wasm') ? decoderUrl : prefix + path),
    })
    return reader.QrcodeStream
  },
  onError(error, _retry, fail) {
    cameraFailed(error)
    fail()
  },
})

function resetCamera() {
  camera.value = { status: 'opening' }
  accepted.value = false
  unrecognized.value = false
  attempt.value++
}

watch([() => props.paused, liveCamera, visible], resetCamera)

function updateVisibility() {
  visible.value = document.visibilityState === 'visible'
}
onMounted(() => {
  updateVisibility()
  document.addEventListener('visibilitychange', updateVisibility)
})
onBeforeUnmount(() => document.removeEventListener('visibilitychange', updateVisibility))

function detect(codes: readonly Pick<DetectedBarcode, 'rawValue'>[]) {
  if (props.paused || !visible.value || accepted.value) return
  const id = codes.map((code) => parsePagerQr(code.rawValue, window.location.origin)).find(Boolean)
  if (!id) {
    unrecognized.value = codes.length > 0
    return
  }
  accepted.value = true
  emit('detected', id)
}

function cameraReady() {
  if (running.value) camera.value = { status: 'ready' }
}

function cameraFailed(error: Error) {
  if (!running.value) return
  const issues: Record<string, CameraIssue> = {
    NotAllowedError: 'permission',
    PermissionDeniedError: 'permission',
    NotFoundError: 'missing',
    OverconstrainedError: 'missing',
    StreamApiNotSupportedError: 'unsupported',
    InsecureContextError: 'insecure',
    NotReadableError: 'busy',
  }
  camera.value = { status: 'error', issue: issues[error.name] ?? 'unavailable' }
}
</script>

<template>
  <div class="pager-scanner" :aria-label="t('ranna.scanner.label')">
    <QrcodeStream
      v-if="running"
      :key="attempt"
      class="camera-stream"
      @detect="detect"
      @camera-on="cameraReady"
      @error="cameraFailed"
    />

    <template v-if="!liveCamera">
      <span class="camera-badge">{{ t('ranna.scanner.demo') }}</span>
      <button
        type="button"
        class="demo-qr"
        :disabled="paused || accepted"
        :aria-label="t('ranna.scanner.demoAction', { venue: identity.name })"
        @click="detect([{ rawValue: demoValue }])"
      >
        <img :src="demoQr" alt="" width="160" height="160" />
      </button>
      <p class="camera-hint">{{ t('ranna.scanner.demoHint') }}</p>
    </template>

    <div v-else-if="!paused && camera.status === 'error'" class="camera-message" role="status">
      <AppIcon name="scan-line" />
      <strong>{{ t('ranna.scanner.unavailableTitle') }}</strong>
      <p>{{ t(`ranna.scanner.errors.${camera.issue}`) }}</p>
      <AppButton variant="text" icon="rotate-ccw" @click="resetCamera">{{
        t('ranna.scanner.retry')
      }}</AppButton>
    </div>
    <div v-else-if="!paused && camera.status === 'opening'" class="camera-message" role="status">
      <AppIcon name="scan-line" />
      <p>{{ t('ranna.scanner.opening') }}</p>
    </div>
    <p v-else-if="!paused" class="camera-hint" role="status">{{
      t(unrecognized ? 'ranna.scanner.unrecognized' : 'ranna.scanner.hint')
    }}</p>

    <div v-if="!liveCamera || camera.status !== 'error'" class="camera-guides" aria-hidden="true">
      <i v-for="corner in 4" :key="corner" />
    </div>
  </div>
</template>

<style scoped>
.pager-scanner {
  position: relative;
  display: grid;
  place-items: center;
  inline-size: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  isolation: isolate;
  border-radius: 28px;
  background: #222;
  color: #fff;
}
.camera-stream {
  position: absolute !important;
  inset: 0;
}
.camera-badge {
  position: absolute;
  inset-block-start: 17px;
  inset-inline-start: 17px;
  z-index: 1;
  padding: 5px 9px;
  border-radius: 7px;
  background: #ffffff12;
  color: #ddd;
  font-size: 10px;
  font-weight: 500;
  line-height: 1.5;
}
.demo-qr {
  display: block;
  inline-size: 45%;
  padding: 10px;
  border-radius: 13px;
  background: #fff;
  box-shadow: 0 6px 26px #0003;
}
.demo-qr:focus-visible {
  outline-color: #fff;
  outline-offset: 8px;
}
.demo-qr:active {
  opacity: 0.85;
}
.demo-qr img {
  display: block;
  inline-size: 100%;
  block-size: auto;
}
.camera-hint {
  position: absolute;
  inset-inline: 18px;
  inset-block-end: 19px;
  z-index: 1;
  width: fit-content;
  max-inline-size: calc(100% - 36px);
  margin-inline: auto;
  padding: 6px 10px;
  border-radius: 8px;
  background: #191919cc;
  color: #eee;
  font-size: 11px;
  line-height: 1.6;
  text-align: center;
}
.camera-message {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-inline-size: 290px;
  padding: 24px;
  text-align: center;
}
.camera-message > .icon {
  inline-size: 30px;
  block-size: 30px;
  margin-block-end: 6px;
  color: #aaa;
}
.camera-message strong {
  font-size: 15px;
  font-weight: 550;
  line-height: 1.5;
}
.camera-message p {
  color: #bdbdbd;
  font-size: 12px;
  line-height: 1.7;
  text-wrap: pretty;
}
.camera-message .text-button {
  padding-inline: 12px;
  margin-block-start: 2px;
  color: #fff;
}
.camera-message .text-button:focus-visible {
  outline-color: #fff;
}
.camera-guides {
  position: absolute;
  inset: 18%;
  z-index: 1;
  pointer-events: none;
}
.camera-guides i {
  position: absolute;
  inline-size: 29px;
  block-size: 29px;
  inset: 0 auto auto 0;
  border: solid #fffd;
  border-width: 2.5px 0 0 2.5px;
  border-radius: 13px 0 0 0;
}
.camera-guides i:nth-child(2) {
  inset: 0 0 auto auto;
  transform: rotate(90deg);
}
.camera-guides i:nth-child(3) {
  inset: auto 0 0 auto;
  transform: rotate(180deg);
}
.camera-guides i:nth-child(4) {
  inset: auto auto 0 0;
  transform: rotate(270deg);
}
</style>
