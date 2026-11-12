import assert from 'node:assert/strict'
import test from 'node:test'
import { toBraille } from '../app/utils/braille.ts'
import { demoOrders } from '../app/data/orders.ts'

test('matching codes use the uncontracted Braille alphabet without capital or number signs', () => {
  const expected = '⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵'
  assert.equal(toBraille('abcdefghijklmnopqrstuvwxyz'), expected)
  assert.equal(toBraille('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), expected)
})

test('invalid identifiers are rejected instead of silently changing a matching code', () => {
  for (const code of ['', '628491', 'KMT4RV', 'KMT PRV', 'KM-PRV', 'رنة']) {
    assert.throws(() => toBraille(code), TypeError)
  }
})

test('demo pickup codes contain four letters with distinct Braille representations', () => {
  const codes = Object.values(demoOrders).map((order) => order.pickupCode)
  for (const code of codes) assert.match(code, /^[A-Z]{4}$/)
  assert.equal(new Set(codes.map(toBraille)).size, codes.length)
  assert.equal(toBraille(demoOrders.north.pickupCode), '⠅⠍⠞⠏')
  assert.equal(toBraille(demoOrders.field.pickupCode), '⠺⠝⠟⠋')
})
