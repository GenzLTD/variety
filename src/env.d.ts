/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 门户公网地址（SEO / OG 用） */
  readonly VITE_SITE_URL: string
  /** Looma 商业/API 真源 */
  readonly VITE_LOOMA_API_BASE: string
  /** WordPress REST API 地址 */
  readonly VITE_BLOG_API_BASE: string
  /** 书店 feed 基址（同源 /wp-json/bookstore/v1，只含节选） */
  readonly VITE_SHELF_API_BASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** 构建时写入的发布 tag，供页脚注脚核对和回滚。 */
declare const __RELEASE_TAG__: string
