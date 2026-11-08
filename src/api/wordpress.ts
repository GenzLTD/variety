/**
 * WordPress REST API 工具
 * 职责边界：只读 posts / categories / tags；不做诗词/认证/支付。
 */
import DOMPurify from 'dompurify'

const WP_API_BASE = import.meta.env.VITE_BLOG_API_BASE || '/wp-json/wp/v2'

const WIN1252_TO_BYTE: Record<number, number> = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84,
  0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88,
  0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C,
  0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93,
  0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B,
  0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F,
}

/**
 * 修复 WordPress REST API 返回的 "UTF-8 字节被当作 Windows-1252 字符编码成 Unicode 转义序列" 导致的乱码。
 * 当 WordPress 把中文字符的 UTF-8 字节（如 0xE4 0xB8 0x96）以 \u00e4\u00b8\u2013 形式输出时，
 * 浏览器 JSON.parse 会得到 Windows-1252 误解码的字符串。本函数把字符映射回字节，再按 UTF-8 解码。
 */
function decodeUtf8Mojibake(str: string): string {
  if (!str || typeof str !== 'string') return str

  // 如果字符串中包含真正的 CJK 或其他 Unicode 字符，说明已经正确解码，直接返回
  for (const c of str) {
    const cp = c.codePointAt(0) ?? 0
    if (cp > 0xFF && !(cp in WIN1252_TO_BYTE)) return str
  }

  const bytes: number[] = []
  for (const c of str) {
    const cp = c.codePointAt(0) ?? 0
    if (cp in WIN1252_TO_BYTE) {
      bytes.push(WIN1252_TO_BYTE[cp])
    } else if (cp <= 0xFF) {
      bytes.push(cp)
    } else {
      // 遇到无法映射的 Unicode 字符，放弃解码，返回原文
      return str
    }
  }

  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes))
    return decoded
  } catch {
    return str
  }
}

/**
 * 递归修复 WordPress API 响应中所有字符串字段的编码问题。
 */
function fixWordPressEncoding<T>(data: T): T {
  if (typeof data === 'string') {
    return decodeUtf8Mojibake(data) as unknown as T
  }

  if (Array.isArray(data)) {
    return data.map(item => fixWordPressEncoding(item)) as unknown as T
  }

  if (data !== null && typeof data === 'object') {
    const result: Record<string, unknown> = {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = fixWordPressEncoding((data as Record<string, unknown>)[key])
      }
    }
    return result as T
  }

  return data
}

export interface WPPost {
  id: number
  date: string
  date_gmt: string
  modified: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  excerpt: {
    rendered: string
    protected: boolean
  }
  author: number
  featured_media: number
  comment_status: string
  categories: number[]
  tags: number[]
  _embedded?: {
    author?: Array<{
      id: number
      name: string
      description: string
      avatar_urls: Record<string, string>
    }>
    'wp:featuredmedia'?: Array<{
      id: number
      source_url: string
      alt_text: string
      media_details: {
        width: number
        height: number
      }
    }>
    'wp:term'?: Array<Array<{
      id: number
      name: string
      slug: string
    }>>
  }
}

export interface WPCategory {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
  parent: number
}

export interface WPTag {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
}

export interface PostsQuery {
  page?: number
  per_page?: number
  search?: string
  categories?: number[]
  tags?: number[]
  author?: number
  orderby?: 'date' | 'relevance' | 'id' | 'title'
  order?: 'asc' | 'desc'
}

/**
 * 获取文章列表
 */
