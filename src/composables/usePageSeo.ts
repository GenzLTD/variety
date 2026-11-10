/**
 * 客户端每页 SEO：title / description / canonical / OG
 * 与构建期 prerender 壳同源字段；hydration 后路由切换时更新。
 */
import { seoConfig } from '@/config/company'

export interface PageSeoInput {
  title?: string
  description?: string
  /** 路径，如 /about；默认 location.pathname */
  path?: string
}

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function applyPageSeo(input: PageSeoInput = {}) {
  const pageTitle = input.title?.trim() || ''
  const title = pageTitle
    ? seoConfig.titleTemplate.replace('%s', pageTitle)
    : seoConfig.defaultTitle
  const description = (input.description || seoConfig.defaultDescription).trim()
  const path = input.path ?? (typeof location !== 'undefined' ? location.pathname : '/')
  const canonicalPath = path === '/' ? '/' : path.replace(/\/+$/, '') || '/'
  const canonical = `${seoConfig.siteUrl.replace(/\/+$/, '')}${canonicalPath === '/' ? '/' : canonicalPath}`

  if (typeof document === 'undefined') return { title, description, canonical }

  document.title = title
  upsertMeta('meta[name="description"]', 'name', 'description', description)
  upsertMeta('meta[property="og:title"]', 'property', 'og:title', title)
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', description)
  upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical)
  upsertCanonical(canonical)

  return { title, description, canonical }
}
