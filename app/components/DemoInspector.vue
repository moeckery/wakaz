<script setup lang="ts">
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui'

defineEmits<{ fullscreen: [] }>()
const route = useRoute()
const { state, includeItems, session, resetOrder } = usePager()
const { selectedId } = useVenue()
const { startTracking } = usePagerTracking()
const router = useRouter()
const { dark, arabicTextBy, liveCamera } = useDemoPreferences()
const { locale, locales, setLocale } = useI18n()
const mounts = useState('home-mounts', () => 0)
const records = computed(() => route.matched)
const stages = [
  { value: 'entry', label: 'Opened' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'ready', label: 'Ready' },
  { value: 'collected', label: 'Picked up' },
] as const

function changeLocale(value: unknown) {
  if (value === 'en' || value === 'ar') void setLocale(value)
}

function changeArabicTextBy(value: unknown) {
  if (value === 'word' || value === 'character') arabicTextBy.value = value
}

function previewPager() {
  startTracking(selectedId.value)
  void router.replace({ name: 'ranna-pager-id', params: { id: selectedId.value } })
}
</script>

<template>
  <aside class="inspector" aria-label="Ranna demo inspector" dir="ltr" lang="en">
    <div class="lab-wordmark"
      ><AppIcon name="bell-ring" />ranna <span class="version-pill">LAB</span></div
    >
    <h2>A real app.<br />A place to test it.</h2>
    <p class="inspector-copy">Preview the pager and explore its screens, sheets, and dialogs.</p>
    <div class="preview-options">
      <DemoVenueControls />
      <div class="option-group">
        <span id="camera-label" class="option-label">Scanner</span>
        <RadioGroupRoot
          :model-value="liveCamera ? 'camera' : 'demo'"
          class="choice-group"
          orientation="horizontal"
          dir="ltr"
          aria-labelledby="camera-label"
          @update:model-value="liveCamera = $event === 'camera'"
        >
          <RadioGroupItem value="demo" class="choice-item">Demo</RadioGroupItem>
          <RadioGroupItem value="camera" class="choice-item">Camera</RadioGroupItem>
        </RadioGroupRoot>
      </div>
      <div class="option-group">
        <span id="scenario-label" class="option-label">Pager state</span>
        <RadioGroupRoot
          v-model="state"
          class="choice-group"
          orientation="horizontal"
          dir="ltr"
          aria-labelledby="scenario-label"
        >
          <RadioGroupItem
            v-for="stage in stages"
            :key="stage.value"
            :value="stage.value"
            class="choice-item"
            >{{ stage.label }}</RadioGroupItem
          >
        </RadioGroupRoot>
      </div>
      <div class="option-group">
        <span id="items-label" class="option-label">Order details</span>
        <RadioGroupRoot
          :model-value="includeItems ? 'items' : 'number'"
          class="choice-group"
          orientation="horizontal"
          dir="ltr"
          aria-labelledby="items-label"
          @update:model-value="includeItems = $event === 'items'"
        >
          <RadioGroupItem value="items" class="choice-item">With items</RadioGroupItem>
          <RadioGroupItem value="number" class="choice-item">Number only</RadioGroupItem>
        </RadioGroupRoot>
      </div>
      <div class="option-group">
        <span id="theme-label" class="option-label">Appearance</span>
        <RadioGroupRoot
          :model-value="dark ? 'dark' : 'light'"
          class="choice-group"
          orientation="horizontal"
          dir="ltr"
          aria-labelledby="theme-label"
          @update:model-value="dark = $event === 'dark'"
        >
          <RadioGroupItem value="light" class="choice-item"
            ><AppIcon name="sun" />Light</RadioGroupItem
          >
          <RadioGroupItem value="dark" class="choice-item"
            ><AppIcon name="moon" />Dark</RadioGroupItem
          >
        </RadioGroupRoot>
      </div>
      <div class="option-group">
        <span id="locale-label" class="option-label">App language</span>
        <RadioGroupRoot
          :model-value="locale"
          class="choice-group"
          orientation="horizontal"
          dir="ltr"
          aria-labelledby="locale-label"
          @update:model-value="changeLocale"
        >
          <RadioGroupItem
            v-for="language in locales"
            :key="language.code"
            :value="language.code"
            :lang="language.language"
            :dir="language.dir"
            class="choice-item"
            >{{ language.name }}</RadioGroupItem
          >
        </RadioGroupRoot>
      </div>
      <div v-if="locale === 'ar'" class="option-group">
        <span id="arabic-motion-label" class="option-label">Arabic text motion</span>
        <RadioGroupRoot
          :model-value="arabicTextBy"
          class="choice-group"
          orientation="horizontal"
          dir="ltr"
          aria-labelledby="arabic-motion-label"
          @update:model-value="changeArabicTextBy"
        >
          <RadioGroupItem value="word" class="choice-item">Words</RadioGroupItem>
          <RadioGroupItem value="character" class="choice-item">Letters</RadioGroupItem>
        </RadioGroupRoot>
      </div>
    </div>
    <div class="inspector-actions">
      <button
        v-if="!route.matched.some((record) => record.name === 'ranna-pager-id')"
        type="button"
        @click="previewPager"
        ><AppIcon name="bell-ring" />Preview pager</button
      >
      <button type="button" @click="resetOrder"><AppIcon name="rotate-ccw" />Reset order</button>
      <button type="button" @click="$emit('fullscreen')"
        ><AppIcon name="maximize-2" />View fullscreen</button
      >
      <NuxtLink to="/sheet-demo">Sheet playground<AppIcon name="arrow-up-right" /></NuxtLink>
      <NuxtLink v-if="!route.path.startsWith('/ranna')" to="/ranna"
        >Back to Ranna<AppIcon name="arrow-right"
      /></NuxtLink>
    </div>
    <p v-if="state === 'collected'" class="inspector-footnote"
      >Picked up{{
        session.feedback === 'submitted'
          ? ' · Feedback saved'
          : session.feedback === 'skipped'
            ? ' · Rating skipped'
            : ' · Rating available'
      }}</p
    >
    <div class="live-label"><i />LIVE ROUTE</div>
    <code class="route-path">{{ route.path }}</code>
    <ol class="route-stack" aria-label="Mounted route layers">
      <li
        v-for="(record, index) in records"
        :key="record.path"
        :class="{ current: index === records.length - 1 }"
      >
        <span>{{ String(index + 1).padStart(2, '0') }}</span><code>{{ record.name }}</code>
      </li>
    </ol>
    <div class="mount-proof"
      ><span>Pager mounted</span><strong>{{ mounts }}×</strong></div
    >
    <p class="inspector-footnote"
      >These controls share the app’s demo state. Remove the preview wrapper to run the same app
      fullscreen.</p
    >
  </aside>
