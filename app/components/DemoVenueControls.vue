<script setup lang="ts">
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui'

const { venues, selectedId, venue, color, setColor } = useVenue()
const route = useRoute()
const router = useRouter()
const { startTracking } = usePagerTracking()
const previewVenue = computed({
  get: () => selectedId.value,
  set: (id) => {
    selectedId.value = id
    if (route.matched.some((record) => record.name === 'ranna-pager-id')) {
      // Inspector-only switching previews the selected venue in the same layer.
      startTracking(id)
      void router.replace({
        name: route.name!,
        params: { ...route.params, id },
        query: route.query,
      })
    }
  },
})
const colorDraft = ref(color.value)
const isInvalid = ref(false)
watch([color, selectedId], () => {
  colorDraft.value = color.value
  isInvalid.value = false
})

function applyColor() {
  isInvalid.value = !setColor(colorDraft.value)
  if (!isInvalid.value) colorDraft.value = color.value
}

function resetColor() {
  color.value = venue.value.color
  colorDraft.value = color.value
  isInvalid.value = false
}
</script>

<template>
  <div class="venue-controls">
    <span id="venue-label" class="venue-label">Venue identity</span>
    <RadioGroupRoot
      v-model="previewVenue"
      class="venue-presets"
      orientation="horizontal"
      dir="ltr"
      aria-labelledby="venue-label"
    >
      <RadioGroupItem
        v-for="preset in venues"
        :key="preset.id"
        :value="preset.id"
        class="venue-preset"
      >
        {{ preset.name.en }}
      </RadioGroupItem>
    </RadioGroupRoot>
    <div class="color-controls">
      <input v-model="color" type="color" aria-label="Choose venue color" class="color-picker" />
      <div class="color-field">
        <label for="venue-hex">Brand color</label>
        <input
          id="venue-hex"
          v-model="colorDraft"
          type="text"
          spellcheck="false"
          autocomplete="off"
          :aria-invalid="isInvalid"
          :aria-describedby="isInvalid ? 'venue-color-error' : undefined"
          @change="applyColor"
          @keydown.enter="applyColor"
        />
      </div>
      <button type="button" class="reset-color" aria-label="Reset venue color" @click="resetColor"
        ><AppIcon name="rotate-ccw"
      /></button>
    </div>
    <p v-if="isInvalid" id="venue-color-error" class="color-error" role="alert"
      >Use a 3- or 6-digit hex color.</p
    >
  </div>
</template>

<style scoped>
.venue-label {
  display: block;
  margin-block-end: 9px;
  font-size: 12px;
  color: #bbb;
}
.venue-presets {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #242424;
  border-radius: 13px;
}
.venue-preset {
  flex: 1;
  min-inline-size: 0;
  min-block-size: 40px;
  padding: 9px 7px;
  border-radius: 9px;
  background: none;
  color: #bbb;
  font-size: 12px;
  line-height: 1.5;
}
.venue-preset[data-state='checked'] {
  color: #161616;
  background: #fafafa;
}
.color-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-block-start: 12px;
  padding: 10px 12px;
  border: 1px solid #414141;
  border-radius: 12px;
}
.color-picker {
  appearance: none;
  inline-size: 38px;
  block-size: 38px;
  flex: none;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}
.color-picker::-webkit-color-swatch {
  border: 1px solid #777;
  border-radius: 9px;
}
.color-picker::-moz-color-swatch {
  border: 1px solid #777;
  border-radius: 9px;
}
.color-field {
  flex: 1;
  min-inline-size: 0;
}
.color-field label {
  display: block;
  font-size: 10px;
  color: #aaa;
}
.color-field input {
  inline-size: 100%;
  padding: 3px 0 0;
  border: 0;
  background: none;
  color: #fafafa;
  font-size: 16px;
  line-height: 1.5;
}
.reset-color {
  display: grid;
  place-items: center;
  inline-size: 36px;
  block-size: 38px;
  flex: none;
  border-radius: 8px;
  background: none;
  color: #bbb;
}
.reset-color .icon {
  inline-size: 17px;
  block-size: 17px;
}
.color-error {
  margin-block-start: 8px;
  font-size: 12px;
  color: #ffb5ae;
}
</style>
