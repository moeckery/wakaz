import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createPagerTracking,
  readStoredPagers,
  updatePagerTracking,
} from '../app/utils/pagerTracking.ts'
import { createPickupSession } from '../app/utils/pickupSession.ts'

test('tracking has one active pager, ignores repeat scans, and only stops that pager', () => {
  const empty = createPagerTracking()
  assert.deepEqual(empty, { active: null, lastRemoved: null })
  assert.equal(updatePagerTracking(empty, { type: 'restore' }), empty)
  assert.equal(updatePagerTracking(empty, { type: 'stop', venueId: 'north' }), empty)
  const north = updatePagerTracking(empty, { type: 'start', venueId: 'north' })
  assert.deepEqual(north, { active: 'north', lastRemoved: null })
  assert.equal(updatePagerTracking(north, { type: 'start', venueId: 'north' }), north)
  assert.equal(updatePagerTracking(north, { type: 'stop', venueId: 'field' }), north)

  const field = updatePagerTracking(north, { type: 'start', venueId: 'field' })
  assert.deepEqual(field, { active: 'field', lastRemoved: null })
  assert.deepEqual(north, { active: 'north', lastRemoved: null })
  assert.equal(updatePagerTracking(field, { type: 'stop', venueId: 'north' }), field)
})

test('stopping exposes the scanner and restores only the most recently removed pager', () => {
  const north = { active: 'north' as const, lastRemoved: null }
  const removedNorth = updatePagerTracking(north, { type: 'stop', venueId: 'north' })
  assert.deepEqual(removedNorth, { active: null, lastRemoved: 'north' })
  assert.equal(updatePagerTracking(removedNorth, { type: 'stop', venueId: 'north' }), removedNorth)
  assert.deepEqual(updatePagerTracking(removedNorth, { type: 'restore' }), north)

  const field = updatePagerTracking(removedNorth, { type: 'start', venueId: 'field' })
  const removedField = updatePagerTracking(field, { type: 'stop', venueId: 'field' })
  assert.deepEqual(removedField, { active: null, lastRemoved: 'field' })
  assert.deepEqual(updatePagerTracking(removedField, { type: 'restore' }), {
    active: 'field',
    lastRemoved: null,
  })
})

test('recovery cannot replace an active pager; rescanning the removed pager clears recovery', () => {
  const removed = { active: null, lastRemoved: 'north' as const }
  const field = updatePagerTracking(removed, { type: 'start', venueId: 'field' })
  assert.deepEqual(field, { active: 'field', lastRemoved: 'north' })
  assert.equal(updatePagerTracking(field, { type: 'restore' }), field)
  assert.deepEqual(updatePagerTracking(removed, { type: 'start', venueId: 'north' }), {
    active: 'north',
    lastRemoved: null,
  })
})

test('version 2 storage preserves the active pager and complete pickup history across refreshes', () => {
  const session = {
    ...createPickupSession(),
    state: 'collected',
    nudged: true,
    rating: 4,
    comment: 'Lovely coffee',
    feedback: 'submitted',
  }
  const saved = {
    version: 2,
    tracking: { active: 'field', lastRemoved: 'north' },
    sessions: { KMTP: session, WNQF: createPickupSession() },
    selectedVenue: 'field',
  }
  const loaded = readStoredPagers(JSON.stringify(saved))
  assert.deepEqual(loaded, saved)
  assert.deepEqual(loaded.sessions.KMTP, session)
})

test('version 1 migration prefers the selected tracked venue and retains every session', () => {
  const sessions = {
    KMTP: { ...createPickupSession(), nudged: true },
    WNQF: { ...createPickupSession(), state: 'ready' },
  }
  const loaded = readStoredPagers(
    JSON.stringify({
      version: 1,
      tracking: { tracked: ['north', 'field'], lastRemoved: null },
      sessions,
      selectedVenue: 'north',
    }),
  )
  assert.deepEqual(loaded, {
    version: 2,
    tracking: { active: 'north', lastRemoved: null },
    sessions,
    selectedVenue: 'north',
  })
})

test('version 1 migration falls back to the last tracked venue and keeps nonactive recovery', () => {
  for (const selectedVenue of ['missing', undefined]) {
    const loaded = readStoredPagers(
      JSON.stringify({
        version: 1,
        tracking: { tracked: ['north', 'field'], lastRemoved: 'north' },
        selectedVenue,
      }),
    )
    assert.deepEqual(loaded.tracking, { active: 'field', lastRemoved: 'north' })
    assert.equal(loaded.selectedVenue, 'field')
  }
  const samePager = readStoredPagers(
    JSON.stringify({
      version: 1,
      tracking: { tracked: ['north', 'field'], lastRemoved: 'field' },
      selectedVenue: 'field',
    }),
  )
  assert.deepEqual(samePager.tracking, { active: 'field', lastRemoved: null })
  const removed = readStoredPagers(
    JSON.stringify({
      version: 1,
      tracking: { tracked: [], lastRemoved: 'north' },
    }),
  )
  assert.deepEqual(removed.tracking, { active: null, lastRemoved: 'north' })
})

test('invalid, future-version, and malformed storage safely falls back to an empty visit', () => {
  const empty = readStoredPagers(null)
  for (const raw of ['', '{broken', 'null', '[]', '{}', '{"version":3}']) {
    assert.deepEqual(readStoredPagers(raw), empty)
  }
  const sanitized = readStoredPagers(
    JSON.stringify({
      version: 2,
      tracking: { active: 'unknown', lastRemoved: 'unknown' },
      selectedVenue: 'unknown',
      sessions: { unknown: createPickupSession(), KMTP: { state: 'invalid' } },
    }),
  )
  assert.deepEqual(sanitized, empty)
  assert.deepEqual(
    readStoredPagers(
      JSON.stringify({
        version: 2,
        tracking: { active: 'north', lastRemoved: 'north' },
        selectedVenue: 'field',
      }),
    ).tracking,
    { active: 'north', lastRemoved: null },
  )
})

test('stored session validation rejects invalid values and bounds comments', () => {
  for (const invalid of [
    { state: 'cancelled' },
    { state: ['waiting'] },
    { nudged: 'yes' },
    { rating: -1 },
    { rating: 1.5 },
    { rating: 6 },
    { comment: 42 },
    { feedback: 'invalid' },
    { feedback: ['pending'] },
    { feedback: 'submitted', rating: 0 },
  ]) {
    const loaded = readStoredPagers(
      JSON.stringify({
        version: 2,
        sessions: { KMTP: { ...createPickupSession(), ...invalid } },
      }),
    )
    assert.deepEqual(loaded.sessions, {})
  }
  const loaded = readStoredPagers(
    JSON.stringify({
      version: 2,
      sessions: { KMTP: { ...createPickupSession(), comment: 'x'.repeat(700), extra: 'discard' } },
    }),
  )
  assert.equal(loaded.sessions.KMTP?.comment.length, 500)
  assert.equal(Object.hasOwn(loaded.sessions.KMTP!, 'extra'), false)
})