</template>

<style scoped>
.inspector {
  inline-size: 320px;
  max-block-size: calc(100dvh - 64px);
  overflow-y: auto;
  scrollbar-width: thin;
  flex-shrink: 0;
  color: #fafafa;
  pointer-events: auto;
}
.lab-wordmark {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 27px;
  letter-spacing: -1.1px;
  font-weight: 700;
  margin-block-end: 24px;
}
.lab-wordmark .icon {
  inline-size: 25px;
  block-size: 25px;
}
.version-pill {
  font-size: 10px;
  font-weight: 500;
  border: 1px solid #4b4b4b;
  border-radius: 5px;
  padding: 3px 5px;
  margin-inline-start: 3px;
  letter-spacing: 1px;
  color: #aaa;
}
.inspector h2 {
  font-size: 32px;
  font-weight: 550;
  line-height: 1.15;
  letter-spacing: -1.2px;
}
.inspector-copy {
  font-size: 13px;
  line-height: 1.65;
  color: #aaa;
  margin-block-start: 12px;
}
.preview-options {
  display: grid;
  gap: 18px;
  margin-block: 26px;
}
.option-label {
  display: block;
  font-size: 12px;
  color: #bbb;
  margin-block-end: 9px;
}
.choice-group {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #242424;
  border-radius: 13px;
}
.choice-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  flex: 1;
  min-inline-size: 0;
  min-block-size: 40px;
  padding: 9px 7px;
  background: none;
  color: #bbb;
  border-radius: 9px;
  font-size: 12px;
  line-height: 1.5;
}
.choice-item[data-state='checked'] {
  color: #161616;
  background: #fafafa;
}
.choice-item .icon {
  inline-size: 16px;
  block-size: 16px;
}
.choice-item:lang(ar) {
  font-family: 'Noto Sans Arabic', sans-serif;
}
.inspector-actions {
  display: grid;
  gap: 8px;
}
.inspector-actions > button,
.inspector-actions > a {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  min-block-size: 42px;
  border: 1px solid #414141;
  border-radius: 11px;
  background: none;
  color: #eee;
  font-size: 12px;
}
.inspector-actions .icon {
  inline-size: 16px;
  block-size: 16px;
}
.live-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 9px;
  letter-spacing: 1.4px;
  margin-block-start: 28px;
  color: #bbb;
}
.live-label i {
  inline-size: 5px;
  block-size: 5px;
  background: #7acba0;
  border-radius: 50%;
}
.route-path {
  display: block;
  font-size: 13px;
  margin-block: 10px 14px;
}
.route-stack {
  margin: 0;
  padding: 0;
  list-style: none;
}
.route-stack li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-block: 7px;
  color: #999;
  font-size: 11px;
}
.route-stack li > span {
  font-size: 9px;
  inline-size: 16px;
}
.route-stack li.current {
  color: #eee;
}
.mount-proof {
  border-block-start: 1px solid #393939;
  margin-block-start: 16px;
  padding-block-start: 16px;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #aaa;
}
.mount-proof strong {
  color: #eee;
  font-weight: 500;
}
.inspector-footnote {
  margin-block-start: 12px;
  font-size: 11px;
  line-height: 1.65;
  color: #999;
}
@media (max-width: 900px) {
  .inspector {
    inline-size: min(100%, 440px);
    max-block-size: none;
    overflow: visible;
  }
}
</style>
