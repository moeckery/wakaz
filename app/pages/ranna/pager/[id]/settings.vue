<template>
  <div class="route-page">
    <PreferencesScreen page="ranna-pager-id-settings" :parent="{ name: 'ranna-pager-id' }" pager>
      <template #children="{ transition }">
        <NuxtPage :transition="transition" />
      </template>
    </PreferencesScreen>
  </div>
</template>
