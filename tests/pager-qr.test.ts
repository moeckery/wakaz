import assert from 'node:assert/strict'
import test from 'node:test'
import { parsePagerQr } from '../app/utils/pagerQr.ts'

const origin = 'https://ranna.example'

test('QR tokens accept only the known demo pagers', () => {
  assert.equal(parsePagerQr('ranna:demo:north'), 'north')
  assert.equal(parsePagerQr('ranna:demo:field'), 'field')
  for (const value of [
    '',
    'north',
    'ranna:demo:missing',
    'RANNA:demo:north',
    'ranna:demo:north/extra',
    'ranna:demo:north?next=https://other.example',
    ' ranna:demo:north ',
  ]) {
    assert.equal(parsePagerQr(value, origin), null, value)
  }
})

test('same-origin pager links identify a venue without allowing arbitrary routes or URL data', () => {
  assert.equal(parsePagerQr('/ranna/pager/north', origin), 'north')
  assert.equal(parsePagerQr(`${origin}/ranna/pager/field`, origin), 'field')
  assert.equal(
    parsePagerQr('http://127.0.0.1:4180/ranna/pager/north', 'http://127.0.0.1:4180'),
    'north',
  )
  for (const value of [
    '/ranna/pager/north/',
    '/ranna/pager/north/pickup',
    '/ranna/settings',
    '/ranna/pager/missing',
    '/ranna/pager/%6eorth',
    '/ranna/pager/north?tracking=true',
    '/ranna/pager/north#pickup',
    '/ranna/pager/north?',
    '/ranna/pager/north#',
    '/ranna/other/../pager/north',
    '/ranna\\pager\\north',
    `${origin}/other/../ranna/pager/north`,
    `${origin}\\other/ranna/pager/north`,
    `${origin}/ranna/pager/north `,
  ]) {
    assert.equal(parsePagerQr(value, origin), null, value)
  }
})

test('external origins, credentials, unsafe protocols, and malformed links are never followed', () => {
  for (const value of [
    'https://other.example/ranna/pager/north',
    'https://ranna.example.other.example/ranna/pager/north',
    'http://ranna.example/ranna/pager/north',
    '//other.example/ranna/pager/north',
    'https://user:password@ranna.example/ranna/pager/north',
    'https://ranna.example@other.example/ranna/pager/north',
    'javascript:alert(1)',
    'data:text/html,/ranna/pager/north',
    'https://[broken',
    'https://',
  ]) {
    assert.equal(parsePagerQr(value, origin), null, value)
  }
  assert.equal(parsePagerQr('/ranna/pager/north'), null)
  assert.equal(parsePagerQr('/ranna/pager/north', 'not an origin'), null)
})
