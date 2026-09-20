/**
 * 诗词数据访问客户端（Looma 后端）
 *
 * 数据真源：looma-zervi `backend/data/looma.db`（poems 表）+ ChromaDB 向量检索
 * 门户通过 HTTP 调用 Looma 的 `/v1/poetry/*` 路由；路由内部调用 db/manager.py，不是独立外部 API。
 *
 * 契约参考：looma-zervi/backend/src/api/routes/poetry_routes.py
 */
import axios from 'axios'

/** 生产填 https://api.genz.ltd；本地留空走 vite proxy /v1 → :5200 */
const LOOMA_BASE = (import.meta.env.VITE_LOOMA_API_BASE ?? '').replace(/\/$/, '')

function v1(path: string): string {
  return `${LOOMA_BASE}/v1/poetry${path}`
}

// ── Looma 原始响应类型（与 SQLite 字段对齐）──

export interface LoomaPoemBrowseItem {
  id: number
  title: string
  author: string
  dynasty: string
  theme: string
  content_preview: string
  tags?: string
}

export interface LoomaBrowseResponse {
  items: LoomaPoemBrowseItem[]
  total: number
  page: number
  per_page: number
}

export interface LoomaPoemDetail {
  id: number
  title: string
  author: string
  dynasty: string
  theme: string
  content: string
  tags?: string
  source?: string
  created_at?: string
}

export interface LoomaRandomItem {
  id: number
  title: string
  author: string
  dynasty: string
  theme: string
  content_preview: string
}

export interface LoomaSearchHit {
  title: string
  author: string
  dynasty: string
  content: string
  theme?: string
}

// ── 门户视图层类型（兼容现有 Vue 页面，字段 Looma 暂无的用默认值）──

export interface PoemAuthor {
  id: number
  name: string
  dynasty: string
}

export interface Poem {
  id: number
  title: string
  content: string
  dynasty: string
  category: string
  theme: string
  season: string
  appreciation?: string
  translation?: string
  quality_score: number
  popularity_score: number
  like_count: number
  favorite_count: number
  view_count: number
  author: PoemAuthor
}

