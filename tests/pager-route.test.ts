import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { afterEach, test } from 'node:test'
import { computed, ref } from 'vue'
import type { VenueId } from '../app/data/venues'
import {
  createPagerTracking,
  readStoredPagers,
  type PagerTracking,
} from '../app/utils/pagerTracking.ts'

type Destination = {
  name: string
  matched: { name: string }[]
  params: { id?: unknown }
  query?: Record<string, string>
}
type Redirect = {
  target: { name: string; params?: { id: VenueId }; query?: Record<string, string> }
  options: { replace: boolean }
}
type Guard = (to: Destination) => Redirect | undefined

const globals = globalThis as typeof globalThis & {
  defineNuxtRouteMiddleware?: (guard: Guard) => Guard
  usePagerTracking?: () => unknown
  useState?: (key: string, initial?: () => unknown) => unknown
  computed?: typeof computed
  navigateTo?: (target: Redirect['target'], options: Redirect['options']) => Redirect
}

// Exercise the real guard and store with only Nuxt's injected dependencies supplied.
const aliases = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(
      specifier.startsWith('~/')
        ? new URL(`../app/${specifier.slice(2)}.ts`, import.meta.url).href
        : specifier,
      context,
    )
  },
})
globals.defineNuxtRouteMiddleware = (guard) => guard
const { default: pagerGuard } = await import('../app/middleware/pager.global.ts')
const { usePagerTracking } = await import('../app/composables/usePagerTracking.ts')
const guard = pagerGuard as Guard
aliases.deregister()
delete globals.defineNuxtRouteMiddleware

afterEach(() => {
  delete globals.usePagerTracking
  delete globals.useState
  delete globals.computed
  delete globals.navigateTo
})

function environment(initialTracking: PagerTracking, selected: VenueId = 'field') {
  const tracking = ref(initialTracking)
  const selectedId = ref(selected)
  const redirects: Redirect[] = []
  globals.computed = computed
  globals.usePagerTracking = usePagerTracking
  globals.useState = (key) => {
    if (key === 'pager-tracking') return tracking
    assert.equal(key, 'venue-id')
    return selectedId
  }
  globals.navigateTo = (target, options) => {
    const redirect = { target, options }
    redirects.push(redirect)
    return redirect
  }
  return { tracking, selectedId, redirects, store: usePagerTracking() }
}

function homeRoute(name = 'ranna', query?: Record<string, string>): Destination {
  return { name, matched: [{ name: 'ranna' }, { name }], params: {}, query }
}

function pagerRoute(id: unknown, child?: string): Destination {
  const name = child ? `ranna-pager-id-${child}` : 'ranna-pager-id'
  return {
    name,
    matched: [{ name: 'ranna' }, { name: 'ranna-pager-id' }, { name }],
    params: { id },
  }
}

const homeRedirect = { target: { name: 'ranna' }, options: { replace: true } }
const activeRedirect = {
  target: { name: 'ranna-pager-id', params: { id: 'north' } },
  options: { replace: true },
}

test('the scanner and its preferences are available only when there is no active pager', () => {
  const app = environment(createPagerTracking())
  for (const name of ['ranna', 'ranna-scan', 'ranna-settings', 'ranna-settings-appearance']) {
    assert.equal(guard(homeRoute(name)), undefined)
  }
  app.store.startTracking('north')
  for (const name of ['ranna', 'ranna-scan']) {
    assert.deepEqual(guard(homeRoute(name)), activeRedirect)
  }
  assert.equal(guard(pagerRoute('north')), undefined)
})

test('sheet playground and unrelated routes do not consult pager tracking', () => {
  for (const name of ['sheet-demo', 'index', 'other']) {
    assert.equal(guard({ name, matched: [{ name }], params: {} }), undefined)
  }
})

