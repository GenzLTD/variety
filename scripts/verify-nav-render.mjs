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
 * 2026-10-06 改：菜单烘焙进构建（src/menus/<product>.json，源头是
 *   backend/migrations 里的 share_menus 种子），运行时不再请求 /v1/menus。
 *   因此网络层断言从「必须有这个请求且 200」翻转为「绝不该有这个请求」，
 *   渲染层断言继续盯 DOM —— 用户看得见的东西没变，验收只会更硬。
 *
 * 断言（全部为硬断言）：
 *   A. 页面**不得**发起 /v1/menus 请求（有 → 菜单烘焙被回退，5300 未部署必空导航）
 *   B. 桌面导航 DOM 里真的出现约定菜单标题（渲染层，最终判据）
 *
 * 用法：
 *   npm run verify:nav                                   # 默认线上 https://szbolent.com.cn/
 *   SITE_URL=http://localhost:4173/ npm run verify:nav   # 本地预览也适用
 *
 * 默认站点（2026-10-04 订正）：门户橱窗是 szbolent.com.cn；www.szbolent.cn 会 301
 * 到 szbolent.cn，那是阿里云上的 WordPress 书店源站，上面没有门户的 nav ——
 * 默认值写错站点，等于在验一台不相关的机器。
 * 退出码：0 = 全通过；1 = 有断言不过
 */
import { chromium } from 'playwright'

const SITE = process.env.SITE_URL || 'https://szbolent.com.cn/'
const EXPECT = (process.env.EXPECT_NAV || '首页,服务,案例,关于,联系').split(',')
const NAV_SEL = process.env.NAV_SELECTOR || 'nav.nav-desktop ul.nav-menu > li > a.nav-link'

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

// 菜单已烘焙进构建（src/menus/<product>.json），不再有 /v1/menus 请求。
// 这里反过来盯死它：**出现** /v1/menus 请求说明烘焙被回退了，必须红。
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

// A. 烘焙后不该再有 /v1/menus 请求（有 → 菜单回退到运行时接口，5300 从未部署，必 404）
if (menuReqs.length === 0) {
  ok('页面没有请求 /v1/menus（菜单已烘焙进构建，无运行时菜单依赖）')
} else {
  no(
    `页面仍在请求 /v1/menus（${menuReqs.length} 次：${menuReqs
      .map((r) => `${r.status} ${r.url}`)
      .join(' | ')}）——菜单烘焙被回退了，5300 未部署，导航会空`
  )
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
  console.log('  1) 菜单真源  → src/menus/szbolent.json 是否由 node scripts/gen-menus.mjs 生成且与种子同步')
  console.log('  2) 取数点    → src/composables/useDynamicRouter.ts 应走 getBakedMenu()，不是 apiGet')
  console.log('  3) 渲染层    → Header.vue 的 navItems 是否拿到 menus，NAV_SELECTOR 选择器是否仍匹配')
  process.exit(1)
}
console.log('='.repeat(44))
console.log('')
console.log('验收通过：顶部导航在真实浏览器里渲染出菜单（用户可见层无回归）。')
process.exit(0)
