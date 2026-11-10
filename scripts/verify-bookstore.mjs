#!/usr/bin/env node
/**
 * verify-bookstore.mjs — 「用户看得见」层的验收：书店栏目是否真的把节选渲染出来了
 *
 * 由来（同一类事故模式的第三道防线）：
 *   ① /v1/menus 假绿（curl 200、浏览器空导航）→ verify-nav-render.mjs 已收口；
 *   ② 菜单链路假绿（Page Engine 从未部署）→ 同上；
 *   ③ 书店栏目是橱窗自己的页面（不依赖菜单），数据源是跨域的
 *      同源 /wp-json/bookstore/v1/feed（nginx → 法兰克福）—— 服务端 curl 通、CORS 通、
 *      都不等于「用户打开 /blog 看得到卡片」。
 *      feed 挂了页面会渲染成「📭 暂无文章 / 内容暂不可用」，而 SPA 路由照样 200，
 *      只看状态码的验收会把它判成绿。
 *
 * 断言（全部为硬断言）：
 *   A. 页面确实发起了 bookstore/v1/feed 请求（没有 → 数据源没接上）
 *   B. 该请求返回 200（404/500/502 → 书店源站不可用）
 *   C. 响应体真的有数据（count>0 且 items 非空 → 排除「空 feed 也算过」）
 *   D. 页面没落到降级态（.error-state / .empty-state，也没卡在 loading）
 *   E. DOM 里渲染出 ≥MIN_ITEMS 张卡片（渲染层兜底）
 *   F. 卡片标题来自 feed（不是写死的假数据）
 *   G. 「阅读原文」指向书店源站且新窗口打开（不是自跳 / 死链）
 *   H. genre 筛选点了之后仍有内容（筛选不是「一点就空」）
 *
 * 用法：
 *   npm run verify:book                                    # 默认线上 https://szbolent.com/blog
 *   SITE_URL=http://localhost:4173/ npm run verify:book    # 本地 preview 也适用
 *   BOOKSTORE_HOST=szbolent.com MIN_ITEMS=5 npm run verify:book
 * 退出码：0 = 全通过；1 = 有断言不过
 */
import { chromium } from 'playwright'

const SITE = (process.env.SITE_URL || 'https://szbolent.com/').replace(/\/+$/, '')
const PAGE_PATH = process.env.BOOKSTORE_PATH || '/blog'
const TARGET = `${SITE}${PAGE_PATH}`
const FEED_MARK = process.env.FEED_MARK || '/wp-json/bookstore/v1/feed'
const SOURCE_HOST = process.env.BOOKSTORE_HOST || 'szbolent.com'
const MIN_ITEMS = Number(process.env.MIN_ITEMS || 1)

const ok = (s) => { console.log(`\u001b[0;32m✅ PASS\u001b[0m  ${s}`); PASS++ }
const no = (s) => { console.log(`\u001b[0;31m❌ FAIL\u001b[0m  ${s}`); FAIL++; FAILED.push(s) }
const skip = (s) => { console.log(`\u001b[0;33m⚠️ SKIP\u001b[0m  ${s}`) }
let PASS = 0, FAIL = 0
const FAILED = []

console.log('='.repeat(52))
console.log('  书店栏目 — 真实浏览器渲染验收')
console.log(`  ${TARGET}  (${new Date().toISOString().replace('T', ' ').slice(0, 19)})`)
console.log(`  数据源: ${FEED_MARK}（期望源站 ${SOURCE_HOST}）`)
console.log('='.repeat(52))
console.log('')

const browser = await chromium.launch()
const page = await browser.newPage()

// feed 是 onMounted 里异步拉的，这里记录真实请求 / 响应 / 响应体当证据
const feedReqs = []
page.on('response', async (r) => {
  if (!r.url().includes(FEED_MARK)) return
  let body = null
  try { body = await r.json() } catch { /* 非 JSON 或已断开，按 null 处理 */ }
  feedReqs.push({ url: r.url(), status: r.status(), body })
})
const consoleErrs = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()) })

