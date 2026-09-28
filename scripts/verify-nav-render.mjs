#!/usr/bin/env node
/**
 * verify-nav-render.mjs — 「用户看得见」层的验收：门户顶部导航是否真的有菜单
 *
 * 由来（2026-09-28 两次假绿的直接产物）：
 *   ① Page Engine 从未部署 → /v1/menus 502 → Header.vue 的 navItems 为空；
 *   ② 前端 base 指向 https://api.genz.ltd → 浏览器请求的是 looma 的
 *      /v1/menus（实测 404 not_found），与门户 /v1/menus 是两条不同链路。
 *   ② 的可怕之处：curl 门户 /v1/menus 得到 200、验收全绿，而用户看到的导航
 *      仍然是空的。只有「真浏览器打开线上页」能一次看穿这两者。
 *
 * 断言（全部为硬断言）：
 *   A. 页面确实发起了 /v1/menus 请求（没有 → 前端根本没接上数据源）
 *   B. 该请求返回 200（404/502 → 数据源不可用）
 *   C. 该请求是同源（Host ≠ 站点 Host → 绕过了门户 nginx 的 /v1 分流）
 *   D. 桌面导航 DOM 里真的出现约定菜单标题（渲染层兜底）
 *
 * 用法：
 *   npm run verify:nav                                   # 默认线上 https://www.szbolent.cn/
 *   SITE_URL=http://localhost:4173/ npm run verify:nav   # 本地预览也适用
 * 退出码：0 = 全通过；1 = 有断言不过
 */
import { chromium } from 'playwright'

const SITE = process.env.SITE_URL || 'https://www.szbolent.cn/'
const EXPECT = (process.env.EXPECT_NAV || '首页,服务,案例,关于,联系').split(',')
const NAV_SEL = process.env.NAV_SELECTOR || 'nav.nav-desktop ul.nav-menu > li > a.nav-link'
const siteHost = new URL(SITE).host

const ok = (s) => { console.log(`\u001b[0;32m✅ PASS\u001b[0m  ${s}`); PASS++ }
const no = (s) => { console.log(`\u001b[0;31m❌ FAIL\u001b[0m  ${s}`); FAIL++; FAILED.push(s) }
let PASS = 0, FAIL = 0
const FAILED = []

console.log('='.repeat(44))
console.log('  门户顶部导航 — 真实浏览器渲染验收')
console.log(`  ${SITE}  (${new Date().toISOString().replace('T', ' ').slice(0, 19)})`)
console.log('='.repeat(44))
console.log('')

const browser = await chromium.launch()
const page = await browser.newPage()

// 菜单在 onMounted 里异步拉取，这里记录真实请求/响应当证据
const menuReqs = []
page.on('response', (r) => {
  if (r.url().includes('/v1/menus')) menuReqs.push({ url: r.url(), status: r.status() })
})
const consoleErrs = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()) })

let navTexts = []
try {
  await page.goto(SITE, { waitUntil: 'load', timeout: 45000 })
  // 等菜单渲染出来（出现即返回），最多 15s；不做「sleep 定长就判过」
  try { await page.waitForSelector(NAV_SEL, { timeout: 15000 }) } catch { /* 下面按空列表报错 */ }
  navTexts = await page.$$eval(NAV_SEL, (els) => els.map((e) => e.textContent.trim())).catch(() => [])
} catch (e) {
  no(`页面打开失败: ${e.message}`)
}

// A. 有没有真的去拉菜单
if (menuReqs.length === 0) {
  no('页面从未请求 /v1/menus（数据源没接上）')
} else {
  ok(`页面请求了 /v1/menus（${menuReqs.length} 次）`)
}

// B. 状态码
if (menuReqs.length > 0) {
  const bad = menuReqs.filter((r) => r.status !== 200)
  if (bad.length === 0) {
    ok(`/v1/menus 全部 200（数据源可用）`)
  } else {
    no(`/v1/menus 有非 200 响应: ${bad.map((r) => `${r.status} ${r.url}`).join(' | ')}`)
  }
}

// C. 同源（跨域 base 是「绕过 /v1 分流 → 菜单 404」的根因）
if (menuReqs.length > 0) {
  const offsite = menuReqs.filter((r) => { try { return new URL(r.url).host !== siteHost } catch { return true } })
  if (offsite.length === 0) {
    ok(`/v1/menus 请求全部同源（${siteHost}，走门户 nginx 分流）`)
  } else {
    no(`/v1/menus 请求打到了跨域地址: ${[...new Set(offsite.map((r) => new URL(r.url).host))].join(', ')}（应同源 ${siteHost}）`)
  }
}

// D. 渲染层：导航里真的有菜单项
const missing = EXPECT.filter((t) => !navTexts.includes(t))
if (navTexts.length === 0) {
  no('桌面导航里一个菜单项都没有（顶部导航为空）')
} else if (missing.length > 0) {
  no(`导航里缺少预期菜单项: ${missing.join(', ')}；实际: [${navTexts.join(', ')}]`)
} else {
  ok(`桌面导航渲染出 ${navTexts.length} 项: [${navTexts.join(', ')}]`)
}

if (consoleErrs.length > 0) {
  console.log('')
  console.log('  浏览器 console 错误（排查线索）：')
  consoleErrs.slice(0, 5).forEach((e) => console.log(`    - ${e.slice(0, 200)}`))
}

await browser.close()

console.log('')
console.log('='.repeat(44))
console.log(`  通过: ${PASS}   失败: ${FAIL}`)
if (FAIL > 0) {
  console.log(`  失败项: ${FAILED.join('; ')}`)
  console.log('='.repeat(44))
  console.log('')
  console.log('排查顺序：')
  console.log("  1) 服务端链路 → ssh 上跑 verify-prod.sh，看 /v1/menus 是否 200")
  console.log('  2) 前端 base  → dist/assets/*.js 里不该出现 https://api.genz.ltd 绝对地址')
  console.log('  3) 数据源    → curl 127.0.0.1:5300/v1/menus?product=szbolent 是否含菜单')
  process.exit(1)
}
console.log('='.repeat(44))
console.log('')
console.log('验收通过：顶部导航在真实浏览器里渲染出菜单（用户可见层无回归）。')
process.exit(0)