export interface Poet {
  id: number
  name: string
  dynasty: string
  birth_year: number
  death_year: number
  zi?: string
  hao?: string
  bio: string
  poem_count: number
  quality_score: number
  view_count: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// 诗人 id ↔ 姓名（browse 聚合时填充；Looma 无独立 poets 表）
const authorByPoetId = new Map<number, string>()

function authorToPoetId(author: string): number {
  let hash = 0
  for (let i = 0; i < author.length; i++) {
    hash = (hash << 5) - hash + author.charCodeAt(i)
    hash |= 0
  }
  const id = Math.abs(hash) || 1
  authorByPoetId.set(id, author)
  return id
}

function poetIdToAuthor(poetId: number): string | undefined {
  return authorByPoetId.get(poetId)
}

function toPoem(
  row: LoomaPoemBrowseItem | LoomaPoemDetail | LoomaRandomItem | LoomaSearchHit,
  opts?: { fullContent?: string },
): Poem {
  const authorName = row.author ?? ''
  const content =
    opts?.fullContent ??
    (('content' in row && row.content ? row.content : '') ||
      ('content_preview' in row ? row.content_preview : '') ||
      '')

  return {
    id: 'id' in row && typeof row.id === 'number' ? row.id : 0,
    title: row.title,
    content,
    dynasty: row.dynasty ?? '',
    category: row.theme ?? '',
    theme: row.theme ?? '',
    season: '',
    quality_score: 0,
    popularity_score: 0,
    like_count: 0,
    favorite_count: 0,
    view_count: 0,
    author: {
      id: authorToPoetId(authorName),
      name: authorName,
      dynasty: row.dynasty ?? '',
    },
  }
}

function paginate<T>(items: T[], page: number, perPage: number): PaginatedResponse<T> {
  const total = items.length
  const total_pages = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage
  return {
    items: items.slice(start, start + perPage),
    total,
    page,
    per_page: perPage,
    total_pages,
  }
}

// ── 对外 API（名称保留，供 views/poetry/* 使用）──

export const poetryApi = {
  /** 浏览列表 → Looma GET /v1/poetry/browse */
  async getPoems(params: {
    page?: number
    per_page?: number
    dynasty?: string
    theme?: string
    /** legacy bolent 字段；Looma 无 season，作为 keyword 辅助检索 */
    season?: string
    author_id?: number
    search?: string
    sort_by?: string
    order?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<Poem>> {
    const page = params.page ?? 1
    const per_page = Math.min(params.per_page ?? 20, 50)

    const query: Record<string, string | number> = { page, per_page }
    if (params.dynasty) query.dynasty = params.dynasty
    if (params.theme) query.theme = params.theme
    if (params.search) query.keyword = params.search
    if (params.season) query.keyword = params.season

    const author = params.author_id ? poetIdToAuthor(params.author_id) : undefined
    if (author) query.author = author

    const { data } = await axios.get<LoomaBrowseResponse>(v1('/browse'), { params: query })
    const items = data.items.map((row) => toPoem(row))
    const total_pages = Math.max(1, Math.ceil(data.total / data.per_page))

    return {
      items,
      total: data.total,
      page: data.page,
      per_page: data.per_page,
      total_pages,
    }
  },

  /** 单篇详情 → Looma GET /v1/poetry/:id */
  async getPoem(id: number): Promise<Poem> {
    const { data } = await axios.get<LoomaPoemDetail>(v1(`/${id}`))
    return toPoem(data, { fullContent: data.content })
  },

  /** 随机发现 → Looma GET /v1/poetry/random */
  async getRandom(_params?: { dynasty?: string; season?: string; theme?: string }): Promise<Poem> {
    const count = 1
    const { data } = await axios.get<{ results: LoomaRandomItem[]; count: number }>(
      v1('/random'),
      { params: { count } },
    )
    const row = data.results[0]
    if (!row) throw new Error('no poems in collection')
    return toPoem(row, { fullContent: row.content_preview })
  },

  /** 语义搜索 → Looma GET /v1/poetry/search */
  async search(q: string, n = 10): Promise<Poem[]> {
    const { data } = await axios.get<{ results: LoomaSearchHit[]; query: string; count: number }>(
      v1('/search'),
      { params: { q, n } },
    )
    return data.results.map((row) => toPoem(row))
  },

  /** 集合统计 → Looma GET /v1/poetry/stats */
  async getStats(): Promise<{ total: number; dynasties: Array<{ name: string; count: number }> }> {
    const { data } = await axios.get<{
      total: number
      dynasties: Array<{ name: string; count: number }>
      themes: Array<{ name: string; count: number }>
    }>(v1('/stats'))
    return { total: data.total, dynasties: data.dynasties }
  },

  /**
   * 诗人列表（客户端从 browse 结果聚合；Looma 无 poets 表）
   * 拉取若干页 browse 后按 author 去重。
   */
  async getPoets(params?: {
    page?: number
    per_page?: number
    dynasty?: string
    search?: string
  }): Promise<PaginatedResponse<Poet>> {
    const page = params?.page ?? 1
    const per_page = params?.per_page ?? 24
    const dynasty = params?.dynasty

    const authorMap = new Map<string, { dynasty: string; count: number }>()
    const scanPages = 5
    const scanPerPage = 50

    for (let p = 1; p <= scanPages; p++) {
      const q: Record<string, string | number> = { page: p, per_page: scanPerPage }
      if (dynasty) q.dynasty = dynasty
      if (params?.search) q.keyword = params.search

      const { data } = await axios.get<LoomaBrowseResponse>(v1('/browse'), { params: q })
      for (const row of data.items) {
        if (!row.author) continue
        const prev = authorMap.get(row.author)
        if (prev) prev.count++
        else authorMap.set(row.author, { dynasty: row.dynasty, count: 1 })
      }
      if (data.items.length < scanPerPage) break
    }

    const poets: Poet[] = [...authorMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, meta]) => ({
        id: authorToPoetId(name),
        name,
        dynasty: meta.dynasty,
        birth_year: 0,
        death_year: 0,
        bio: `收录作品约 ${meta.count} 首（browse 聚合，非传记库）`,
        poem_count: meta.count,
        quality_score: 0,
        view_count: 0,
      }))

    return paginate(poets, page, per_page)
  },

  /** 诗人详情（由 poetId 反查 author 后 browse） */
  async getPoet(poetId: number): Promise<Poet> {
    const author = poetIdToAuthor(poetId)
    if (!author) throw new Error(`unknown poet id ${poetId}`)

    const { data } = await axios.get<LoomaBrowseResponse>(v1('/browse'), {
      params: { author, page: 1, per_page: 1 },
    })
    const sample = data.items[0]

    const { data: all } = await axios.get<LoomaBrowseResponse>(v1('/browse'), {
      params: { author, page: 1, per_page: 50 },
    })

    return {
      id: poetId,
      name: author,
      dynasty: sample?.dynasty ?? '',
      birth_year: 0,
      death_year: 0,
      bio: `历代诗词作者；Looma poems 表按作者「${author}」检索。`,
      poem_count: all.total,
      quality_score: 0,
      view_count: 0,
    }
  },

  /** 诗人作品列表 → browse?author= */
  async getPoetPoems(
    poetId: number,
    params?: { page?: number; per_page?: number },
  ): Promise<PaginatedResponse<Poem>> {
    const author = poetIdToAuthor(poetId)
    if (!author) throw new Error(`unknown poet id ${poetId}`)
    return poetryApi.getPoems({
      page: params?.page ?? 1,
      per_page: params?.per_page ?? 12,
      author_id: poetId,
    })
  },

  /** Looma 暂无点赞接口；保留方法供页面 localStorage 逻辑 */
  async likePoem(_id: number): Promise<void> {
    return Promise.resolve()
  },
}
