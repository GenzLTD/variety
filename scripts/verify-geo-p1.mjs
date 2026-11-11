#!/usr/bin/env node
/**
 * verify-geo-p1.mjs — GEO P1 核心页可爬壳断言
 *
 * 对 dist 下 ≥8 核心路径检查：
 *   - HTML 存在
 *   - 含公司全称「深伯乐（深圳）科技有限公司」
 *   - 有独立 canonical / description
 *   - 无权威域 szbolent.cn（邮箱豁免不适用此处壳文案）
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')
const DIR = resolve(ROOT, process.argv.find((a) => a.startsWith('--dir='))?.slice(6) || 'dist')
const ORG = '深伯乐（深圳）科技有限公司'

const ROUTES = [
  { path: '/', file: 'index.html' },
  { path: '/about', file: 'about/index.html' },
  { path: '/services', file: 'services/index.html' },
  { path: '/contact', file: 'contact/index.html' },
  { path: '/careers', file: 'careers/index.html' },
  { path: '/privacy', file: 'privacy/index.html' },
  { path: '/terms', file: 'terms/index.html' },
  { path: '/blog', file: 'blog/index.html' },
  { path: '/poetry', file: 'poetry/index.html' },
]

const errors = []
const ok = (m) => console.log(`[geo-p1] ✓ ${m}`)
const fail = (m) => {
  errors.push(m)
  console.error(`[geo-p1] ✗ ${m}`)
}

for (const r of ROUTES) {
  const p = join(DIR, r.file)
  if (!existsSync(p)) {
    fail(`${r.path} 缺少 ${r.file}`)
    continue
  }
  const html = readFileSync(p, 'utf8')
  if (!html.includes(ORG)) fail(`${r.path} 无公司全称`)
  else ok(`${r.path} 含公司全称`)
  if (!/rel="canonical"/i.test(html)) fail(`${r.path} 无 canonical`)
  else ok(`${r.path} 有 canonical`)
  if (!/<meta name="description" content="[^"]+"/i.test(html)) fail(`${r.path} 无 description`)
  else ok(`${r.path} 有 description`)
  if (!/data-prerender=/i.test(html) && r.path !== '/blog') {
    // blog 用 bookstore 标记
    fail(`${r.path} 无 data-prerender 标记`)
  } else if (r.path === '/blog' && !/data-prerender="bookstore"/i.test(html)) {
    fail(`${r.path} 无 bookstore prerender 标记`)
  } else {
    ok(`${r.path} 有 prerender 标记`)
  }
  if (r.path === '/blog') {
    if (/建设中/.test(html)) fail('/blog 可爬 HTML 含「建设中」')
    else ok('/blog 可爬 HTML 不含「建设中」')
    const withheld = /name="robots" content="noindex/i.test(html) || /data-feed-count="0"/.test(html)
    const listed = /prerender-book-item/.test(html)
    if (withheld && listed) fail('/blog 同时 noindex 与节选列表')
    else if (!withheld && !listed) fail('/blog 既未列出节选，也未 noindex')
    else ok(listed ? '/blog 含可引用节选' : '/blog 无节选，已 noindex')
  }
  const stripped = html.replace(/勿引用[^。\n]*szbolent\.cn/gi, '')
  if (/https?:\/\/([a-z0-9-]+\.)?szbolent\.cn\b/i.test(stripped)) {
    fail(`${r.path} 含权威域 szbolent.cn URL`)
  }
}

if (ROUTES.length < 8) fail(`核心路径不足 8（当前 ${ROUTES.length}）`)
else ok(`核心路径 ${ROUTES.length} ≥ 8`)

if (errors.length) {
  console.error(`[geo-p1] ${errors.length} 项失败 @ ${DIR}`)
  process.exit(1)
}
console.log(`[geo-p1] 全部通过 @ ${DIR}`)
