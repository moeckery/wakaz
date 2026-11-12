export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  ssr: false,
  telemetry: false,
  devtools: { enabled: false },
  modules: ['@nuxtjs/i18n'],
  i18n: {
    defaultLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    locales: [
      { code: 'en', language: 'en', name: 'English', dir: 'ltr', file: 'en.json' },
      { code: 'ar', language: 'ar', name: 'العربية', dir: 'rtl', file: 'ar.json' },
    ],
  },
  css: ['~/assets/main.css', '~/assets/controls.css'],
  vite: {
    optimizeDeps: {
      include: [
        'primevue/config',
        'primevue/button',
        'primevue/textarea',
        'primevue/radiobutton',
        'reka-ui',
        'uqr',
      ],
    },
  },
  // Development output is disposable; keep the generated site separate.
  $production: {
    nitro: { output: { publicDir: 'dist' } },
  },
  nitro: {
    prerender: {
      routes: [
        '/',
        '/ranna',
        '/ranna/scan',
        '/ranna/venue',
        '/ranna/pickup',
        '/ranna/settings',
        '/ranna/settings/appearance',
        '/ranna/settings/about',
        ...['north', 'field'].flatMap((id) =>
          [
            '',
            '/venue',
            '/pickup',
            '/settings',
            '/settings/appearance',
            '/settings/about',
            '/settings/stop',
          ].map((path) => `/ranna/pager/${id}${path}`),
        ),
        '/sheet-demo',
        '/lab',
        '/lab/pickup',
        '/lab/settings',
        '/lab/settings/appearance',
        '/lab/about',
      ],
    },
  },
  app: {
    head: {
      title: 'Ranna — app lab',
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      meta: [
        {
          name: 'description',
          content:
            'A customer pager proof of concept with mobile screens, sheets, and an optional inspector.',
        },
      ],
    },
  },
})
