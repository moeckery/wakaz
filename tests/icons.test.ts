import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { iconNames } from '../app/data/icons.ts'

test('typed icon names match the local SVG sprite without missing or duplicate symbols', () => {
  const sprite = readFileSync(new URL('../public/icons.svg', import.meta.url), 'utf8')
  const symbols = [...sprite.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1])
  assert.equal(new Set(symbols).size, symbols.length, 'SVG symbol IDs must be unique')
  assert.deepEqual([...iconNames].sort(), symbols.sort())
})
