import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { demoOrders } from '../app/data/orders.ts'
import { venues } from '../app/data/venues.ts'
import { normalizeVenueColor } from '../app/utils/venueColor.ts'

type Messages = { [key: string]: string | Messages }

function readMessages(locale: 'en' | 'ar'): Messages {
  return JSON.parse(
    readFileSync(new URL(`../i18n/locales/${locale}.json`, import.meta.url), 'utf8'),
  )
}

function flattenMessages(messages: Messages, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(messages).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key
      return typeof value === 'string'
        ? [[path, value]]
        : Object.entries(flattenMessages(value, path))
    }),
  )
}

const english = flattenMessages(readMessages('en'))
const arabic = flattenMessages(readMessages('ar'))

test('English and Arabic provide the same messages and interpolation values', () => {
  assert.deepEqual(Object.keys(arabic).sort(), Object.keys(english).sort())
  const placeholders = (text: string) =>
    [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()
  for (const [key, value] of Object.entries(english)) {
    assert.ok(value.trim() && arabic[key]?.trim(), `Empty message: ${key}`)
    assert.deepEqual(
      placeholders(arabic[key]!),
      placeholders(value),
      `Interpolation mismatch: ${key}`,
    )
  }
})

test('every venue has a complete, independently identified demo order', () => {
  const venueIds = venues.map((venue) => venue.id)
  assert.equal(new Set(venueIds).size, venueIds.length)
  assert.deepEqual(Object.keys(demoOrders).sort(), [...venueIds].sort())
  const pickupCodes = new Set<string>()

  for (const venue of venues) {
    assert.ok(normalizeVenueColor(venue.color), `Invalid color for ${venue.id}`)
    for (const locale of ['en', 'ar'] as const) {
      for (const field of ['name', 'branch', 'address'] as const)
        assert.ok(venue[field][locale].trim())
    }
    const order = demoOrders[venue.id]
    assert.match(order.number, /^\d+$/)
    assert.match(order.pickupCode, /^[A-Z]{4}$/)
    assert.ok(!pickupCodes.has(order.pickupCode), `Shared pickup session: ${order.pickupCode}`)
    pickupCodes.add(order.pickupCode)
    assert.equal(new Set(order.items.map((item) => item.id)).size, order.items.length)
    for (const item of order.items) {
      assert.ok(
        Number.isInteger(item.quantity) && item.quantity > 0,
        `Invalid quantity: ${item.id}`,
      )
      assert.ok(english[item.nameKey] && arabic[item.nameKey], `Missing item name: ${item.nameKey}`)
    }
  }
})
