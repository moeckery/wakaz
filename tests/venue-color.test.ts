import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeVenueColor, venuePalette } from '../app/utils/venueColor.ts'

test('opaque hex colors normalize while malformed and transparent inputs are rejected', () => {
  for (const [input, expected] of [
    ['#abc', '#AABBCC'],
    ['ABC', '#AABBCC'],
    ['  a1B2c3  ', '#A1B2C3'],
    ['#000', '#000000'],
    ['fff', '#FFFFFF'],
  ])
    assert.equal(normalizeVenueColor(input), expected)

  for (const input of [
    '',
    ' ',
    '#',
    '#12',
    '#1234',
    '#12345678',
    '##123456',
    '#abcdef;',
    '#ggg',
    'red',
    'transparent',
    'rgb(0, 0, 0)',
    null,
    undefined,
    123456,
    {},
    [],
  ]) {
    assert.equal(normalizeVenueColor(input), null)
  }
  assert.throws(() => venuePalette('invalid', '#FFFFFF'), TypeError)
  assert.throws(() => venuePalette('#FFFFFF', 'invalid'), TypeError)
})

// Measure the final rounded CSS colors independently of the palette implementation.
function contrast(a: string, b: string) {
  function luminance(color: string) {
    const channels = color
      .slice(1)
      .match(/../g)!
      .map((channel) => Number.parseInt(channel, 16) / 255)
    const [r, g, blue] = channels.map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4),
    )
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * blue!
  }
  const levels = [luminance(a), luminance(b)].sort((x, y) => x - y)
  return (levels[1]! + 0.05) / (levels[0]! + 0.05)
}

test('venue colors retain readable text and a distinguishable edge on both app canvases', () => {
  const colors = new Set(['#6F4E37', '#285544', '#161616', '#757575', '#767676', '#808080'])
  for (let r = 0; r <= 255; r += 17) {
    for (let g = 0; g <= 255; g += 17) {
      for (let b = 0; b <= 255; b += 17) {
        colors.add(
          `#${[r, g, b]
            .map((channel) => channel.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()}`,
        )
      }
    }
  }
  for (const color of colors) {
    for (const canvas of ['#FFFFFF', '#161616']) {
      const result = venuePalette(color, canvas)
      assert.equal(result.background, color)
      for (const token of Object.values(result)) assert.match(token, /^#[0-9A-F]{6}$/)
      for (const text of [result.foreground, result.secondary]) {
        assert.ok(contrast(color, text) >= 4.5, `${color} on ${canvas}: unreadable text ${text}`)
      }
      if (contrast(color, canvas) < 3) {
        assert.ok(
          contrast(result.border, canvas) >= 3,
          `${color} on ${canvas}: indistinguishable edge`,
        )
      }
    }
  }
})