let cards = []
let degraded = { error: false, empty: false, loading: false }
try {
  await page.goto(TARGET, { waitUntil: 'load', timeout: 45000 })
  // 等卡片渲染出来（出现即返回），最多 15s；不做「sleep 定长就判过」
  try { await page.waitForSelector('.post-card', { timeout: 15000 }) } catch { /* 下面按空列表报错 */ }
  cards = await page.$$eval('.post-card', (els) => els.map((el) => ({
    title: (el.querySelector('h3.post-title')?.textContent || '').trim(),
    genre: (el.querySelector('.category-tag')?.textContent || '').trim(),
    href: el.querySelector('a.read-more')?.getAttribute('href') || '',
    target: el.querySelector('a.read-more')?.getAttribute('target') || '',
  }))).catch(() => [])
  degraded = await page.evaluate(() => ({
    error: Boolean(document.querySelector('.error-state')),
    empty: Boolean(document.querySelector('.empty-state')),
    loading: Boolean(document.querySelector('.loading-state')),
  })).catch(() => ({ error: false, empty: false, loading: false }))
} catch (e) {
  no(`页面打开失败: ${e.message}`)
}

// A. 有没有真的去拉 feed
if (feedReqs.length === 0) {
  no(`页面从未请求 ${FEED_MARK}（书店数据源没接上）`)
} else {
  ok(`页面请求了 ${FEED_MARK}（${feedReqs.length} 次）`)
}

// B. 状态码
const bad = feedReqs.filter((r) => r.status !== 200)
if (feedReqs.length > 0) {
  if (bad.length === 0) {
    ok('书店 feed 全部 200（源站可用）')
  } else {
    no(`书店 feed 有非 200 响应: ${bad.map((r) => `${r.status} ${r.url}`).join(' | ')}`)
  }
}

// C. 响应体真的有数据（空 feed 不该算过）
let feedTitles = []
if (feedReqs.length > 0) {
  const usable = feedReqs.filter((r) => r.body && Array.isArray(r.body.items))
  if (usable.length === 0) {
    no('书店 feed 响应体不是预期的 {count, items[]}（解析失败或格式变了）')
  } else {
    const body = usable[usable.length - 1].body
    const n = body.items?.length ?? 0
    feedTitles = body.items.map((i) => String(i.title || '').trim())
    if (n === 0 || Number(body.count) === 0) {
      no(`书店 feed 是空的（count=${body.count}, items=${n}）`)
    } else {
      ok(`书店 feed 有数据（count=${body.count}, items=${n}）`)
    }
  }
}

// D. 页面没落到降级态（只看状态码的验收会把这一态判成绿）
if (degraded.error) no('页面落到错误降级态（.error-state，用户看到的是「内容暂不可用」）')
else if (degraded.empty) no('页面落到空态（.empty-state，用户看到的是「暂无文章」）')
else if (degraded.loading) no('页面卡在加载态（.loading-state，feed 没回来）')
else ok('页面不在错误 / 空 / 加载降级态')

// E. 渲染层：卡片数量
if (cards.length === 0) {
  no(`书店页面一张卡片都没渲染出来（期望 ≥${MIN_ITEMS}）`)
} else if (cards.length < MIN_ITEMS) {
  no(`卡片数量 ${cards.length} < MIN_ITEMS=${MIN_ITEMS}`)
} else {
  ok(`渲染出 ${cards.length} 张节选卡片（首张: ${cards[0].title || '(无标题)'}）`)
}

// F. 卡片内容来自 feed（防写死假数据）
if (cards.length > 0 && feedTitles.length > 0) {
  const known = new Set(feedTitles)
  const orphans = cards.filter((c) => c.title && !known.has(c.title))
  if (orphans.length === 0) {
    ok(`${cards.length} 张卡片标题全部能在 feed 里对上`)
  } else {
    no(`有 ${orphans.length} 张卡片标题不在 feed 里（疑似写死数据）: ${orphans.slice(0, 3).map((c) => c.title).join(' / ')}`)
  }
}

