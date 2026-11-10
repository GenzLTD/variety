#!/usr/bin/env node
/**
 * CLI：bolent-shelf/v1 JSON → bookstore/v1 JSON
 *
 *   node scripts/map-bolent-shelf-feed.mjs [in] [out]
 *   BOOKSTORE_URL_MODE=poem|document|permalink SITE_URL=https://szbolent.com …
 *
 * 默认读 scripts/fixtures/bolent-shelf-feed.json，写 bookstore-feed.json（stdout 亦可）。
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { toBookstoreFeed } from './lib/bolent-shelf-to-bookstore.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const inPath = resolve(process.argv[2] || join(ROOT, 'scripts/fixtures/bolent-shelf-feed.json'))
const outArg = process.argv[3]
const outPath = outArg ? resolve(outArg) : join(ROOT, 'scripts/fixtures/bookstore-feed.json')

const raw = JSON.parse(readFileSync(inPath, 'utf8'))
const mapped = toBookstoreFeed(raw)
const json = `${JSON.stringify(mapped, null, 2)}\n`

if (outArg === '-' || process.env.BOOKSTORE_MAP_STDOUT === '1') {
  process.stdout.write(json)
} else {
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, json, 'utf8')
  console.log(`[map-bolent-shelf-feed] ${inPath} → ${outPath} (${mapped.count} items)`)
}
