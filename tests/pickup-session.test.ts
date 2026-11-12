import assert from 'node:assert/strict'
import test from 'node:test'
import { createPickupSession, updatePickupSession } from '../app/utils/pickupSession.ts'

test('an update request is allowed once while waiting and remains locked after previewing another stage', () => {
  const original = createPickupSession()
  for (const state of ['entry', 'ready', 'collected'] as const) {
    const preview = { ...original, state }
    assert.equal(updatePickupSession(preview, { type: 'nudge' }), preview)
  }
  const nudged = updatePickupSession(original, { type: 'nudge' })
  assert.equal(nudged.nudged, true)
  assert.equal(original.nudged, false)
  assert.equal(updatePickupSession(nudged, { type: 'nudge' }), nudged)
  const ready = { ...nudged, state: 'ready' as const }
  assert.equal(updatePickupSession(ready, { type: 'nudge' }), ready)
  const waitingAgain = { ...ready, state: 'waiting' as const }
  assert.equal(updatePickupSession(waitingAgain, { type: 'nudge' }), waitingAgain)
})

test('collection transitions ready to collected and cannot repeat or request an update afterward', () => {
  const original = createPickupSession()
  for (const state of ['entry', 'waiting', 'collected'] as const) {
    const preview = { ...original, state }
    assert.equal(updatePickupSession(preview, { type: 'collect' }), preview)
  }
  const ready = { ...original, state: 'ready' as const }
  const collected = updatePickupSession(ready, { type: 'collect' })
  assert.equal(collected.state, 'collected')
  assert.equal(ready.state, 'ready')
  assert.equal(updatePickupSession(collected, { type: 'collect' }), collected)
  assert.equal(updatePickupSession(collected, { type: 'nudge' }), collected)
})

test('feedback requires the collected stage and a whole-number rating from one to five', () => {
  const original = createPickupSession()
  for (const state of ['entry', 'waiting', 'ready'] as const) {
    const preview = { ...original, state }
    for (const action of [
      { type: 'rate', value: 5 },
      { type: 'comment', value: 'Nice visit' },
      { type: 'submit' },
      { type: 'skip' },
    ] as const) {
      assert.equal(updatePickupSession(preview, action), preview)
    }
  }
  const collected = updatePickupSession({ ...original, state: 'ready' }, { type: 'collect' })
  assert.equal(updatePickupSession(collected, { type: 'submit' }), collected)
  for (const value of [-1, 0, 1.5, 6, NaN, Infinity]) {
    assert.equal(updatePickupSession(collected, { type: 'rate', value }), collected)
  }
  for (const value of [1, 2, 3, 4, 5]) {
    assert.equal(updatePickupSession(collected, { type: 'rate', value }).rating, value)
  }
})

test('feedback keeps a bounded draft and remains locked after submission and preview stage changes', () => {
  let session = updatePickupSession(
    { ...createPickupSession(), state: 'ready' },
    { type: 'collect' },
  )
  session = updatePickupSession(session, { type: 'comment', value: 'x'.repeat(600) })
  assert.equal(session.comment.length, 500)
  session = updatePickupSession(session, { type: 'comment', value: '  Lovely coffee  ' })
  session = updatePickupSession(session, { type: 'rate', value: 4 })
  const submitted = updatePickupSession(session, { type: 'submit' })
  assert.equal(submitted.feedback, 'submitted')
  assert.equal(submitted.comment, 'Lovely coffee')
  for (const state of ['waiting', 'ready', 'collected'] as const) {
    const preview = { ...submitted, state }
    for (const action of [
      { type: 'rate', value: 1 },
      { type: 'comment', value: 'Changed' },
      { type: 'submit' },
      { type: 'skip' },
    ] as const) {
      assert.equal(updatePickupSession(preview, action), preview)
    }
  }
})

test('skipping is optional without a rating and locks feedback for that order', () => {
  const collected = updatePickupSession(
    { ...createPickupSession(), state: 'ready' },
    { type: 'collect' },
  )
  const skipped = updatePickupSession(collected, { type: 'skip' })
  assert.equal(skipped.feedback, 'skipped')
  assert.equal(skipped.rating, 0)
  assert.equal(updatePickupSession(skipped, { type: 'rate', value: 5 }), skipped)
  assert.equal(updatePickupSession(skipped, { type: 'submit' }), skipped)
  assert.deepEqual(createPickupSession(), {
    state: 'waiting',
    nudged: false,
    rating: 0,
    comment: '',
    feedback: 'pending',
  })
})
