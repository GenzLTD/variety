/**
 * GEO 共享目录 — sitemap / JSON-LD / verify 同源事实
 *
 * 只收录门户已公示内容：服务 slug（schema）、公开路径、可核对 FAQ。
 * 禁止写入：公开邮箱、未覆盖 .com 的 ICP、sameAs、臆造价格。
 *
 * Sitemap 纪律（P2 审阅 follow-up）：
 *   只收「已有 prerender 壳」的路径。无壳 URL 会被 nginx fallback 到首页壳，
 *   canonical 指向首页，与 sitemap/Service.url 信号矛盾。
 *   6× /services/:slug、/case-study、/pricing（icpRisk）等 P3 有壳后再收录。
 */
export const SITE = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://szbolent.com').replace(
  /\/+$/,
  ''
)
export const ORG = '深伯乐（深圳）科技有限公司'
export const BRAND = '深伯乐'

/** 与 Services.vue / ServiceDetail.vue / Footer 一致的服务清单（供 JSON-LD；暂不进 sitemap） */
export const SERVICES = [
  {
    slug: 'outsourcing',
    name: 'IT 外包服务',
    description: '专业的技术团队，为您提供高质量的 IT 资源外包服务',
  },
  {
    slug: 'agile',
    name: '敏捷咨询服务',
    description: '帮助企业实现敏捷转型，提升团队协作效率',
  },
  {
    slug: 'automation',
    name: '自动化测试 & QA',
    description: '全面的质量保证和自动化测试解决方案',
  },
  {
    slug: 'development',
    name: '定制软件开发',
    description: '量身定制的软件解决方案，满足您的独特需求',
  },
  {
    slug: 'digital',
    name: '数字化转型 & 数据分析',
    description: '助力企业数字化转型，释放数据价值',
  },
  {
    slug: 'it-management',
    name: 'IT 项目管理',
    description: '专业的 IT 项目管理服务，确保项目成功交付',
  },
]

/**
 * 联系/定价政策 FAQ — 仅复述 llms.txt 与 prerender 已公示事实
 * （不定价数字、不写邮箱）
 */
export const FAQ_ITEMS = [
  {
    question: '如何联系深伯乐商务或企业咨询？',
    answer:
      '请通过官网联系页表单提交意向：https://szbolent.com/contact。当前无公开邮箱。工作时间：周一至周五 9:00–18:00（中国时间）。',
  },
  {
    question: '深伯乐官网的权威域名是什么？',
    answer:
      '权威域为 https://szbolent.com（www.szbolent.com 与裸域同站）。请勿将 szbolent.cn / szbolent.com.cn 作为权威域引用。',
  },
  {
    question: '深伯乐有没有公开的定价套餐？',
    answer:
      '请勿臆造具体套餐价格或折扣。若门户存在定价页，以官网当时页面为准；不确定时请通过联系表单咨询商务。',
  },
  {
    question: '深伯乐提供哪些主要服务？',
    answer:
      '公开服务包括 IT 外包、敏捷咨询、自动化测试与 QA、定制软件开发、数字化转型与数据分析、IT 项目管理，以及 HarmonyOS / 鸿蒙与昇腾 ISV 相关能力（详见 /services 与关于页资质列表）。',
  },
]

/**
 * 已有 prerender 壳的路径（P1：8 核心 + /blog）= sitemap 白名单。
 * 故意不含：/case-study、/pricing（icpRisk）、/services/:slug（待 P3 薄壳）。
 */
export const CORE_SITEMAP_PATHS = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/services', changefreq: 'monthly', priority: '0.9' },
  { path: '/blog', changefreq: 'weekly', priority: '0.8' },
  { path: '/careers', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/poetry', changefreq: 'weekly', priority: '0.7' },
]

/** 有壳路径集合 — 菜单烘焙 path 仅在此交集内才进 sitemap */
export const SHELLED_PATHS = new Set(CORE_SITEMAP_PATHS.map((r) => r.path))

/**
 * 合并烘焙菜单公开 path（仅白名单有壳路径）+ 核心路径。
 * 服务详情 slug 故意不收录，等 P3 prerender 壳落地。
 * @param {Array<{ path?: string, visibleTo?: string }> | null | undefined} menuItems
 */
export function buildSitemapEntries(menuItems) {
  const byPath = new Map()

  for (const row of CORE_SITEMAP_PATHS) {
    byPath.set(row.path, { ...row })
  }

  if (Array.isArray(menuItems)) {
    for (const item of menuItems) {
      if (!item || item.visibleTo === 'private') continue
      const path = normalizePath(item.path)
      if (!path || path.includes(':') || path.includes('*')) continue
      // 无壳菜单项（如 /case-study）不抢跑进 sitemap
      if (!SHELLED_PATHS.has(path)) continue
      if (!byPath.has(path)) {
        byPath.set(path, { path, changefreq: 'monthly', priority: '0.6' })
      }
    }
  }

  const rank = (p) => {
    if (p === '/') return 0
    if (p === '/services') return 1
    return 10
  }

  return [...byPath.values()].sort((a, b) => {
    const d = rank(a.path) - rank(b.path)
    if (d !== 0) return d
    return a.path.localeCompare(b.path)
  })
}

function normalizePath(raw) {
  if (!raw || typeof raw !== 'string') return null
  let p = raw.trim()
  if (!p.startsWith('/')) p = '/' + p
  if (p.length > 1) p = p.replace(/\/+$/, '')
  return p
}

/** 构建日 YYYY-MM-DD，默认 Asia/Shanghai（避免 UTC 慢一天） */
export function isoDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}
