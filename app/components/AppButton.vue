<script setup lang="ts">
import Button from 'primevue/button'
import { NuxtLink } from '#components'
import type { RouteLocationRaw } from 'vue-router'
import type { IconName } from '~/data/icons'

withDefaults(
  defineProps<{
    to?: RouteLocationRaw
    variant?: 'primary' | 'icon' | 'row' | 'text'
    tone?: 'surface' | 'contrast'
    icon?: IconName
  }>(),
  { variant: 'primary', tone: 'surface' },
)

const variants = { primary: 'primary', icon: 'icon-button', row: 'menu-row', text: 'text-button' }
</script>

<template>
  <Button :as="to ? NuxtLink : 'BUTTON'" :to="to" :class="variants[variant]" :data-tone="tone">
    <AppIcon v-if="icon" :name="icon" />
    <slot />
  </Button>
</template>
