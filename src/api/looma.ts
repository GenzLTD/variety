/**
 * Looma API 客户端 — 身份认证 / 支付 / 企业服务
 *
 * 数据真源：looma-zervi `backend/src/api/routes/auth_routes.py` 等
 * 类型将在 S0 阶段从 OpenAPI 生成，当前用泛型薄封装。
 *
 * JWT token 存储键：looma_token（与 looma 前端保持一致，见 G2 门禁）
 */
import axios from 'axios'

/** 生产填 https://api.genz.ltd；本地留空走 vite proxy /v1 → :5200 */
const LOOMA_BASE = (import.meta.env.VITE_LOOMA_API_BASE ?? '').replace(/\/$/, '')

/** HTTP 超时统一 30s（G2 门禁） */
const API_TIMEOUT_MS = 30000

/** looma JWT 存储键（与 planetx/saas 保持一致） */
const TOKEN_KEY = 'looma_token'

function v1(path: string): string {
  return `${LOOMA_BASE}/v1${path}`
}

// ── Token 管理 ──

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// ── Axios 实例 ──

const api = axios.create({
  timeout: API_TIMEOUT_MS,
})

// 请求拦截：自动带 JWT
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：401 自动清 token（G2 门禁）
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      // portal 消费端可监听此事件跳转登录
    }
    return Promise.reject(error)
  },
)

// ── 泛型请求封装（等 S0 契约后再替换为具体类型）──

/** GET 请求封装 */
export async function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.get<T>(v1(path), { params })
  return data
}

/** POST 请求封装 */
export async function apiPost<T>(path: string, body?: object): Promise<T> {
  const { data } = await api.post<T>(v1(path), body ?? {})
  return data
}

// ── 认证接口（薄封装，具体请求/响应体等 S0 契约定义）──

/** Web 登录 */
export async function login(email: string, password: string): Promise<{ token: string }> {
  const data = await apiPost<{ access_token: string }>('/auth/login', { email, password }) as any
  const token = data.access_token || data.token
  if (token) setToken(token)
  return data
}

/** Web 注册 */
export function register(params: { email: string; password: string; name?: string }): Promise<{ token: string }> {
  return apiPost<{ token: string }>('/auth/register', params)
}

/** 获取当前用户信息 */
export function getMe<T = Record<string, unknown>>(): Promise<T> {
  return apiGet<T>('/auth/me')
}

/** 微信小程序登录绑定 */
export function wechatLogin(code: string): Promise<{ token: string }> {
  return apiPost<{ token: string }>('/auth/wechat', { code })
}

// ── 支付接口（P1 后接真实类型）──

/** 创建支付订单 */
export function createOrder(params: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiPost('/payment/create', params)
}

/** 查询支付状态 */
export function queryOrder(orderId: string): Promise<Record<string, unknown>> {
  return apiGet(`/payment/status/${orderId}`)
}

// ── AI 问答接口（RAG）──

/** RAG AI 问答响应 — 提取的诗词结构化信息 */
interface ExtractedPoem {
  title: string
  author: string
  dynasty: string
  content: string
  theme: string
}

/** RAG AI 问答响应 */
interface AskResponse {
  /** AI 生成的回答 */
  answer: string
  /** 意图分类（如 poetry） */
  intent?: string
  /** 意图置信度 (0-1) */
  intent_confidence?: number
  /** 提取的诗词结构化信息 */
  extracted?: ExtractedPoem
  /** 引用的诗词来源 */
  sources: Array<{
    title: string
    author: string
    content_snippet: string
    score: number
  }>
  /** 消耗 token 数 */
  tokens_used?: number
}

/**
 * RAG AI 问答 — 诗词知识库检索增强生成
 *
 * 端点：POST /v1/ask（字段 query）
 * 数据真源：Looma backend → ChromaDB 向量检索 + LLM 生成
 *
 * @throws {ConsentRequiredError} 当用户尚未授权 ask_rag scope 时抛出
 *
 * @example
 * ```ts
 * const { answer, sources } = await ask('李白的静夜思表达了什么情感？')
 * ```
 */
export async function ask(question: string, options?: { top_k?: number; session_id?: string }): Promise<AskResponse> {
  try {
    return await apiPost<AskResponse>('/ask', {
      query: question,
      ...(options?.top_k != null && { top_k: options.top_k }),
      ...(options?.session_id && { session_id: options.session_id }),
    })
  } catch (e: any) {
    // 检测后端返回的 consent_required
    const body = e?.response?.data
    if (body?.action === 'grant_consent' && body?.required_scope) {
      const err = new Error(body.message || '需要授权') as any
      err.code = 'CONSENT_REQUIRED'
      err.requiredScope = body.required_scope
      throw err
    }
    throw e
  }
}

// ── 同意授权接口 ──

/** 同意授权 scope 请求 */
interface GrantConsentRequest {
  scope: string
}

/** 同意授权 scope 响应 */
interface GrantConsentResponse {
  scope: string
  granted: boolean
}

/**
 * 向 Looma 提交 scope 授权同意
 *
 * 端点：POST /v1/compliance/consent/grant（compliance_bp）
 * scope 示例：'ask_rag'（RAG 检索授权）、'did_verify'（DID 验证授权）
 */
export function grantConsent(scope: string): Promise<GrantConsentResponse> {
  return apiPost<GrantConsentResponse>('/compliance/consent/grant', { scope } as GrantConsentRequest)
}