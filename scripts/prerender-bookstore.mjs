#!/usr/bin/env node
/**
 * prerender-bookstore.mjs — 书店/WP 同源可爬 HTML 壳
 *
 * 选型（相对 tip 架构的最小改动）：
 *   Vite CSR SPA + nginx 同源反代 `/wp-json`，不做全站 SSR。
 *   构建后基于 dist/index.html 写出 dist/blog/index.html，把书店 feed
 *   的标题/节选嵌进 `#app` 初始 DOM。爬虫不执行 JS 时仍可读正文；
 *   浏览器 hydration 后由 Vue 接管（与现网 Blog.vue 一致）。
 *
 * 环境：
 *   SITE_URL              权威域（默认 https://szbolent.com）
 *   BOOKSTORE_FEED_URL    feed 绝对地址（可指向 myblog bolent-shelf/v1；会自动适配）
 *   BOOKSTORE_FEED_FILE   本地 JSON 夹具（离线/CI 无上游时用；bolent-shelf 或 bookstore 皆可）
 *   BOOKSTORE_URL_MODE    poem（默认 /poem/<id>）| document | permalink
 *   BOOKSTORE_DEFAULT_GENRE  无分类时的 genre 缺省（默认「文」）
 *
 * 失败策略：上游不可达时仍写出带公司/书店导语的可爬壳（exit 0），
 * 优先回落 bolent-shelf 快照 → bookstore 夹具，避免 myblog/法兰克福短暂不可达阻断构建。
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  isBolentShelfFeed,
  toBookstoreFeed,
} from './lib/bolent-shelf-to-bookstore.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = join(ROOT, 'dist')
const SITE = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://szbolent.com').replace(/\/+$/, '')
const BOLENT_SHELF_FIXTURE = join(ROOT, 'scripts/fixtures/bolent-shelf-feed.json')
const BOOKSTORE_FIXTURE = join(ROOT, 'scripts/fixtures/bookstore-feed.json')
const FEED_FILE = process.env.BOOKSTORE_FEED_FILE || ''
const FEED_URL =
  process.env.BOOKSTORE_FEED_URL ||
  process.env.VITE_SHELF_FEED_URL ||
  `${SITE}/wp-json/bookstore/v1/feed?limit=200`

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function rewriteAuthorityUrl(raw) {
  if (!raw) return `${SITE}/blog`
  try {
    const u = new URL(raw, SITE)
    if (/(^|\.)szbolent\.(cn|com\.cn)$/i.test(u.hostname) || /(^|\.)szbolent\.com$/i.test(u.hostname)) {
      u.protocol = 'https:'
      u.hostname = 'szbolent.com'
    }
    return u.toString()
  } catch {
    return raw
  }
}

/**
 * 任意 feed → prerender 条目（先 bolent-shelf→bookstore 适配，再规范化）
 * @param {unknown} raw
 */
function normalizeItems(raw) {
  const adapted = toBookstoreFeed(raw, { site: SITE })
  const items = Array.isArray(adapted?.items) ? adapted.items : []
  return items
    .map((item) => {
      const title = String(item?.title || '').trim()
      if (!title) return null
      const excerpt = Array.isArray(item?.excerpt)
        ? item.excerpt.map((l) => String(l).trim()).filter(Boolean).join('\n')
        : String(item?.excerpt || '').trim()
      return {
        id: String(item?.id || title),
        title,
        genre: String(item?.genre || '').trim(),
        excerpt,
        url: rewriteAuthorityUrl(item?.url),
      }
    })
    .filter(Boolean)
}

function loadJsonFile(path) {
  if (!path || !existsSync(path)) return null
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8'))
    const items = normalizeItems(raw)
    if (!items.length) return null
    const kind = isBolentShelfFeed(raw) ? 'bolent-shelf' : 'bookstore'
    console.log(`[prerender-bookstore] fixture ${path} (${kind}) → ${items.length} items`)
    return { items, source: `fixture:${kind}`, path }
  } catch (err) {
    console.warn(`[prerender-bookstore] fixture 读取失败 (${path}): ${err.message}`)
    return null
  }
}

function loadFixtureChain() {
  // 显式 BOOKSTORE_FEED_FILE 优先
  if (FEED_FILE) {
    const forced = loadJsonFile(resolve(FEED_FILE))
    if (forced) return forced
    console.warn(`[prerender-bookstore] BOOKSTORE_FEED_FILE 无效: ${FEED_FILE}`)
  }
  // myblog 挂着时：先 bolent-shelf 已提交快照，再 bookstore 夹具
  return loadJsonFile(BOLENT_SHELF_FIXTURE) || loadJsonFile(BOOKSTORE_FIXTURE)
}

