<script setup lang="ts">
const { dark } = useDemoPreferences()
const { localeProperties } = useI18n()
</script>

<template>
  <main
    class="app-shell"
    :class="{ dark }"
    :dir="localeProperties.dir"
    :lang="localeProperties.language"
  >
    <div class="app-viewport"><slot /></div>
  </main>
</template>

<style scoped>
.app-shell {
  --bg: #fff;
  --ink: #171717;
  --secondary: #737373;
  --surface: #f4f4f4;
  --line: #e4e4e4;
  --push: 100%;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--bg);
  color: var(--ink);
  color-scheme: light;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  padding: var(--app-safe-top, env(safe-area-inset-top, 0px))
    var(--app-safe-right, env(safe-area-inset-right, 0px))
    var(--app-safe-bottom, env(safe-area-inset-bottom, 0px))
    var(--app-safe-left, env(safe-area-inset-left, 0px));
}
.app-shell.dark {
  --bg: #161616;
  --ink: #f7f7f7;
  --secondary: #aaa;
  --surface: #232323;
  --line: #363636;
  color-scheme: dark;
}
.app-shell[dir='rtl'] {
  font-family: 'Noto Sans Arabic', sans-serif;
  --push: -100%;
}
.app-viewport {
  width: 100%;
  height: 100%;
  position: relative;
  isolation: isolate;
  overflow: hidden;
}
</style>
