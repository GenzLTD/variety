/**
 * bolent-shelf/v1 → bookstore/v1 形状适配
 *
 * myblog 插件 `bolent-shelf-bridge` 产出：
 *   { protocol, site, count, total, page, limit, items[{ id, title, excerpt, url, categories[], … }] }
 *
 * 门户 prerender / Blog.vue 期望 bookstore/v1：
 *   { count, items[{ id, title, genre, excerpt, url }] }
 *
 * 缺口关闭：
 *   - genre：categories[0].name → 诗/词等；缺省按标签/标题启发式，再回落 DEFAULT_GENRE
 *   - url：默认权威域 /poem/<id>；可切 document（/blog/<slug|id>）或保留 permalink
 *   - id：一律 String()
 *   - excerpt：保持 string（normalizeItems 亦接受 string[]）
 */

const DEFAULT_GENRE = '文'
const KNOWN_GENRES = new Set(['诗', '词', '曲', '赋', '文', '散文', '小说', '随笔'])

/**
 * @param {string} [site]
 * @returns {string}
 */
export function authoritySite(site) {
  return String(site || process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://szbolent.com').replace(
    /\/+$/,
    ''
  )
}

/**
 * @param {unknown} raw
 * @returns {boolean}
 */
export function isBolentShelfFeed(raw) {
  if (!raw || typeof raw !== 'object') return false
  const o = /** @type {Record<string, unknown>} */ (raw)
  if (typeof o.protocol === 'string' && o.protocol.includes('bolent-shelf')) return true
  if (!Array.isArray(o.items) || !o.items.length) return false
  const first = /** @type {Record<string, unknown>} */ (o.items[0] || {})
  // bookstore 已有 genre；bolent-shelf 有 categories、无 genre
  if (first.genre != null && first.categories == null) return false
  if (Array.isArray(first.categories) || first.slug != null || first.word_count != null) return true
  return false
}

/**
 * @param {Record<string, unknown>} item
 * @returns {string}
 */
export function mapGenre(item) {
  const existing = String(item?.genre || '').trim()
  if (existing) return existing

  const cats = Array.isArray(item?.categories) ? item.categories : []
  for (const c of cats) {
    const name = String(c?.name || c?.slug || '').trim()
    if (!name || name === '未分类' || name.toLowerCase() === 'uncategorized') continue
    if (KNOWN_GENRES.has(name)) return name
    // 分类名含「诗/词」等单字也认
    for (const g of KNOWN_GENRES) {
      if (name.includes(g)) return g
    }
    return name
  }

  const tags = Array.isArray(item?.tags) ? item.tags : []
  for (const t of tags) {
    const name = String(t?.name || t?.slug || '').trim()
    if (KNOWN_GENRES.has(name)) return name
    for (const g of KNOWN_GENRES) {
      if (name.includes(g)) return g
    }
  }

  const title = String(item?.title || '')
  if (/词$|·/.test(title) || /调歌头|念奴娇|满江红|蝶恋花|沁园春/.test(title)) return '词'
  if (/诗$|绝句|律诗|古风/.test(title)) return '诗'

  return process.env.BOOKSTORE_DEFAULT_GENRE || DEFAULT_GENRE
}

/**
 * @param {Record<string, unknown>} item
 * @param {{ site?: string, urlMode?: string }} [opts]
 * @returns {string}
 */
export function mapItemUrl(item, opts = {}) {
  const site = authoritySite(opts.site)
  const mode = String(opts.urlMode || process.env.BOOKSTORE_URL_MODE || 'poem').toLowerCase()
  const id = String(item?.id ?? item?.slug ?? '').trim()
  const slug = String(item?.slug || '').trim()

  if (mode === 'permalink' || mode === 'document') {
    const raw = String(item?.url || '').trim()
    if (raw) {
      try {
        const u = new URL(raw, site)
        // .local / 旧权威域 → 公网权威域；路径保留（document/permalink）
        if (
          /\.local$/i.test(u.hostname) ||
          /(^|\.)szbolent\.(cn|com\.cn|com)$/i.test(u.hostname) ||
          u.hostname === 'localhost'
        ) {
          u.protocol = 'https:'
          u.hostname = new URL(site).hostname
        }
        if (mode === 'document' && id) {
          // 文档映射：权威域 /blog/<slug|id>
          return `${site}/blog/${encodeURIComponent(slug || id)}`
        }
        return u.toString()
      } catch {
        /* fall through */
      }
    }
    if (mode === 'document' && (slug || id)) {
      return `${site}/blog/${encodeURIComponent(slug || id)}`
    }
  }

  // 默认：门户诗词详情约定 /poem/<id>
  if (id) return `${site}/poem/${encodeURIComponent(id)}`
  return `${site}/blog`
}

/**
 * @param {unknown} excerpt
 * @returns {string | string[]}
 */
function mapExcerpt(excerpt) {
  if (Array.isArray(excerpt)) return excerpt.map((l) => String(l).trim()).filter(Boolean)
  return String(excerpt || '').trim()
}

/**
 * 单条 bolent-shelf item → bookstore item
 * @param {Record<string, unknown>} item
 * @param {{ site?: string, urlMode?: string }} [opts]
 */
export function mapBolentShelfItem(item, opts = {}) {
  const title = String(item?.title || '').trim()
  if (!title) return null
  const id = String(item?.id ?? item?.slug ?? title)
  return {
    id,
    title,
    genre: mapGenre(item),
    excerpt: mapExcerpt(item?.excerpt),
    url: mapItemUrl(item, opts),
  }
}

/**
 * 任意 feed JSON → bookstore/v1 { count, items }
 * 已是 bookstore 形状则透传（补齐 genre 缺省与 id 字符串）。
 * @param {unknown} raw
 * @param {{ site?: string, urlMode?: string }} [opts]
 */
export function toBookstoreFeed(raw, opts = {}) {
  const itemsIn = Array.isArray(/** @type {any} */ (raw)?.items)
    ? /** @type {any[]} */ (/** @type {any} */ (raw).items)
    : Array.isArray(raw)
      ? raw
      : []

  const mapped = itemsIn.map((item) => mapBolentShelfItem(item || {}, opts)).filter(Boolean)

  return {
    count: mapped.length,
    items: mapped,
  }
}
