import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { useLayerNavigation } from '../app/composables/useLayerNavigation.ts'

// Supply Nuxt's two injected dependencies while exercising the real composable.
const globals = globalThis as typeof globalThis & {
  useRouter?: () => unknown
  useState?: () => unknown
}
afterEach(() => {
  delete globals.useRouter
  delete globals.useState
})

function navigation(
  previous: unknown,
  target = '/lab',
  fail: false | 'resolve' | 'replace' | 'back' = false,
) {
  const closing = { value: false }
  const calls: unknown[][] = []
  const completionListeners = new Set<() => void>()
  const errorListeners = new Set<() => void>()
  globals.useState = () => closing
  globals.useRouter = () => ({
    options: { history: { state: { back: previous } } },
    resolve(parent: unknown) {
      calls.push(['resolve', parent])
      if (fail === 'resolve') throw new Error('Unknown parent route')
      return { fullPath: target }
    },
    afterEach(callback: () => void) {
      completionListeners.add(callback)
      return () => completionListeners.delete(callback)
    },
    onError(callback: () => void) {
      errorListeners.add(callback)
      return () => errorListeners.delete(callback)
    },
    back() {
      calls.push(['back'])
      if (fail === 'back') throw new Error('Back navigation failed')
    },
    async replace(path: string) {
      calls.push(['replace', path])
      if (fail === 'replace') throw new Error('Navigation failed')
    },
  })
  return {
    ...useLayerNavigation(),
    closing,
    calls,
    settle: () => [...completionListeners].forEach((callback) => callback()),
    error: () => [...errorListeners].forEach((callback) => callback()),
    listenerCount: () => completionListeners.size + errorListeners.size,
  }
}

test('closing a directly opened layer replaces the URL with its named parent', async () => {
  const nav = navigation(null, '/venues/42/settings')
  const parent = { name: 'venue-settings', params: { id: '42' } }
  await nav.close(parent)
  assert.deepEqual(nav.calls, [
    ['resolve', parent],
    ['replace', '/venues/42/settings'],
  ])
  assert.equal(nav.closing.value, false)
})

test('Back is used only when history points to the resolved parent', async () => {
  const nav = navigation('/lab/settings?tab=general', '/lab/settings?tab=general')
  await nav.close({ name: 'lab-settings', query: { tab: 'general' } })
  assert.deepEqual(nav.calls.at(-1), ['back'])
  assert.equal(nav.closing.value, true)
  nav.settle()
  assert.equal(nav.closing.value, false)
  assert.equal(nav.listenerCount(), 0)
})

test('repeated close presses cannot skip two levels while Back is pending', async () => {
  const nav = navigation('/lab')
  await nav.close({ name: 'lab' })
  await nav.close({ name: 'lab' })
  assert.equal(nav.calls.filter((call) => call[0] === 'back').length, 1)
  nav.settle()
  await nav.close({ name: 'lab' })
  assert.equal(nav.calls.filter((call) => call[0] === 'back').length, 2)
})

test('unrelated history stays in the app and a failed replace releases the close guard', async () => {
  const nav = navigation('/unrelated', '/lab', 'replace')
  await assert.rejects(nav.close({ name: 'lab' }), /Navigation failed/)
  assert.deepEqual(nav.calls.at(-1), ['replace', '/lab'])
  assert.equal(nav.closing.value, false)
})

test('an invalid named parent cannot leave navigation locked', async () => {
  const nav = navigation(null, '/lab', 'resolve')
  await assert.rejects(nav.close({ name: 'missing-parent' }), /Unknown parent route/)
  assert.equal(nav.closing.value, false)
})

test('a Back navigation error releases the close guard and its temporary listeners', async () => {
  const nav = navigation('/lab')
  await nav.close({ name: 'lab' })
  assert.equal(nav.closing.value, true)
  assert.equal(nav.listenerCount(), 2)

  nav.error()
  assert.equal(nav.closing.value, false)
  assert.equal(nav.listenerCount(), 0)

  await nav.close({ name: 'lab' })
  assert.equal(nav.calls.filter((call) => call[0] === 'back').length, 2)
  nav.settle()
  assert.equal(nav.listenerCount(), 0)
})

test('a synchronous Back failure also releases the close guard and listeners', async () => {
  const nav = navigation('/lab', '/lab', 'back')
  await assert.rejects(nav.close({ name: 'lab' }), /Back navigation failed/)
  assert.equal(nav.closing.value, false)
  assert.equal(nav.listenerCount(), 0)
})
