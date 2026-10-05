/**
 * src/menus — 烘焙菜单（构建期确定，零运行时后端调用）
 *
 * 背景：菜单原本在运行时向 Page Engine :5300 拉 `GET /v1/menus?product=...`。
 * 5300 从未纳入部署流水线（deploy.yml 只发前端 dist），线上因此 404、
 * 顶部导航只剩静态「书店」一项。
 *
 * 菜单本质是**配置**不是运行时数据，故烘焙进构建：
 *   种子 SQL（真源）→ scripts/gen-menus.mjs → src/menus/<product>.json → 本模块
 *
 * 与后端的关系：
 *   - 建树 + 可见性过滤是后端 `menu_service.rs::filter_by_visibility` 的 TS 移植，
 *     语义逐条对齐（public / authenticated / 其他角色名匹配 user_roles）。
 *   - 角色来自 Looma `/v1/auth/profile`（usePermission），**不来自 5300**，
 *     因此烘焙后登录态菜单能力不丢失。
 *
 * 改菜单的正确姿势：改 backend/migrations 里的种子 → 跑 `node scripts/gen-menus.mjs`
 * → 提 PR。禁止手改 src/menus/*.json（CI 有 --check 门禁）。
 *
 * @module menus
 */

import szbolentMenu from './szbolent.json'
import blogMenu from './blog.json'
import jobfirstMenu from './jobfirst.json'
import type { MenuItem, ProductId, VisibilityLevel } from '@/api/page-engine.types'

/** 烘焙产物文件结构（由 scripts/gen-menus.mjs 写出） */
export interface BakedMenuFile {
  product: ProductId
  source: string[]
  items: MenuItem[]
}

// JSON 是被脚本生成的，字段形状由种子决定，用 unknown 中转避免字面量类型收窄
const BAKED_MENUS: Partial<Record<ProductId, BakedMenuFile>> = {
  szbolent: szbolentMenu as unknown as BakedMenuFile,
  blog: blogMenu as unknown as BakedMenuFile,
  jobfirst: jobfirstMenu as unknown as BakedMenuFile,
}

/** 可见性判定上下文 */
export interface VisibilityContext {
  /** 当前用户角色（Looma /v1/auth/profile 的 roles） */
  roles?: string[]
  /** 是否已登录 */
  isAuthenticated?: boolean
}

/**
 * 单个菜单项是否对当前上下文可见
 *
 * 与后端一致的三分支：public 恒可见 / authenticated 需登录 / 其余按角色名匹配。
 * 注意：后端是「角色名直接等于 visible_to 值」，这里不做任何别名映射——
 * 若将来要支持 subscriber/employer 等，需先确认 Looma 的 roles 语义与之对齐。
 */
export function isMenuVisibleTo(
  visibleTo: VisibilityLevel | string,
  ctx: VisibilityContext = {}
): boolean {
  const { roles = [], isAuthenticated = false } = ctx
  switch (visibleTo) {
    case 'public':
      return true
    case 'authenticated':
      return isAuthenticated
    default:
      return roles.includes(visibleTo)
  }
}

/** 扁平（parentId）→ 树（children）。父节点缺失或自引用时降级为根节点，不丢项。 */
export function buildMenuTree(items: MenuItem[]): MenuItem[] {
  const byId = new Map<number, MenuItem>()
  const nodes: MenuItem[] = items.map((raw) => ({ ...raw, children: [] }))
  nodes.forEach((n) => byId.set(n.id, n))

  const roots: MenuItem[] = []
  for (const node of nodes) {
    const parent = node.parentId != null ? byId.get(node.parentId) : undefined
    if (parent && parent !== node && parent.children) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortRec = (list: MenuItem[]): void => {
    list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id)
    for (const n of list) if (n.children?.length) sortRec(n.children)
  }
  sortRec(roots)

  // 空 children 归一为 undefined：与后端「无子节点时不带 children」保持一致
  const prune = (list: MenuItem[]): void => {
    for (const n of list) {
      if (n.children?.length) prune(n.children)
      else delete n.children
    }
  }
  prune(roots)

  return roots
}

/**
 * 可见性过滤（后端 filter_by_visibility 的 TS 移植）
 *
 * 父项不可见则整枝丢弃；子枝过滤后为空则不挂载 children（父项自身保留）。
 */
export function filterMenusByVisibility(
  tree: MenuItem[],
  ctx: VisibilityContext = {}
): MenuItem[] {
  const { roles = [], isAuthenticated = false } = ctx
  const out: MenuItem[] = []

  for (const item of tree) {
    if (!isMenuVisibleTo(item.visibleTo, { roles, isAuthenticated })) continue

    const next: MenuItem = { ...item }
    if (item.children?.length) {
      const kids = filterMenusByVisibility(item.children, { roles, isAuthenticated })
      if (kids.length) next.children = kids
      else delete next.children
    }
    out.push(next)
  }

  return out
}

/**
 * 取某产品的菜单树（同步，构建期数据）
 *
 * 这是菜单的唯一取数点。没有烘焙数据的产品返回空数组——与过去 5300 404 时
 * 的行为一致（菜单为空），不会引入新的失败模式。
 */
export function getBakedMenu(product: ProductId, ctx: VisibilityContext = {}): MenuItem[] {
  const file = BAKED_MENUS[product]
  if (!file) return []
  return filterMenusByVisibility(buildMenuTree(file.items), ctx)
}

/** 未过滤的完整菜单树（测试/调试用，别在 UI 里直接用） */
export function getRawMenuTree(product: ProductId): MenuItem[] {
  const file = BAKED_MENUS[product]
  return file ? buildMenuTree(file.items) : []
}

/** 已烘焙的产品 */
export const BAKED_PRODUCTS = Object.keys(BAKED_MENUS) as ProductId[]
