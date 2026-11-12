<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ page: string; parent: RouteLocationRaw; pager?: boolean }>()
const { dark } = useDemoPreferences()
const { t, locale, setLocale } = useI18n()
const { isTracked } = usePagerTracking()
</script>

<template>
  <NuxtLayout name="screen" :page="page" :title="t('common.settings')" :parent="parent">
    <div class="settings-page">
      <div class="page-intro"
        ><p class="body-copy">{{ t('ranna.settingsBody') }}</p></div
      >
      <div class="menu-list">
        <AppButton :to="{ name: `${page}-appearance` }" variant="row" :icon="dark ? 'moon' : 'sun'">
          <span class="row-copy"
            ><strong>{{ t('common.appearance') }}</strong
            ><small>{{ t('ranna.appearanceHint') }}</small></span
          >
          <span class="muted">{{ t(dark ? 'common.dark' : 'common.light') }}</span>
          <AppIcon name="chevron-right" class="directional" />
        </AppButton>
        <AppButton
          variant="row"
          icon="languages"
          :aria-pressed="locale === 'ar'"
          @click="setLocale(locale === 'ar' ? 'en' : 'ar')"
        >
          <span class="row-copy"
            ><strong>{{ t('common.language') }}</strong
            ><small>{{ t('ranna.languageHint') }}</small></span
          >
          <span :lang="locale === 'ar' ? 'en' : 'ar'">{{
            locale === 'ar' ? 'English' : 'العربية'
          }}</span>
        </AppButton>
        <AppButton :to="{ name: `${page}-about` }" variant="row" icon="info">
          <span class="row-copy"
            ><strong>{{ t('ranna.about') }}</strong
            ><small>{{ t('ranna.aboutHint') }}</small></span
          >
          <AppIcon name="chevron-right" class="directional" />
        </AppButton>
      </div>
      <div v-if="pager && isTracked" class="tracking-settings">
        <AppButton :to="{ name: `${page}-stop` }" variant="row" icon="bell-off">
          <span class="row-copy"
            ><strong>{{ t('ranna.tracking.stop') }}</strong
            ><small>{{ t('ranna.tracking.stopHint') }}</small></span
          >
          <AppIcon name="chevron-right" class="directional" />
        </AppButton>
      </div>
      <p class="muted settings-note">{{ t('ranna.settingsFootnote') }}</p>
    </div>
    <template #children="{ transition }">
      <slot name="children" :transition="transition" />
    </template>
  </NuxtLayout>
</template>

<style scoped>
.page-intro {
  margin: 15px 0 28px;
}
.menu-list {
  margin-top: 16px;
}
.row-copy {
  flex: 1;
}
.row-copy small {
  display: block;
  color: var(--secondary);
  font-size: 11px;
  line-height: 1.5;
  margin-top: 5px;
}
.tracking-settings {
  margin-block-start: 28px;
}
.settings-note {
  margin-top: 22px;
  font-size: 11px;
}
</style>
