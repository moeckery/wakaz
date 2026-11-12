# Ranna lab

A single Nuxt 4 proof of concept for a customer pager. Ranna is the working app inside the lab: the scanner, active pager, venue details, preferences, and dialogs use the same route tree, shared controls, and app shell. Each page explicitly selects its presentation layout and includes a nested outlet when it has children.

The existing `DemoPreview` wraps that app in a **440 × 956 CSS pixel** device canvas and an inspector with venue, pager, scanner, appearance, and language controls. Fullscreen uses the same mounted app. All orders and venues are fictional; there is no backend, authentication, payment, menu, or staff dashboard. The active pager, most recently removed pager, pickup sessions, and selected venue are saved locally across refreshes. Scanner mode, venue colors, appearance, and language remain session preferences.

## Run

Use Node.js 24 or newer.

```sh
npm ci
npm run dev
```

Open [Ranna](http://127.0.0.1:4180/ranna). The root URL redirects there. Use the inspector's **View fullscreen** button, or open [`/ranna?preview=off`](http://127.0.0.1:4180/ranna?preview=off) to start fullscreen.

The [sheet playground](http://127.0.0.1:4180/sheet-demo) remains a utility in the same preview wrapper. It shares `AppSheet` with venue details and appearance, using Reka UI 2.11.0. Partial height fits the content up to 70% of the app viewport, then scrolls inside. The playground lets you choose allowed heights, opening height, handle visibility, and short or long content. Reka's Drawer is currently labelled alpha.

```sh
npm run check
npm run build
```

`npm run check` runs formatting validation, TypeScript, and the regression tests. Use `npm run format` to apply the shared formatting rules. The build generates a static site in `dist/`; it does not publish the app or update the hosted demo.

The `dist/` override applies only to production builds. Development keeps Nuxt's disposable output separate, so restarting `npm run dev` preserves the generated site. QR generation is included in Vite's dependency pre-bundling to avoid a first-use reload when opening the pass.

## Structure

```text
app/
  app.vue                         DemoPreview around NuxtLayout and NuxtPage
  layouts/
    default.vue                   App shell: viewport, safe areas, theme, language
    screen.vue                    Full screen, header, and optional child layer
    sheet.vue                     Route adapter for AppSheet
    dialog.vue                    Centered dialog and backdrop
  components/
    AppSheet.vue                  Reusable sheet: sizing, gestures, focus, and motion
    DemoPreview.vue               Optional device chrome, sizing, and inspector
    DemoInspector.vue             Pager controls, theme, locale, routes, mount count
    PagerHome.vue                 Scanner and recovery while no pager is active
    PagerScanner.vue              Demo QR target or live camera, with detection validation
    PagerRecovery.vue             Compact branded button to resume the last removed pager
    PagerSignal.vue               Blue entry, orange waiting, green ready/picked-up signal
    PagerStatus.vue               Persistent signal/heading, status copy, and pickup/wait detail
    PagerActions.vue              State-specific actions and their whole-component fade
    AnimatedText.vue              Changing non-interactive text: character wave or quiet fade
    AppFade.vue                   Whole-component opacity transitions
    VenueRibbon.vue               Clickable venue identity above the pager
    VenueGlow.vue                 Ribbon-centered background effect and observer cleanup
    VenueMark.vue                 Venue logo with a monogram fallback
    OrderCard.vue                 Wide pager ticket with order number and pickup point
    PickupPass.vue                Pass summary and optional read-only item quantities
    PickupCode.vue                Scannable QR, animated marker, and matching code
    PickupComplete.vue            Collected order receipt and optional stars/comment form
    PreferencesScreen.vue         Shared preferences content and screen presentation
    AppearancePreferences.vue     Shared light/dark choices
    AboutRanna.vue                Shared product note and icon attribution
    DemoVenueControls.vue         Inspector-only venue presets and color editor
    AppButton.vue                 Shared action, icon, and navigation buttons
    AppIcon.vue                   Shared icon component
  composables/
    useLayer.ts                   Shared focus, covered state, and child transitions
    useLayerNavigation.ts         Close/back with a direct-link fallback
    useDemoPreferences.ts         Session appearance, scanner mode, and Arabic text motion
    usePager.ts                   Per-order pickup sessions, shared with the inspector
    usePagerTracking.ts           Active venue, last removed, and start/stop/restore actions
    useVenue.ts                   Selected venue, localized identity, contrast tokens
  data/venues.ts                  Fictional venue presets
  data/orders.ts                  Fictional per-venue order items
  data/icons.ts                   Typed names for the local UI icon sprite
  utils/venueColor.ts             Hex validation and accessible venue palettes
  utils/pickupSession.ts          Pure session actions, rating validation, and comment limit
  utils/pagerTracking.ts          Tracking reducer and persisted-state validation
  utils/pagerQr.ts                Known demo tokens and same-origin pager URL validation
  utils/textMotion.ts             Text segmentation, crop measurement, and frozen snapshots
  utils/braille.ts                Pickup-code presentation
  plugins/primevue.ts             PrimeVue setup and pass-through classes
  plugins/pager-storage.client.ts Restore and save local pager state once per app
  middleware/pager.global.ts      Keep scanner/pager routes aligned with active tracking
  assets/main.css                Layout and CSS transitions
  assets/controls.css            Customized shared control styles
  pages/
    sheet-demo.vue                Local-state AppSheet options and content examples
    index.vue                     Redirect to /ranna
    ranna.vue                     Persistent scanner background and child outlet
    ranna/
      scan.vue                    Compatibility redirect to the inline home scanner
      venue.vue                   Legacy venue-link redirect
      pickup.vue                  Legacy pickup-link redirect
      settings.vue                General preferences over home
      settings/
        appearance.vue            Sheet over general preferences
        about.vue                 Dialog over general preferences
      pager/
        [id].vue                  Active pager, replacing the scanner with a root fade
        [id]/
          venue.vue               Venue details sheet over pager
          pickup.vue              Pickup pass sheet over pager
          settings.vue            Pager preferences, including Stop tracking
          settings/
            appearance.vue        Sheet over pager preferences
            about.vue             Dialog over pager preferences
            stop.vue              Stop-tracking confirmation dialog
    lab/[...path].vue             Compatibility redirects for old lab URLs
i18n/
  i18n.config.ts                  Vue I18n fallback settings
  locales/en.json                 English: common and ranna messages
  locales/ar.json                 Arabic with the same message keys
tests/
  navigation.test.ts               Close/back and direct-link fallback checks
  pickup-session.test.ts           Action guards, one-time nudge, feedback lifecycle
  pager-tracking.test.ts           Tracking, recovery, and persisted-data validation
  pager-route.test.ts              URL identity, scanner guards, and recovery navigation
  pager-qr.test.ts                 Known QR tokens and strict same-origin path validation
  venue-color.test.ts              Input validation and color contrast checks
  demo-data.test.ts                Venue/order integrity and bilingual message contracts
  icons.test.ts                    Typed icon names match the SVG asset
  text-motion.test.ts              Arabic segmentation, RTL crop seams, ligatures, wrapping
  braille.test.ts                  Alphabet conversion and demo-code constraints
```

## Working on the app

- Pages compose the customer flow; layouts own route presentation. Keep the preview removable and demo controls out of customer components.
- Pickup rules live in the pure `pickupSession` reducer; tracking and storage validation live in `pagerTracking`. Components call `usePager()` and `usePagerTracking()` rather than changing stored records directly. Tracking removal never resets the pickup session.
- Components own their styles and browser lifecycles. Global CSS is reserved for resets, shared controls, and route-layer styling. Keep observers, listeners, and animation cleanup next to the effect that creates them.
- `AnimatedText` owns transition state; `textMotion` handles measurement and shaping. Ordinary changes use the wave; rapid changes preserve the tested catch-up behavior. Text inside controls stays ordinary text.
- Type icon names through `AppIcon`/`AppButton`; update the icon catalog with its SVG asset. Add translation keys in both locale files. Tests catch missing icons, messages, placeholders, and order data.
- Run `npm run format`, `npm run check`, and `npm run build` before handing off a change. For UI changes, also exercise English/Arabic, light/dark, rapid state changes, nested Back/close, and the fullscreen layout.

Prettier and `.editorconfig` define formatting consistently across Vue, TypeScript, CSS, JSON, and Markdown. The Node requirement is enforced by `package.json`; dependency versions are saved exactly. The directory keeps its existing `presentation-lab` name, while the package is named `ranna-lab`.

## Scan, track, and restore

The scanner at `/ranna` is available only when no pager is active. In the default **Demo** mode, tapping its QR target starts tracking the selected fictional venue in one action. No camera permission is requested. The pager replaces the scanner with a 220ms fade-in that gently settles from 1.035 scale to its normal size, and has no Back action to the scanner. Leaving the pager uses a 160ms fade. Tracking one pager is the customer flow; there is no list of active pagers. The old `/ranna/scan` URL redirects through the same scanner-or-active-pager guard.

The inspector’s **Scanner → Demo / Camera** control switches the same `PagerScanner` component to a live camera using `QrcodeStream` from `vue-qrcode-reader` 5.7.3. Only **Camera** mode requests the browser’s native camera permission. Camera access requires HTTPS or localhost. The component accepts `paused`; when home is covered or a pager is opening, its camera stream unmounts to release the hardware. Detection emits a validated venue ID, and `PagerHome` owns tracking and navigation. Changing scanner mode does not change saved tracking or order history.

`parsePagerQr(value, origin?)` in `utils/pagerQr.ts` accepts the exact fictional tokens `ranna:demo:north` and `ranna:demo:field`, or an exact same-origin `/ranna/pager/:id` URL for a known venue. Query strings, fragments, credentials, unknown venues, external origins, and extra path segments are rejected. The reader and its locally bundled decoder load only after selecting Camera mode; demo scanning does not load or start the camera reader.

The active pager lives at `/ranna/pager/:id`, where the URL identifies the venue. Its Preferences screen includes **Stop tracking**. Confirmation returns to the scanner without cancelling an order or clearing its stage, one-time nudge, or feedback. Beneath the scanner, **Looking for your pager?** shows a compact `PagerRecovery` card with the venue and order number. **Track again** resumes that session and clears the recovery card. Only the most recently removed pager is offered here; stopping a later pager replaces that recovery entry.

`usePagerTracking()` exposes `activeVenue`, `lastRemovedVenue`, `isTracked`, `startTracking(id)`, `stopTracking(id)`, and `restoreLastRemoved()`. The restore action returns the restored venue ID or `null`; it does nothing while another pager is active. UI pages own navigation:

```ts
import type { VenueId } from '~/data/venues'

const { startTracking, restoreLastRemoved } = usePagerTracking()
const router = useRouter()

function trackDemo(id: VenueId) {
  startTracking(id)
  return router.replace({ name: 'ranna-pager-id', params: { id } })
}

function restorePager() {
  const id = restoreLastRemoved()
  if (id) return router.replace({ name: 'ranna-pager-id', params: { id } })
}
```

`plugins/pager-storage.client.ts` restores state before route middleware runs, then saves through one app-level watcher to `localStorage['ranna-pagers-v2']`. It persists active tracking, recovery, pickup sessions, and selected venue; the reader rejects malformed or unknown data. If v2 is absent, the plugin migrates `ranna-pagers-v1`: the previously selected tracked venue becomes active, otherwise the last tracked venue does. All valid pickup sessions remain, and recovery remains unless it points to the active venue. The old key is retired only after the validated v2 record is saved. If storage is unavailable, the same flow works for the current visit. To start completely fresh, remove both pager-storage keys and reload; **Reset order** in the inspector only resets the selected pickup session.

`middleware/pager.global.ts` keeps the URL aligned with tracking. While a pager is active, direct scanner URLs, refreshes, and browser Back return to that pager instead of exposing another scan. A stale pager URL redirects to the current active pager, or to the scanner if tracking has stopped, without silently resuming a different session. General-preference URLs also map to the corresponding active-pager preference page while tracking. Scan and **Track again** are the customer entry points. The inspector can explicitly switch the fictional venue for previewing.

General preferences live under `/ranna/settings`; pager preferences live under `/ranna/pager/:id/settings`. Both use the same components, but their thin route wrappers preserve the appropriate background and Back destination. Only pager preferences exposes removal.

## Venue branding

Ranna owns the app header, navigation, type, controls, pager signal, and order-number card. The venue owns the ribbon and venue details. Venue colors do not recolor the app shell or the blue/orange/green status signal.

`app/data/venues.ts` is the venue contract: bilingual name, branch, address, brand color, monogram, and optional logo asset URL. `useVenue()` shares the selected preset and per-venue color overrides independently of the preview wrapper. `identity` follows Nuxt i18n; `style` derives local CSS custom properties with readable foregrounds and a border that adapts to the light or dark canvas. Arbitrary opaque 3- or 6-digit hex colors are accepted; invalid edits preserve the last valid color.

```vue
<VenueRibbon />
```

The ribbon opens `/ranna/pager/:id/venue` using the existing sheet layout. North Coffee and Field Matcha are fictional presets; switch them or edit their color in the inspector, including while a sheet is open. Changing the color needs no extra theme provider or page remount. Switching the inspector venue updates the pager route to that venue.

## Main-screen order card

`OrderCard` follows the wide main-screen card in the [Forma preview](https://forma-pocket-demo.mohalobaidi.chatgpt.site/): a 49px order number at the leading edge, pickup counter at the trailing edge, and a perforated footer. It sits near the bottom of the main screen with the pager status above. The footer opens the pickup pass when `to` is supplied; without a destination it shows the pickup instruction.

```vue
<OrderCard
  :number="order.number"
  :pickup="t('ranna.counter')"
  :to="{ name: 'ranna-pager-id-pickup', params: { id: route.params.id } }"
/>
```

`number` and `pickup` are required strings; `to` is an optional Vue Router destination. The page supplies the identifier from `usePager()` and the translated counter. The neutral number, card dimensions, and lower-screen placement stay the same across active states. Logical spacing mirrors the two columns in Arabic while the identifier remains LTR-isolated. The card adds no motion. A reserved action row below the main ticket shows **Track my order**, **Ask for an update**, or **I’ve picked it up** for entry, waiting, and ready respectively. These actions belong to the main pager, not the pickup-pass sheet.

`usePager()` owns each fictional order's session, keyed by its unique pickup code. `state` is a writable computed over the session's `'entry' | 'waiting' | 'ready' | 'collected'` stage, so the inspector and app share one source of truth. `nudge()` succeeds once while waiting and leaves a disabled **Update requested** button; `collect()` only transitions ready to collected. Changing venue, opening a sheet, changing theme, or changing language preserves that order's history. The inspector can preview all four stages; **Reset order** clears only the selected order and returns it to waiting.

The collected state replaces the main ticket with `PickupComplete` below `PagerStatus`'s persistent copy: a compact green signal, order summary, five-star rating, optional comment, and **Not now**. `PagerStatus` stays mounted and keeps the same rings and checkmark, moving and scaling them into the collected position over 320ms. This measures the old and new layout only at the collected boundary and animates a transform; preview scaling is accounted for, interrupted moves continue from their visible position, and reduced motion skips it. It also owns the picked-up and feedback confirmation text, so one heading survives ready → collected → feedback. `PickupComplete` supplies only the receipt and form, including when composed in the pass sheet. The form uses Reka radio controls for arrow-key/RTL support and PrimeVue controls. `setRating`, `setComment`, `submitFeedback`, and `skipFeedback` guard the session: collection is required, ratings must be 1–5, comments are capped at 500 characters, and submitted or skipped feedback is locked. This is local demo state only; neither nudges nor feedback contact staff or a service. The local pager store preserves it across refreshes, removal, and restoration.

## Pickup pass

`/ranna/pager/:id/pickup` uses the existing sheet layout, preserving the pager underneath. The page supplies one `PickupPass`: the order number, status, and counter lead, with `PickupCode` alongside. The order is on the left in English and the layout mirrors in Arabic. The order details set the overview height. CSS size containment lets the QR and its four-character Braille fallback fit that height without JavaScript measurement; the square frame uses the space above the 20px fallback and its 6px gap, capped by the 112px code column. Optional receipt rows such as `Flat white ×2` follow the combined overview. The 60px order number and 13px receipt rows share a system monospace stack, with 6px vertical row padding; Arabic item names fall back to Noto Sans Arabic for connected shaping. Code labels and item column headings remain available to assistive technology without adding visible instructions.

```vue
<PickupPass
  v-if="state !== 'collected'"
  :code="order.pickupCode"
  :number="order.number"
  :pickup="t('ranna.counter')"
  :state="state"
  :items="order.items"
/>
```

`items?: readonly OrderItem[]` accepts `{ id: string; name: string; quantity: number }`, with a unique row ID, display-ready name, and a positive integer quantity. Omit `items` or pass `[]` to hide the entire items section. There are no prices or editing controls. The component owns no fixture data or route behavior; names are translated before they reach it, and quantities use Nuxt i18n number formatting.

`usePager()` assembles fictional order data from `data/orders.ts` for the selected venue. The inspector's **With items / Number only** control demonstrates the optional data without putting demo controls into the customer UI. The shared sheet fits its content up to 70%, then scrolls; its handle can expand it further. The shared layout owns the sheet's opening, closing, and sizing.

`PickupCode` accepts a single nonempty `code` string containing letters A–Z only. The demo supplies four letters. [uqr](https://github.com/unjs/uqr) renders those exact letters as a local SVG QR with a transparent background. The modules are black in light mode and invert to white under the app's dark theme. Its inner clear border is two modules, with a separate 8px inset inside the animated frame. This compact border is a deliberate demo styling choice below the usual four-module quiet zone; screenshot decoding is checked in both themes. The visible fallback maps each letter to its uncontracted six-dot Braille cell; assistive text exposes the original letters individually. `utils/braille.ts` uses the [BANA alphabet](https://www.brailleauthority.org/sites/default/files/2023-09/alphabet.pdf) and rejects invalid identifiers rather than silently changing them. Both representations remain stable while scanning or reading. The track and its CSS-only moving stroke use a consistent 2.5px non-scaling width. The moving stroke has faded ends, with no motion over the QR. Reduced motion stops the stroke. This is a visual live-screen cue, not screenshot prevention or real verification: the demo codes are fixed fictional values, and there is no scanner service, expiration, or server-side redemption.

## Shared controls

The app uses **PrimeVue 4.5.5 in unstyled mode** for shared controls. Components are imported individually where used; there is no global component registration or theme package. `app/plugins/primevue.ts` enables unstyled mode, disables ripple effects, and assigns shared classes through PrimeVue's pass-through API. `app/assets/controls.css` defines their appearance, focus states, and disabled states for both languages and themes. The inspector uses Reka radio groups for exclusive choices and arrow-key navigation.

`AppButton` wraps PrimeVue Button with a small application API:

| Prop      | Values                                     | Purpose                                           |
| --------- | ------------------------------------------ | ------------------------------------------------- |
| `variant` | `primary` (default), `icon`, `row`, `text` | Selects the shared control style.                 |
| `to`      | Vue Router destination                     | Renders a Nuxt link; omitted for a button action. |
| `icon`    | SVG sprite name                            | Adds a consistently sized icon.                   |
| `tone`    | `surface` (default), `contrast`            | Chooses the background for icon buttons.          |

```vue
<AppButton
  to="/ranna/settings"
  variant="icon"
  icon="settings-2"
  :aria-label="t('common.settings')"
/>

<AppButton to="/ranna/settings" variant="row" icon="settings-2">
  {{ t('common.settings') }}
</AppButton>
```

Standard attributes and click handlers pass through to the rendered control. Icon-only actions need an accessible label. Icons are SVGs centered within a fixed hit area, so changing to the Arabic typeface cannot shift an icon with the text baseline. Form controls retain their native input behavior and labels; their internal parts share centrally configured classes.

## How the layers work

**Nested routes preserve the background. Explicit layouts choose the presentation.**

`app.vue` wraps Nuxt's standard layout and page outlets in the existing preview:

```vue
<DemoPreview>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</DemoPreview>
```

`layouts/default.vue` is the app shell. It owns the app's theme, language, safe-area padding, and positioned viewport, filling the available space. All pages use this default global layout. The page layers work independently of the preview tooling.

To remove all preview tooling, keep only the inner app:

```vue
<NuxtLayout>
  <NuxtPage />
</NuxtLayout>
```

`DemoPreview` owns the device chrome, fixed preview size, scaling, inspector placement, and fullscreen toggle. Its padding simulates the status-bar and home-indicator space; the app uses real safe-area insets when fullscreen. The fullscreen toggle changes wrapper styles and retains one slot subtree, so it does not remount the page or close an open sheet. A small **Show inspector** button restores the framed view. Removing the wrapper entirely leaves the app filling the browser viewport with no preview controls.

`DemoInspector` edits the same state the app uses: `usePager()` for pager state, `useVenue()` for venue identity, `useDemoPreferences()` for appearance, and Nuxt i18n for locale. It also shows the route stack and pager mount count. The wrapper does not provide or initialize required app state, so the app works without it. On narrow screens, the inspector sits below the phone rather than disappearing. Both preview components keep their styles scoped locally.

The wrapper uses Reka's public `FocusScope` while interacting with the inspector, pausing the sheet's focus trap without changing the customer app. Returning to the device resumes the trap. `AppSheet` uses a viewport-local backdrop rather than locking the whole document; interactions and Escape outside its viewport do not dismiss it. This keeps color inputs and preview controls usable while a sheet stays open.

At `/ranna/pager/north/settings/appearance`, Nuxt matches four pages:

```text
Scanner (covered, paused)
└── Pager (base replacement)
    └── Preferences (screen)
        └── Appearance (sheet)
```

The scanner background, Pager, and Preferences remain mounted while the sheet opens. The scanner stays inert and paused while tracking, releasing any camera stream. Opening and closing pager children keeps the pager’s mount count unchanged. Stopping tracking removes the entire pager subtree with a 160ms fade, including any open preferences/dialog, then enables the scanner. Tracking again mounts the pager with its preserved session. General preferences is available without a pager and uses the shorter Scanner → Preferences → Appearance stack.

The root `<NuxtLayout>` selects the global app shell. Inside that shell, each page explicitly renders its own `screen`, `sheet`, or `dialog` layout. No `layout` metadata is needed for these pages: Nuxt keeps using `default` while the nested pages change. A future `definePageMeta({ layout: 'custom' })` would choose a different global shell; `layout: false` would disable the shell. Neither setting chooses an individual layer's presentation.

The page passes its own Nuxt route name through `page`, for example `ranna-settings`. The shared `useLayer` composable compares that name with the current route to know whether a child is covering it. It does not inspect rendered components or infer a parent URL from route records. The screen layout exposes `covered` through its default slot; Ranna passes that value to `PagerStatus.paused` while a child layer is above it, pausing both the signal and live status announcements.

Home and Pager declare child outlets in their layout’s `children` slot. Preferences wrappers forward the same contract through `PreferencesScreen`:

```vue
<PreferencesScreen page="ranna-pager-id-settings" :parent="{ name: 'ranna-pager-id' }" pager>
  <template #children="{ transition }">
    <NuxtPage :transition="transition" />
  </template>
</PreferencesScreen>
```

The pager route animates its entire root with a 220ms fade-in and slight zoom-out on entry, and a 160ms opacity fade on exit and omits the screen layout’s `parent`, so it has no sideways push or Back control. Its child preferences screens, sheets, and dialogs retain their existing transitions. Reduced motion skips the root fade.

The layout places the child outlet outside its own inert panel. Shared behavior keeps covered content inert until the child finishes leaving and restores focus afterward. Screens and dialogs use `useLayer` for their keyboard behavior. Sheets use Reka's focus handling inside `AppSheet`. CSS owns motion and respects reduced-motion preferences and RTL.

`parent` is an explicit Vue Router destination. Close uses browser Back when the previous entry is that parent; otherwise it replaces the URL with the resolved destination. With no active pager, opening `/ranna/settings/appearance` directly reconstructs its background and closes safely to `/ranna/settings`. While tracking, the route guard maps these general-preference URLs to the equivalent active-pager routes. About closes to its owning Preferences screen. Dynamic parent routes can use named destinations with explicit `params`.

Old `/lab` URLs redirect to the corresponding Ranna home or preferences route; `/lab/about` redirects to `/ranna/settings/about`. Legacy `/ranna/pickup` and `/ranna/venue` links resolve to the active pager’s sheet when available and otherwise return to the scanner. Compatibility links never start tracking by themselves; they are entry points into this app, not a second application.

## Add a sheet

For temporary UI that does not need a URL, use the component directly inside the app's positioned viewport:

```vue
<script setup lang="ts">
const open = ref(false)
</script>

<template>
  <AppButton @click="open = true">Open sheet</AppButton>
  <AppSheet v-model:open="open" title="Your pickup">
    <p class="body-copy">Your order is ready at the counter.</p>
    <AppButton @click="open = false">Got it</AppButton>
  </AppSheet>
</template>
```

`title` is required; `description` and `close-label` are optional. Supply a translated `close-label` when needed. The component inherits the app shell's theme and direction and stays within its viewport, including inside `DemoPreview`.

| Option    | Default               | Behavior                                                                                                  |
| --------- | --------------------- | --------------------------------------------------------------------------------------------------------- |
| `snaps`   | `['partial', 'full']` | Allowed heights for gestures and controls. Partial fits content up to 70%; full fills the app viewport.   |
| `initial` | First allowed height  | Opening height, applied each time the sheet opens. Changing it while open does not move the sheet.        |
| `handle`  | `true`                | Shows the top drag handle. `false` removes the handle and disables sheet dragging; content still scrolls. |

`initial` must be an allowed height; otherwise the first allowed height is used. An empty `snaps` array falls back to `['partial']`. Close buttons, Escape, and route navigation remain available with the handle hidden.

```vue
<!-- Content-sized sheet that cannot expand to full height -->
<AppSheet v-model:open="open" title="Quick details" :snaps="['partial']">
  <p class="body-copy">A short summary.</p>
</AppSheet>

<!-- Full-height sheet without dragging -->
<AppSheet v-model:open="open" title="Details" :snaps="['full']" :handle="false">
  <p class="body-copy">Content can scroll within the full-height sheet.</p>
</AppSheet>

<!-- Both heights available, initially full -->
<AppSheet v-model:open="open" title="Your pickup" initial="full">
  <p class="body-copy">The handle can return this sheet to partial height.</p>
</AppSheet>
```

The default slot exposes `close`, `expand`, `collapse`, `expanded`, `partialPercent`, `canExpand`, and `canCollapse`. The optional `status` slot exposes the same values for demo controls. `expand()` and `collapse()` leave the sheet unchanged when their height is not in `snaps`; use the capability flags to disable unavailable controls. Ordinary consumers only need their content.

For a shareable URL with browser Back support, use the sheet layout instead.

Create `app/pages/ranna/settings/notifications.vue`:

```vue
<template>
  <div class="route-page">
    <NuxtLayout
      name="sheet"
      page="ranna-settings-notifications"
      title="Notifications"
      :parent="{ name: 'ranna-settings' }"
    >
      <p class="body-copy">Your notification preferences go here.</p>
    </NuxtLayout>
  </div>
</template>
```

Link to it from Settings:

```vue
<AppButton :to="{ name: 'ranna-settings-notifications' }" variant="row">
  Notifications
</AppButton>
```

The layout supplies the title and translated close control to `AppSheet`. Its leave guard awaits the component's actual close completion before letting navigation remove the page, including browser Back and actions that call `useLayerNavigation().close(parent)`. There are no duration-based navigation timers. The parent outlet retains its completion hooks to restore the underlying page, but does not apply a second sheet animation. Use `name="screen"` or `name="dialog"` to change the presentation. The outer `route-page` element gives Nuxt a stable transition root. For a translated title, add the key to both files in `i18n/locales/`, get `t` from `useI18n()`, and pass a namespaced key such as `:title="t('ranna.notifications')"`.

The same sheet options pass through the route layout:

```vue
<NuxtLayout
  name="sheet"
  page="ranna-pager-id-venue"
  title="Your venue"
  :parent="{ name: 'ranna-pager-id' }"
  :snaps="['partial', 'full']"
  initial="full"
  :handle="false"
>
  <p class="body-copy">A full-height opening with both heights available to controls.</p>
</NuxtLayout>
```

The route adapter uses Reka's `trap-focus` mode because the existing layer system already makes the underlying panels inert. This lets it suspend focus trapping while a child route is above it without remounting the sheet's content. Direct component use defaults to Reka's full modal mode. `AppSheet` does not import the router or demo preferences; routing and translation stay in the layout/page.

If a new page has children of its own, give it the same explicit `children` slot and nested `<NuxtPage>`. Add new direct-link URLs to `nitro.prerender.routes` in `nuxt.config.ts` when generating the static build.

A sheet belongs to its route parent. Opening the same sheet above arbitrary unrelated screens would need a separate background-route design; this demo deliberately keeps those relationships explicit.

## Languages

Nuxt i18n owns translations and the selected locale. Messages are grouped into `common` and `ranna` in `i18n/locales/en.json` and `ar.json`. Use the module directly:

```vue
<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()
</script>

<template>
  <p>{{ t('ranna.states.waiting.title') }}</p>
  <button
    v-for="language in locales"
    :key="language.code"
    :lang="language.language"
    :aria-pressed="locale === language.code"
    @click="setLocale(language.code)"
    >{{ language.name }}</button
  >
</template>
```

English is the default and fallback. Browser-language detection is disabled, preserving explicit session-only language selection. `strategy: 'no_prefix'` keeps current URLs and route names stable, so changing language updates the mounted page without creating a navigation transition. Call `setLocale()` instead of assigning to `locale` so the module loads the selected messages.

Locale metadata in `nuxt.config.ts` supplies `language` and `dir`. Both the document attributes and global shell read `localeProperties`; the shell applies Arabic typography. There is no writable RTL flag, custom translator, or locale-based page key. Changing language keeps the pager and any open sheet mounted. Direction-aware CSS uses `:dir(rtl)` so the explicitly English inspector and sheet playground keep their own text and icon direction.

## Ranna, one component at a time

`PagerStatus` combines the signal, label, headline, supporting copy, and wait/pickup detail. It owns translation through Nuxt i18n; the page owns pager state, navigation, and the primary action:

```vue
<PagerStatus :state="state" :paused="covered" />
```

- `state`: `'entry' | 'waiting' | 'ready' | 'collected'` (required).
- `paused`: stops the waiting loop at its current phase and suspends live announcements while covered; defaults to `false`.

The visible copy is a single atomic status region. Minimum text-row heights keep the active stages steady at the 440px preview width in English and Arabic; rows can still grow at smaller widths or larger text sizes. Ready-state directions interpolate the shared pickup-counter translation. Optional `feedback` (default `'pending'`) and `venue` props supply the collected/feedback copy. The default slot adds content below the persistent copy; the main page supplies `PickupComplete` there. `focus()` targets the stable heading after pickup, and feedback completion restores focus there without taking it from a covering layer.

### Changing components

`AppFade` fades a complete component or control as one unit: 200ms in and 140ms out, using opacity only. It does not animate on initial mount. Keep the wrapper mounted and give it one direct conditional or keyed child:

```vue
<AppFade :paused="covered">
  <section v-if="state === 'collected'">Collected content</section>
</AppFade>

<AppFade :paused="covered">
  <div :key="state">
    <!-- The current action, including its icon and ordinary button text. -->
  </div>
</AppFade>
```

Key by the state that replaces the component, never by live field values such as a rating or comment. Editing those values should keep the same controls mounted. Ranna uses this for the pager action, the collected section, and the feedback form's departure; button labels never use `AnimatedText`.

The wrapper supplies a full-width positioning container. Entering and leaving children overlap, with the departing child removed from layout immediately and made inert so it cannot receive input while fading. The page still owns placement and focus: the pager footer keeps its bottom anchor during collection, and the persistent result heading receives focus after pickup or feedback submission. `paused` bypasses the fade while a page is covered; the system's reduced-motion preference also disables it. There is no animation dependency or JavaScript timing loop.

### Changing status text

`AnimatedText` is for changing **non-interactive** text that deserves attention. Keep the semantic heading/paragraph outside it; buttons, links, inputs, and their labels use ordinary text.

```vue
<h2>
  <AnimatedText :text="title" :locale="locale" :paused="covered" />
</h2>
<p>
  <AnimatedText :text="description" :locale="locale" :paused="covered" variant="fade" />
</p>
```

The default character wave uses 350ms per letter, a 20ms stagger, 6px upward movement, and 5px blur. It starts only when the text changes. The `fade` variant changes supporting copy quietly. The component inherits typography and direction; `locale` prevents a language change from animating old-language text into the new layout. `paused` settles immediately while the page is covered.

Use `by="word"` for complete words (60ms stagger, punctuation attached); `by="character"` is the reusable component's default. Ranna defaults Arabic headings to words and keeps English character-by-character. When Arabic is selected, the inspector's **Arabic text motion → Words / Letters** control switches the shared session preference. Changing that setting settles any active transition and applies to the next text change. The preference initializes independently of the preview wrapper, so fullscreen and removing the inspector preserve the Arabic default.

Native CSS runs the motion with fractional `translate3d`, opacity, and blur. The component measures the complete, already-shaped text once per swap with `Range` and `Intl.Segmenter`, then moves temporary clipped copies of that text. Arabic is never re-shaped as isolated letters; combining marks stay with their base, and shared ligature boxes move together. Shared horizontal crop edges align to the screen's pixel grid and overlap by one device pixel, accounting for preview scaling and pixel density. The original text positions and spacing stay unchanged; the overlap closes thin compositing seams in joined strokes. This avoids animated inline `top` positions, which made movement look stepped. The approved blur softens the brief misalignment of joining strokes during movement.

Only the current text is exposed to assistive technology; the containing status region owns announcements. There is no animation library, per-frame loop, or cleanup timer. Normal text stays mounted throughout; the glyph layers blend into it during the final 100ms of the incoming wave, with no added hold. Cleanup awaits the actual CSS animation completions, so removing the already-invisible layers cannot cause a late switch back to normal rendering. The stagger spread is capped at 320ms, and text longer than 40 graphemes uses a single fade. Hidden tabs, resize/font changes, and reduced-motion preferences settle immediately. The compact picked-up layout also bridges the heading's position with a single transform, alongside the existing signal movement.

Rapid text changes use a 140ms catch-up fade. The first interruption freezes the visible text composition, including its current blur, position, and opacity, into one hidden-from-accessibility snapshot. New values replace the incoming text immediately without restarting that fade or cloning another snapshot. Continued bursts use short fades; after 730ms between changes, the usual word/character wave resumes. The quiet interval is checked from timestamps, so it never delays state updates. Snapshots come only from the component's escaped text DOM, never caller-supplied HTML, and disappear when the actual animation finishes. Language, mode, and paused changes clear them immediately. This behavior is internal to `AnimatedText`; its API and callers stay unchanged.

`PagerSignal` remains the decorative drawing component inside `PagerStatus`, with the same `state` and `paused` props. It can also be used directly where the consumer supplies visible status text.

Entry is compact blue, waiting breathes in orange, and ready and collected are static green. The three rings and icons stay mounted within a signal instance. CSS owns the 3.2-second loop, color changes, and icon crossfade; a 320ms Web Animations handoff bridges the current ring positions when state changes, including interrupted changes. There are no animation timers or frame loops. Reduced motion keeps the resting shapes.

It inherits the existing `.dark` theme, has no routing or session-state dependencies, and uses the local Solar sprite. Source and license are in `public/SOLAR-SOURCE.md` and `public/SOLAR-LICENSE.txt`; visible Solar and Hugeicons attribution lives in the About dialog. Keep that attribution when redistributing.
