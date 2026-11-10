#!/usr/bin/env node
/**
 * prerender-core.mjs — GEO P1 核心路由可爬 HTML 壳
 *
 * 相对 tip：不引入全站 SSR；构建后基于 dist/index.html 写出各路径
 * `dist/<path>/index.html`（首页写回 `dist/index.html`），把公司全称与
 * 服务摘要嵌进 `#app`。爬虫无 JS 可读；浏览器 hydration 后由 Vue 接管。
 *
 * 路由：/ /about /services /contact /careers /privacy /terms /poetry
 * `/blog` 由 prerender-bookstore.mjs 负责（本脚本之后运行可覆盖）。
 *
 * 事实策略（对齐 P0）：不写未核验公开邮箱、不写未覆盖 .com 的 ICP。
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { escapeHtml, injectSeoAndBody } from './lib/prerender-html.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = join(ROOT, 'dist')
const SITE = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://szbolent.com').replace(/\/+$/, '')

const ORG = '深伯乐（深圳）科技有限公司'
const BRAND = '深伯乐'

/** @type {Array<{ path: string, title: string, description: string, body: string }>} */
const PAGES = [
  {
    path: '/',
    title: `${BRAND} — HarmonyOS 生态服务商`,
    description:
      '深伯乐（深圳）科技有限公司 — 融合科技与人文的数智企业，提供软件开发、数字化、IT 管理及 AI 读诗；HarmonyOS 生态与昇腾 ISV 认证服务商。',
    body: `<main id="prerender-core" data-prerender="home">
  <header>
    <h1>${escapeHtml(BRAND)}</h1>
    <p>${escapeHtml(ORG)} — 以工程精度交付价值，以人文视角连接未来。</p>
  </header>
  <section>
    <h2>核心服务</h2>
    <ul>
      <li>HarmonyOS / 鸿蒙应用开发与生态适配</li>
      <li>昇腾 ISV 认证交付与算力方案集成</li>
      <li>软件开发、数字化转型、IT 管理与外包</li>
      <li>AI 读诗与诗词鉴赏入口</li>
    </ul>
  </section>
  <section>
    <h2>资质背书</h2>
    <p>HarmonyOS 开发者；鸿蒙生态合作伙伴；OpenHarmony 贡献者；昇腾 ISV 认证服务商。</p>
  </section>
  <nav>
    <a href="${SITE}/about">关于我们</a> ·
    <a href="${SITE}/services">服务</a> ·
    <a href="${SITE}/contact">联系</a> ·
    <a href="${SITE}/blog">书店</a> ·
    <a href="${SITE}/poetry">诗词</a>
  </nav>
  <p>权威域 <a href="${SITE}/">${SITE}</a>。导读 <a href="${SITE}/llms.txt">/llms.txt</a>。</p>
</main>`,
  },
  {
    path: '/about',
    title: `关于我们 | ${BRAND}`,
    description: `${ORG}简介：数智企业、HarmonyOS 生态与昇腾 ISV 认证服务商。`,
    body: `<main id="prerender-core" data-prerender="about">
  <header><h1>关于我们</h1></header>
  <p>${escapeHtml(ORG)}是一家融合现代科技与文化底蕴的数智企业。我们提供软件开发、数字化、自动化、IT 管理与 IT 外包等服务，并以 AI 读诗为特色板块。</p>
  <h2>成立</h2>
  <p>创立于 2026 年。</p>
  <h2>公开资质</h2>
  <ul>
    <li>HarmonyOS 开发者</li>
    <li>鸿蒙生态合作伙伴</li>
    <li>OpenHarmony 贡献者</li>
    <li>昇腾 ISV 认证服务商</li>
  </ul>
  <p>联系与企业咨询请访问 <a href="${SITE}/contact">${SITE}/contact</a>。</p>
</main>`,
  },
  {
    path: '/services',
    title: `我们的服务 | ${BRAND}`,
    description: `${ORG}服务：IT 外包、敏捷咨询、测试、项目管理、HarmonyOS 与昇腾方案。`,
    body: `<main id="prerender-core" data-prerender="services">
  <header><h1>我们的服务</h1></header>
  <p>${escapeHtml(ORG)}提供全方位 IT 服务，以工程精度交付项目。</p>
  <ul>
    <li>IT 外包服务 — 专业技术团队与资源外包</li>
    <li>敏捷咨询服务 — 流程改进与交付效能</li>
    <li>测试与质量保障 — 自动化与质量度量</li>
    <li>项目管理 — 工程化交付与风险管理</li>
    <li>HarmonyOS / 鸿蒙开发与硬件适配</li>
    <li>昇腾算力与 ISV 认证交付链路</li>
  </ul>
  <p>了解合作请前往 <a href="${SITE}/contact">联系页</a>。</p>
</main>`,
  },
  {
    path: '/contact',
    title: `联系我们 | ${BRAND}`,
    description: `联系${ORG}：企业咨询请使用官网联系表单。权威域 szbolent.com。`,
    body: `<main id="prerender-core" data-prerender="contact">
  <header><h1>联系我们</h1></header>
  <p>${escapeHtml(ORG)}欢迎商务与企业咨询。</p>
  <p>工作时间：周一至周五 9:00–18:00（中国时间）。</p>
  <p>当前无公开邮箱；请通过官网联系表单提交意向：
    <a href="${SITE}/contact">${SITE}/contact</a>（本页表单需浏览器启用脚本）。</p>
  <p>请勿向未公示渠道发送敏感信息。权威域 https://szbolent.com。</p>
</main>`,
  },
  {
    path: '/careers',
    title: `加入我们 | ${BRAND}`,
    description: `${ORG}招聘与岗位信息。`,
    body: `<main id="prerender-core" data-prerender="careers">
  <header><h1>加入我们</h1></header>
  <p>${escapeHtml(ORG)}欢迎认同工程精度与人文视角的伙伴加入。</p>
  <p>岗位详情请在启用脚本后浏览本页列表，或通过 <a href="${SITE}/contact">联系页</a> 咨询。</p>
</main>`,
  },
  {
    path: '/privacy',
    title: `隐私政策 | ${BRAND}`,
    description: `${ORG}隐私政策摘要。`,
    body: `<main id="prerender-core" data-prerender="privacy">
  <header><h1>隐私政策</h1></header>
  <p>本政策适用于 ${escapeHtml(ORG)} 运营的 https://szbolent.com。</p>
  <p>我们仅收集提供服务所必要的信息，并采取合理安全措施保护您的数据。完整条款请在浏览器中查看本页。</p>
</main>`,
  },
  {
    path: '/terms',
    title: `服务条款 | ${BRAND}`,
    description: `${ORG}网站服务条款。`,
    body: `<main id="prerender-core" data-prerender="terms">
  <header><h1>服务条款</h1></header>
  <p>https://szbolent.com 由 ${escapeHtml(ORG)} 运营，是智能化诗词鉴赏与数智企业服务门户。</p>
  <p>使用本站即表示您同意遵守中华人民共和国法律法规。完整条款请在浏览器中查看本页。</p>
</main>`,
  },
  {
    path: '/poetry',
    title: `诗词鉴赏 | ${BRAND}`,
    description: `${ORG}诗词鉴赏入口：浏览、检索与 AI 读诗能力由门户与宿主 API 提供。`,
    body: `<main id="prerender-core" data-prerender="poetry">
  <header><h1>诗词鉴赏</h1></header>
  <p>${escapeHtml(ORG)}门户提供诗词浏览与鉴赏入口。完整交互需启用脚本；内容经本站公开页面呈现。</p>
  <p>返回 <a href="${SITE}/">首页</a> 或前往 <a href="${SITE}/blog">书店节选</a>。</p>
</main>`,
  },
]

function outPathFor(urlPath) {
  if (urlPath === '/') return join(DIST, 'index.html')
  const seg = urlPath.replace(/^\//, '').replace(/\/+$/, '')
  const dir = join(DIST, seg)
  mkdirSync(dir, { recursive: true })
  return join(dir, 'index.html')
}

function main() {
  const shellPath = join(DIST, 'index.html')
  if (!existsSync(shellPath)) {
    console.error('[prerender-core] 缺少 dist/index.html，请先 vite build')
    process.exit(1)
  }
  // 首页会写回 index.html；先读「干净」壳（vite 产物）。对非首页用同一底稿。
  const baseHtml = readFileSync(shellPath, 'utf8')

  for (const page of PAGES) {
    const canonical = page.path === '/' ? `${SITE}/` : `${SITE}${page.path}`
    const html = injectSeoAndBody(baseHtml, {
      title: page.title,
      description: page.description,
      canonical,
      ogTitle: page.title,
      body: page.body,
    })
    const out = outPathFor(page.path)
    writeFileSync(out, html, 'utf8')
    console.log(`[prerender-core] wrote ${out}`)
  }
  console.log(`[prerender-core] ${PAGES.length} pages @ ${SITE}`)
}

main()