export async function getPosts(query: PostsQuery = {}): Promise<{
  posts: WPPost[]
  total: number
  totalPages: number
}> {
  const params = new URLSearchParams()
  
  // 默认参数
  params.append('_embed', '1') // 包含作者、特色图片等信息
  params.append('per_page', String(query.per_page || 10))
  params.append('page', String(query.page || 1))
  
  if (query.search) params.append('search', query.search)
  if (query.categories?.length) params.append('categories', query.categories.join(','))
  if (query.tags?.length) params.append('tags', query.tags.join(','))
  if (query.author) params.append('author', String(query.author))
  if (query.orderby) params.append('orderby', query.orderby)
  if (query.order) params.append('order', query.order)

  try {
    const response = await fetch(`${WP_API_BASE}/posts?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error(`WordPress API 错误: ${response.status}`)
    }

    const posts = fixWordPressEncoding(await response.json())
    const total = parseInt(response.headers.get('X-WP-Total') || '0')
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0')

    return {
      posts,
      total,
      totalPages
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
    throw error
  }
}

/**
 * 获取单篇文章（通过 ID）
 */
export async function getPostById(id: number): Promise<WPPost> {
  try {
    const response = await fetch(`${WP_API_BASE}/posts/${id}?_embed=1`)
    
    if (!response.ok) {
      throw new Error(`WordPress API 错误: ${response.status}`)
    }

    return fixWordPressEncoding(await response.json())
  } catch (error) {
    console.error('获取文章详情失败:', error)
    throw error
  }
}

/**
 * 获取单篇文章（通过 slug）
 */
export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  try {
    const response = await fetch(`${WP_API_BASE}/posts?slug=${slug}&_embed=1`)
    
    if (!response.ok) {
      throw new Error(`WordPress API 错误: ${response.status}`)
    }

    const posts = fixWordPressEncoding(await response.json())
    return posts.length > 0 ? posts[0] : null
  } catch (error) {
    console.error('获取文章详情失败:', error)
    throw error
  }
}

/**
 * 获取分类列表
 */
export async function getCategories(): Promise<WPCategory[]> {
  try {
    const response = await fetch(`${WP_API_BASE}/categories?per_page=100`)
    
    if (!response.ok) {
      throw new Error(`WordPress API 错误: ${response.status}`)
    }

    return fixWordPressEncoding(await response.json())
  } catch (error) {
    console.error('获取分类列表失败:', error)
    throw error
  }
}

/**
 * 获取标签列表
 */
export async function getTags(): Promise<WPTag[]> {
  try {
    const response = await fetch(`${WP_API_BASE}/tags?per_page=100`)
    
    if (!response.ok) {
      throw new Error(`WordPress API 错误: ${response.status}`)
    }

    return fixWordPressEncoding(await response.json())
  } catch (error) {
    console.error('获取标签列表失败:', error)
    throw error
  }
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * 提取纯文本摘要（移除 HTML 标签）
 */
export function extractExcerpt(html: string, maxLength = 150): string {
  const text = html.replace(/<[^>]*>/g, '').trim()
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * HTML 消毒 — 防 XSS（DOMPurify）
 * WordPress `content.rendered` / 摘要进门户前必须过此函数。
 */
export function sanitizeHTML(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  })
}

/**
 * 书店 feed（同源 `bookstore/v1`）
 * 只取节选：id / title / genre / excerpt（诗句数组）/ url。
 * 卡片跳转 url 回原文，不请求 `/poem/<id>` 全文。
 *
 * 基址必须是**同源相对路径**：生产由 nginx 把 /wp-json 转发到 127.0.0.1:8080
 * （单机内部组网），dev 由 vite proxy 转发到 :8800。写成绝对 URL = 跨域，
 * 浏览器会被 CORS 拦下，等于书店栏目直接降级成「暂无文章」。
 */

const SHELF_API_BASE = import.meta.env.VITE_SHELF_API_BASE || '/wp-json/bookstore/v1'

export interface ShelfFeedItem {
  id: string
  title: string
  genre: string
  excerpt: string
  url: string
}

interface BookstoreFeedRawItem {
  id?: string
  title?: string
  genre?: string
  excerpt?: string[] | string
  url?: string
}

export interface ShelfFeedResponse {
  count: number
  items: ShelfFeedItem[]
}

export interface ShelfFeedQuery {
  /** 书店 feed 只接受 limit（1–200），没有页码。 */
  limit?: number
}

function joinPoemExcerpt(excerpt: string[] | string | undefined): string {
  if (Array.isArray(excerpt)) return excerpt.map(line => line.trim()).filter(Boolean).join('\n')
  return (excerpt || '').trim()
}

/**
 * 拉取书店节选 feed，并收成橱窗卡片。
 */
export async function getShelfFeed(query: ShelfFeedQuery = {}): Promise<ShelfFeedResponse> {
  const limit = Math.min(200, Math.max(1, query.limit ?? 50))
  const url = `${SHELF_API_BASE}/feed?limit=${limit}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`书店 feed 错误: ${response.status}`)
    }

    const raw = fixWordPressEncoding(await response.json()) as {
      count?: number
      items?: BookstoreFeedRawItem[]
    }
    const items = (raw.items || [])
      .filter((item): item is BookstoreFeedRawItem & { url: string; title: string } =>
        Boolean(item?.url && item?.title))
      .map(item => ({
        id: String(item.id || item.url),
        title: item.title,
        genre: item.genre || '',
        excerpt: joinPoemExcerpt(item.excerpt),
        url: item.url,
      }))

    return { count: raw.count ?? items.length, items }
  } catch (error) {
    console.error('获取书店 feed 失败:', error)
    throw error
  }
}