async function loadFeed() {
  // 显式夹具优先（CI 离线 / 可复现验收）
  if (FEED_FILE) {
    const forced = loadFixtureChain()
    if (forced) return forced
  }

  try {
    const res = await fetch(FEED_URL, { signal: AbortSignal.timeout(15000) })
    const ct = res.headers.get('content-type') || ''
    if (!res.ok || !ct.includes('json')) {
      throw new Error(`HTTP ${res.status} ${ct || 'non-json'}`)
    }
    const raw = await res.json()
    const items = normalizeItems(raw)
    if (items.length) {
      const kind = isBolentShelfFeed(raw) ? 'bolent-shelf→bookstore' : 'bookstore'
      console.log(`[prerender-bookstore] feed ${FEED_URL} (${kind}) → ${items.length} items`)
      return { items, source: 'feed' }
    }
    console.warn('[prerender-bookstore] feed 为空，尝试夹具')
  } catch (err) {
    console.warn(`[prerender-bookstore] feed 不可达 (${err.message})，尝试夹具`)
  }

  const fixture = loadFixtureChain()
  if (fixture) return fixture
  return { items: [], source: 'fallback' }
}

function buildBody(items) {
  const articles = items
    .map(
      (item) => `    <article class="prerender-book-item" data-id="${escapeHtml(item.id)}">
      <h2><a href="${escapeHtml(item.url)}" rel="noopener">${escapeHtml(item.title)}</a></h2>
      ${item.genre ? `<p class="genre">${escapeHtml(item.genre)}</p>` : ''}
      <p class="excerpt">${escapeHtml(item.excerpt).replace(/\n/g, '<br>')}</p>
    </article>`
    )
    .join('\n')

  return `<main id="prerender-bookstore" data-prerender="bookstore">
  <header>
    <h1>书店</h1>
    <p>深伯乐（深圳）科技有限公司 — 同源书店节选。完整原文经本站 /wp-json 与法兰克福 WordPress 内容线提供；权威域 https://szbolent.com。</p>
  </header>
  <section aria-label="书店节选列表">
${articles || '    <p>书店节选建设中。权威站点 https://szbolent.com/blog 。</p>'}
  </section>
</main>`
}

function inject(html, body) {
  let out = html
  out = out.replace(/<title>[^<]*<\/title>/i, '<title>书店 | 深伯乐</title>')
  out = out.replace(
    /<meta name="description" content="[^"]*">/i,
    '<meta name="description" content="深伯乐书店节选：诗词与文化内容同源陈列于 szbolent.com/blog">'
  )
  out = out.replace(
    /<meta property="og:url" content="[^"]*">/i,
    `<meta property="og:url" content="${SITE}/blog">`
  )
  out = out.replace(
    /<meta property="og:title" content="[^"]*">/i,
    '<meta property="og:title" content="书店 | 深伯乐">'
  )
  if (/rel="canonical"/i.test(out)) {
    out = out.replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${SITE}/blog">`)
  } else {
    out = out.replace('</head>', `    <link rel="canonical" href="${SITE}/blog">\n  </head>`)
  }

  if (/<div id="app"><\/div>/i.test(out)) {
    out = out.replace(/<div id="app"><\/div>/i, `<div id="app">${body}</div>`)
  } else if (/<div id="app">/i.test(out)) {
    out = out.replace(/<div id="app">[\s\S]*?<\/div>/i, `<div id="app">${body}</div>`)
  } else {
    out = out.replace('</body>', `${body}\n  </body>`)
  }
  return out
}

async function main() {
  const indexPath = join(DIST, 'index.html')
  if (!existsSync(indexPath)) {
    console.error('[prerender-bookstore] 缺少 dist/index.html，请先 vite build')
    process.exit(1)
  }

  const { items } = await loadFeed()
  const html = inject(readFileSync(indexPath, 'utf8'), buildBody(items))
  const outDir = join(DIST, 'blog')
  mkdirSync(outDir, { recursive: true })
  const outFile = join(outDir, 'index.html')
  writeFileSync(outFile, html, 'utf8')
  console.log(`[prerender-bookstore] wrote ${outFile} (${items.length} articles)`)
}

main().catch((err) => {
  console.error('[prerender-bookstore] fatal:', err)
  process.exit(1)
})
