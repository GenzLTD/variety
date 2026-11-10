/**
 * GEO P2 JSON-LD 片段构建（Service / FAQPage / BreadcrumbList）
 * 与 geo-catalog 同源；不写邮箱 / ICP / sameAs。
 */
import { BRAND, FAQ_ITEMS, ORG, SERVICES, SITE } from './geo-catalog.mjs'

export function serviceNodes() {
  return SERVICES.map((s) => ({
    '@type': 'Service',
    '@id': `${SITE}/services/${s.slug}#service`,
    name: s.name,
    description: s.description,
    url: `${SITE}/services/${s.slug}`,
    provider: { '@id': `${SITE}/#organization` },
    areaServed: 'CN',
    availableLanguage: 'zh-CN',
  }))
}

/** 首页 /services 用的服务目录图节点（不含 Organization 本体） */
export function offerCatalogNode() {
  return {
    '@type': 'OfferCatalog',
    '@id': `${SITE}/#services`,
    name: `${BRAND}服务目录`,
    itemListElement: SERVICES.map((s, i) => ({
      '@type': 'OfferCatalog',
      name: s.name,
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: { '@id': `${SITE}/services/${s.slug}#service` },
          url: `${SITE}/services/${s.slug}`,
          position: i + 1,
        },
      ],
    })),
  }
}

export function faqPageGraph() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE}/contact#faq`,
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
    about: { '@id': `${SITE}/#organization` },
    inLanguage: 'zh-CN',
  }
}

/**
 * @param {Array<{ name: string, path: string }>} crumbs path 为站点相对路径，'/' 表示首页
 */
export function breadcrumbList(crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.path === '/' ? `${SITE}/` : `${SITE}${c.path}`,
    })),
  }
}

export function servicesPageGraph() {
  return [
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': `${SITE}/services#webpage`,
          url: `${SITE}/services`,
          name: `我们的服务 | ${BRAND}`,
          isPartOf: { '@id': `${SITE}/#website` },
          about: { '@id': `${SITE}/#organization` },
          mainEntity: { '@id': `${SITE}/#services` },
          inLanguage: 'zh-CN',
        },
        offerCatalogNode(),
        ...serviceNodes(),
      ],
    },
    breadcrumbList([
      { name: BRAND, path: '/' },
      { name: '服务', path: '/services' },
    ]),
  ]
}

export function contactPageExtraGraphs() {
  return [
    faqPageGraph(),
    breadcrumbList([
      { name: BRAND, path: '/' },
      { name: '联系', path: '/contact' },
    ]),
  ]
}

export function aboutBreadcrumb() {
  return breadcrumbList([
    { name: BRAND, path: '/' },
    { name: '关于我们', path: '/about' },
  ])
}

/** 序列化为可嵌入 <script type="application/ld+json"> 的文本（紧凑但可读） */
export function stringifyJsonLd(obj) {
  return JSON.stringify(obj, null, 2)
}

export { ORG, BRAND, SITE, SERVICES, FAQ_ITEMS }
