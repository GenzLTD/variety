#!/usr/bin/env node
/**
 * verify-geo-p0.mjs — GEO P0 构建产物断言
 *
 * 检查 dist（或 --src=public 抽检源文件）：
 *   - robots / sitemap / index 权威域为 szbolent.com，禁 szbolent.cn（邮箱 .com.cn 除外）
 *   - llms.txt、og-image.png、JSON-LD（Organization + WebSite）存在
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')
const targetArg = process.argv.find((a) => a.startsWith('--dir='))
const DIR = resolve(ROOT, targetArg ? targetArg.slice('--dir='.length) : 'dist')

const errors = []
const ok = (m) => console.log(`[geo-p0] ✓ ${m}`)
const fail = (m) => {
  errors.push(m)
  console.error(`[geo-p0] ✗ ${m}`)
}

function read(rel) {
  const p = join(DIR, rel)
  if (!existsSync(p)) {
    fail(`缺少 ${rel}`)
    return null
  }
  return readFileSync(p, 'utf8')
}

function assertNoLegacyAuthority(label, text) {
  if (!text) return
  // 权威 URL / Sitemap / OG 不得用 .cn；联系邮箱 @szbolent.com.cn 允许
  const stripped = text.replace(/@szbolent\.com\.cn/gi, '@ALLOWED_EMAIL')
  if (/szbolent\.cn/i.test(stripped)) {
    fail(`${label} 仍含权威域 szbolent.cn`)
  } else {
    ok(`${label} 无 szbolent.cn 权威残留`)
  }
  if (!/szbolent\.com/i.test(text)) {
    fail(`${label} 未出现 szbolent.com`)
  }
}

const robots = read('robots.txt')
if (robots) {
  assertNoLegacyAuthority('robots.txt', robots)
  if (!/Sitemap:\s*https:\/\/szbolent\.com\/sitemap\.xml/i.test(robots)) {
    fail('robots.txt Sitemap 未指向 https://szbolent.com/sitemap.xml')
  } else ok('robots.txt Sitemap 正确')
}

const sitemap = read('sitemap.xml')
if (sitemap) {
  assertNoLegacyAuthority('sitemap.xml', sitemap)
  if (!/<lastmod>/i.test(sitemap)) fail('sitemap.xml 缺少 lastmod')
  else ok('sitemap.xml 含 lastmod')
}

const index = read('index.html')
if (index) {
  assertNoLegacyAuthority('index.html', index)
  if (!/rel="canonical"/i.test(index)) fail('index.html 缺少 canonical')
  else ok('index.html 有 canonical')
  if (!/application\/ld\+json/i.test(index)) fail('index.html 缺少 JSON-LD')
  else {
    ok('index.html 有 JSON-LD')
    if (!/"@type"\s*:\s*"Organization"/i.test(index)) fail('JSON-LD 缺少 Organization')
    else ok('JSON-LD Organization')
    if (!/"@type"\s*:\s*"WebSite"/i.test(index)) fail('JSON-LD 缺少 WebSite')
    else ok('JSON-LD WebSite')
    if (!/深伯乐（深圳）科技有限公司/.test(index)) fail('JSON-LD 缺少公司全称')
    else ok('JSON-LD 含公司全称')
  }
  if (!/og-image\.png/i.test(index)) fail('index.html 未引用 og-image.png')
  else ok('index.html 引用 og-image')
}

const llms = read('llms.txt')
if (llms) {
  if (!/https:\/\/szbolent\.com/i.test(llms)) fail('llms.txt 未声明权威域')
  else ok('llms.txt 权威域')
  if (!/深伯乐（深圳）科技有限公司/.test(llms)) fail('llms.txt 缺少公司全称')
  else ok('llms.txt 公司全称')
}

if (!existsSync(join(DIR, 'og-image.png'))) fail('缺少 og-image.png')
else ok('og-image.png 存在')

const aiTxt = join(DIR, '.well-known', 'ai.txt')
if (!existsSync(aiTxt)) fail('缺少 .well-known/ai.txt')
else ok('.well-known/ai.txt 存在')

if (errors.length) {
  console.error(`[geo-p0] ${errors.length} 项失败 @ ${DIR}`)
  process.exit(1)
}
console.log(`[geo-p0] 全部通过 @ ${DIR}`)