test('the active pager URL selects its venue despite a stale inspector selection', () => {
  const app = environment({ active: 'north', lastRemoved: null }, 'field')
  assert.equal(guard(pagerRoute('north')), undefined)
  assert.equal(app.selectedId.value, 'north')
  assert.equal(app.store.isTracked.value, true)
  assert.equal(guard(pagerRoute('north', 'pickup')), undefined)
  assert.deepEqual(app.redirects, [])
})

test('unknown or inactive pager URLs cannot revive old orders or replace the active pager', () => {
  const app = environment({ active: 'north', lastRemoved: 'field' }, 'north')
  for (const id of ['field', 'missing', undefined, ['north']]) {
    assert.deepEqual(guard(pagerRoute(id, 'settings-stop')), activeRedirect)
  }
  assert.deepEqual(app.tracking.value, { active: 'north', lastRemoved: 'field' })
  app.store.stopTracking('north')
  for (const id of ['north', 'field', 'missing']) {
    assert.deepEqual(guard(pagerRoute(id)), homeRedirect)
  }
})

test('active home and global preferences redirects preserve fullscreen query and the settings destination', () => {
  environment({ active: 'north', lastRemoved: null })
  assert.deepEqual(guard(homeRoute('ranna', { preview: 'off' })), {
    target: { ...activeRedirect.target, query: { preview: 'off' } },
    options: { replace: true },
  })
  for (const suffix of ['settings', 'settings-appearance', 'settings-about']) {
    assert.deepEqual(guard(homeRoute(`ranna-${suffix}`, { preview: 'off' })), {
      target: {
        name: `ranna-pager-id-${suffix}`,
        params: { id: 'north' },
        query: { preview: 'off' },
      },
      options: { replace: true },
    })
    assert.equal(guard(pagerRoute('north', suffix)), undefined)
  }
  const stale = { ...pagerRoute('field'), query: { preview: 'off' } }
  assert.deepEqual(guard(stale), {
    target: { ...activeRedirect.target, query: { preview: 'off' } },
    options: { replace: true },
  })
})

test('stop returns to the scanner; restore activates the pager and blocks browser Back to the scanner', () => {
  const app = environment({ active: 'north', lastRemoved: null }, 'north')
  assert.equal(guard(pagerRoute('north', 'settings-stop')), undefined)
  assert.equal(app.store.stopTracking('north'), true)
  assert.equal(guard(homeRoute()), undefined)
  assert.equal(app.store.activeVenue.value, null)
  assert.equal(app.store.lastRemovedVenue.value?.id, 'north')
  for (const child of [undefined, 'pickup', 'settings', 'settings-stop']) {
    assert.deepEqual(guard(pagerRoute('north', child)), homeRedirect)
  }
  assert.equal(app.store.restoreLastRemoved(), 'north')
  assert.equal(app.store.restoreLastRemoved(), null)
  assert.equal(guard(pagerRoute('north')), undefined)
  assert.deepEqual(guard(homeRoute()), activeRedirect)
  assert.deepEqual(app.tracking.value, { active: 'north', lastRemoved: null })
})

test('refreshing home resumes the persisted active pager without a redirect loop', () => {
  const saved = readStoredPagers(
    JSON.stringify({
      version: 2,
      tracking: { active: 'north', lastRemoved: 'field' },
      selectedVenue: 'field',
    }),
  )
  const app = environment(saved.tracking, saved.selectedVenue)
  assert.deepEqual(guard(homeRoute()), activeRedirect)
  assert.equal(guard(pagerRoute('north')), undefined)
  assert.equal(app.selectedId.value, 'north')
  app.store.stopTracking('north')
  const refreshed = readStoredPagers(
    JSON.stringify({
      ...saved,
      tracking: app.tracking.value,
    }),
  )
  app.tracking.value = refreshed.tracking
  assert.equal(guard(homeRoute()), undefined)
  assert.deepEqual(guard(pagerRoute('north', 'settings-appearance')), homeRedirect)
})
