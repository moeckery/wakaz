<template>
  <div class="route-page">
    <PreferencesScreen page="ranna-settings" :parent="{ name: 'ranna' }">
      <template #children="{ transition }">
        <NuxtPage :transition="transition" />
      </template>
    </PreferencesScreen>
  </div>
</template>
