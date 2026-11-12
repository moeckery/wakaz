import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createTextCrops,
  createTextLayer,
  textMotion,
  type TextCrop,
} from '../app/utils/textMotion.ts'

const segmenter = new Intl.Segmenter('ar', { granularity: 'grapheme' })

test('character ranges keep Arabic marks and joined emoji intact using UTF-16 offsets', () => {
  const text = 'بِ 🧑🏽‍🍳!'
  const layer = createTextLayer(text, 'character', segmenter)
  assert.deepEqual(layer.units, [
    { text: 'بِ', start: 0, end: 2 },
    { text: '🧑🏽‍🍳', start: 3, end: 10 },
    { text: '!', start: 10, end: 11 },
  ])
  for (const unit of layer.units) assert.equal(text.slice(unit.start, unit.end), unit.text)
  assert.equal(layer.graphemeCount, 3)
})

test('word mode keeps punctuation attached while the wave limit still counts graphemes', () => {
  const layer = createTextLayer('طلبك جاهز.', 'word', segmenter)
  assert.deepEqual(
    layer.units.map((unit) => unit.text),
    ['طلبك', 'جاهز.'],
  )
  assert.equal(layer.graphemeCount, 9)
  assert.equal(layer.staggerMs, 60)

  const longWord = createTextLayer('أ'.repeat(41), 'word', segmenter)
  assert.equal(longWord.units.length, 1)
  assert.ok(longWord.graphemeCount > textMotion.maxAnimatedGraphemes)
  const longTitle = createTextLayer('a'.repeat(40), 'character', segmenter)
  assert.equal((longTitle.units.length - 1) * longTitle.staggerMs, textMotion.maxStaggerMs)
})

test('RTL crops preserve reading order and overlap exactly one physical pixel at scaled preview sizes', () => {
  const rectangles: TextCrop[] = [
    { left: 20, right: 30, top: 0, bottom: 20, index: 0 },
    { left: 10, right: 20, top: 0, bottom: 20, index: 1 },
    { left: 0, right: 10, top: 0, bottom: 20, index: 2 },
  ]
  const original = structuredClone(rectangles)
  const grid = { left: 12.3, scale: 0.75, density: 2 }
  const crops = createTextCrops(rectangles, 24, grid)
  assert.deepEqual(
    crops.map((crop) => crop.index),
    [2, 1, 0],
  )
  assert.deepEqual(rectangles, original)
  for (let index = 1; index < crops.length; index++) {
    const previous = crops[index - 1]!
    const current = crops[index]!
    const overlap = (previous.right - current.left) * grid.scale * grid.density
    const cut = (((previous.right + current.left) / 2) * grid.scale + grid.left) * grid.density
    assert.ok(Math.abs(overlap - 1) < 1e-10)
    assert.ok(Math.abs(cut - Math.round(cut)) < 1e-10)
  }
})

test('shared ligature boxes move once without merging ordinary touching letters', () => {
  const crops = createTextCrops(
    [
      { left: 0, right: 20, top: 0, bottom: 20, index: 0 },
      { left: 0, right: 20, top: 0, bottom: 20, index: 1 },
      { left: 19, right: 35, top: 0, bottom: 20, index: 2 },
    ],
    24,
    { left: 0, scale: 1, density: 1 },
  )
  assert.deepEqual(
    crops.map((crop) => crop.index),
    [0, 2],
  )
})

test('wrapped words keep one delay and adjacent lines share a crop boundary', () => {
  const crops = createTextCrops(
    [
      { left: 0, right: 20, top: 0, bottom: 20, index: 0 },
      { left: 0, right: 20, top: 30, bottom: 50, index: 0 },
    ],
    60,
    { left: 0, scale: 1, density: 1 },
  )
  assert.equal(crops.length, 2)
  assert.deepEqual(
    crops.map((crop) => crop.index),
    [0, 0],
  )
  assert.equal(crops[0]!.bottom, 25)
  assert.equal(crops[1]!.top, 25)
  assert.equal(crops[0]!.top, -textMotion.cropPaddingPx)
  assert.equal(crops[1]!.bottom, 60 + textMotion.cropPaddingPx)
})