// G. 原文链接指向书店源站 + 新窗口
if (cards.length > 0) {
  const linkHosts = new Set()
  let badLink = 0, notBlank = 0
  for (const c of cards) {
    if (!c.href) { badLink++; continue }
    try {
      const h = new URL(c.href, SITE).host
      linkHosts.add(h)
      if (h !== SOURCE_HOST && !h.endsWith(`.${SOURCE_HOST}`)) badLink++
    } catch { badLink++ }
    if (c.target !== '_blank') notBlank++
  }
  if (badLink === 0) {
    ok(`${cards.length} 张卡片的原文链接都指向书店源站: ${[...linkHosts].join(', ')}`)
  } else {
    no(`${badLink} 张卡片的原文链接不是 ${SOURCE_HOST}（实际: ${[...linkHosts].join(', ')}）`)
  }
  if (notBlank === 0) {
    ok('原文链接全部 target=_blank（跳转不挤掉门户）')
  } else {
    no(`${notBlank} 张卡片的原文链接不是 target=_blank`)
  }
}

// H. genre 筛选点完仍有内容（避免「一点分类就空」）
try {
  const genreBtns = await page.$$eval('.filter-btn', (els) => els.map((e) => e.textContent.trim()))
    .catch(() => [])
  const pick = genreBtns.filter((t) => t && t !== '全部')
  if (pick.length === 0) {
    skip('没有 genre 筛选按钮（feed 未返回 genre），跳过筛选断言')
  } else {
    const want = pick[0]
    await page.click(`.filter-btn:has-text("${want}")`)
    let after = 0
    try {
      await page.waitForFunction(
        (g) => {
          const els = [...document.querySelectorAll('.post-card')]
          return els.length > 0 && els.every((e) => (e.querySelector('.category-tag')?.textContent || '').trim() === g)
        },
        want,
        { timeout: 5000 },
      )
      after = await page.$$eval('.post-card', (els) => els.length).catch(() => 0)
    } catch { after = await page.$$eval('.post-card', (els) => els.length).catch(() => 0) }
    if (after > 0) {
      ok(`筛选「${want}」后仍有 ${after} 张卡片`)
    } else {
      no(`筛选「${want}」后一张卡片都没有（筛选把列表筛空了）`)
    }
  }
} catch (e) {
  no(`筛选断言执行失败: ${e.message}`)
}

if (consoleErrs.length > 0) {
  console.log('')
  console.log('  浏览器 console 错误（排查线索）：')
  consoleErrs.slice(0, 5).forEach((e) => console.log(`    - ${e.slice(0, 200)}`))
}

await browser.close()

console.log('')
console.log('='.repeat(52))
console.log(`  通过: ${PASS}   失败: ${FAIL}`)
if (FAIL > 0) {
  console.log(`  失败项: ${FAILED.join('; ')}`)
  console.log('='.repeat(52))
  console.log('')
  console.log('排查顺序：')
  console.log('  1) 同源 feed  → curl https://szbolent.com/wp-json/bookstore/v1/feed（应 200 且 count>0）')
  console.log('  2) 反代       → nginx /wp-json → 法兰克福；浏览器勿再直连旧 .cn')
  console.log('  3) 前端变量   → 构建产物里的 VITE_SHELF_API_BASE 应为 /wp-json/bookstore/v1')
  console.log('  4) 页面路由   → 门户 nginx /blog 优先 dist/blog/index.html，再回退 SPA')
  process.exit(1)
}
console.log('='.repeat(52))
console.log('')
console.log('验收通过：书店栏目在真实浏览器里渲染出节选卡片，且内容来自书店 feed（用户可见层无回归）。')
process.exit(0)
