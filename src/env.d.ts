/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 门户公网地址（SEO / OG 用） */
  readonly VITE_SITE_URL: string
  /** Looma 商业/API 真源 */
  readonly VITE_LOOMA_API_BASE: string
  /** WordPress REST API 地址 */
  readonly VITE_BLOG_API_BASE: string
  /** 书架 feed 基址（bolent-shelf-bridge/1，作者博客 szbolent.cn） */
  readonly VITE_SHELF_API_BASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
