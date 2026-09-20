/**
 * useDynamicRouter — 数据库驱动的动态路由加载器
 *
 * 职责：
 * 1. 从 Page Engine :5300 拉取菜单树（GET /v1/menus?product=...）
 * 2. 菜单数据供 Header 等消费端使用（menus ref 全局共享）
 * 3. 可选：将菜单树注入 Vue Router（传入 router 参数时）
 * 4. 权限过滤：只注入当前用户可见的菜单项
 *
 * 植入点：
 *   — Header.vue: loadMenus(undefined, 'szbolent') → 只拿菜单数据
 *   — router/index.ts: loadMenus(router, 'szbolent', layout) → 注入路由
 *
 * @module composables/useDynamicRouter
 */

import { ref, type Ref } from 'vue'
import type { Router, RouteRecordRaw } from 'vue-router'
import { apiGet } from '@/api/looma'
import { usePermission } from './usePermission'
import type { MenuItem, ResolvedRoute, ProductId } from '@/api/page-engine.types'

// ============================================================
// 全局状态 — 模块级共享，所有 useDynamicRouter() 调用者共享
// ============================================================

/** 当前产品的菜单数据（共享 ref，Header 和路由守卫同步） */
const currentMenus: Ref<MenuItem[]> = ref([])

/** 已加载的产品菜单 */
const menuTrees = new Map<ProductId, MenuItem[]>()

/** 产品是否已加载路由 */
const routeLoaded = new Map<ProductId, boolean>()

/** 正在加载中的产品 */
const loadingProducts = new Set<ProductId>()

// ============================================================
// 组件路径解析
// ============================================================

/**
 * 组件注册表 — import.meta.glob 预注册所有视图组件
 *
 * 优势：Vite 构建期静态分析 glob import，避免动态路径（@vite-ignore + 变量）
 * 在运行时因别名未注入导致的模块解析失败。
 *
 * component 字段的取值对应 src/views/ 下的 .vue 文件名（不含 .vue 后缀）。
 * 找不到时 fallback 为 NotFound。
 */
const viewModules = import.meta.glob('@/views/**/*.vue')

function resolveComponent(componentName: string | null | undefined): () => Promise<unknown> {
  const name = componentName || 'NotFound'

  // 精确匹配: @/views/{name}.vue
  const exactKey = `@/views/${name}.vue`
  if (viewModules[exactKey]) {
    return viewModules[exactKey]
  }

  // 模糊匹配（处理嵌套目录如 poetry/List.vue，可能不存在但保持灵活性）
  const matchKey = Object.keys(viewModules).find(
    (k) => k.endsWith(`/${name}.vue`) || k === `@/views/${name}.vue`
  )
  if (matchKey && viewModules[matchKey]) {
    return viewModules[matchKey]
  }

  console.warn(`[DynamicRouter] Component "${name}" not found in registry → NotFound`)
  const fallback = viewModules['@/views/NotFound.vue']
  if (fallback) return fallback
  // 兜底：返回空组件（理论上不会走到这里）
  return () => Promise.resolve({ default: {} })
}

// ============================================================
// Composable
// ============================================================

export function useDynamicRouter() {
  const { initialize: initAuth } = usePermission()

  const loading: Ref<boolean> = ref(false)

  /**
   * 从 Page Engine 拉取菜单树，可选注入 Vue Router
   *
   * @param router - Vue Router 实例（可选，不传则只缓存菜单数据不注入路由）
   * @param product - 产品标识，默认 'szbolent'
   * @param layoutComponent - 布局组件（传入 router 时可选提供）
   * @param parentRouteName - 父路由名称，动态路由作为其子路由注入（传入 router 时可选）
   */
  async function loadMenus(
    router?: Router,
    product: ProductId = 'szbolent',
    layoutComponent?: () => Promise<unknown>,
    parentRouteName?: string
  ): Promise<void> {
    // 避免重复加载
    if (routeLoaded.get(product)) return
    if (loadingProducts.has(product)) return

    loadingProducts.add(product)
    loading.value = true

    try {
      // 1. 确保用户上下文已加载（调用 Looma :5200 /v1/auth/profile）
      await initAuth()

      // 2. 拉取菜单树（调用 Page Engine :5300 /v1/menus?product=...）
      const menuTree = await apiGet<MenuItem[]>(`/menus?product=${product}`)
      currentMenus.value = menuTree
      menuTrees.set(product, menuTree)

      // 3. 如果提供了 router，注入动态路由
      if (router) {
        const routes = menuTreeToRoutes(menuTree)

        if (layoutComponent) {
          // 新建完整 layout 路由（独立布局场景）
          router.addRoute({
            path: '/',
            component: layoutComponent,
            children: routes as RouteRecordRaw[],
          })
        } else if (parentRouteName) {
          // 作为已有父路由的子路由注入（最常见：MainLayout 的 children）
          for (const route of routes) {
            const existing = router.getRoutes().find(
              (r) => r.path === `/${route.path}`.replace(/\/\//g, '/')
            )
            if (!existing) {
              router.addRoute(parentRouteName, route as RouteRecordRaw)
            }
          }
        } else {
          // 注入到根级路由
          routes.forEach((route) => router.addRoute(route as RouteRecordRaw))
        }
      }

      routeLoaded.set(product, true)
    } catch (err) {
      console.error('[DynamicRouter] Failed to load menus:', err)
    } finally {
      loading.value = false
      loadingProducts.delete(product)
    }
  }

  /**
   * 重置路由（切换产品时调用）
   */
  function resetRouter(router: Router, product: ProductId): void {
    const routesToRemove = router.getRoutes().filter((r) => {
      return r.meta?.product === product || (r.meta?.product === undefined && r.path !== '/')
    })

    routesToRemove.forEach((r) => {
      if (r.name) {
        router.removeRoute(r.name)
      }
    })

    routeLoaded.delete(product)
    menuTrees.delete(product)
    currentMenus.value = []
  }

  return { menus: currentMenus, loading, loadMenus, resetRouter, routeLoaded }
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 菜单树 → Vue Router 路由树（扁平化处理）
 *
 * 规则：
 * - 没有 component 且没有子节点 → 跳过（外链/目录节点）
 * - 叶子节点 → 注册为路由条目
 * - 非叶子节点有 component → 作为父路由，children 递归处理
 */
function menuTreeToRoutes(
  tree: MenuItem[],
  parentVisibility?: string
): ResolvedRoute[] {
  const { isVisible } = usePermission()
  const routes: ResolvedRoute[] = []

  for (const node of tree) {
    // 权限过滤：不可见的菜单项，其下子节点也不展示
    const nodeVis = node.visibleTo || parentVisibility || 'public'
    if (!isVisible(nodeVis as any)) {
      continue
    }

    const hasChildren = node.children && node.children.length > 0
    const hasComponent = !!node.component

    // 纯目录节点（无组件有子节点）：不注册路由，只递归子节点
    if (!hasComponent && hasChildren) {
      const childRoutes = menuTreeToRoutes(node.children!, nodeVis)
      routes.push(...childRoutes)
      continue
    }

    // 叶子节点 或 有组件的父节点
    if (hasComponent) {
      const route: ResolvedRoute = {
        path: node.path,
        component: resolveComponent(node.component),
        meta: {
          title: node.title,
          icon: node.icon || undefined,
          requiresAuth: node.visibleTo !== 'public',
          visibleTo: nodeVis as any,
          requiredPermission: node.requiredPermission || undefined,
          ...(node.meta || {})
        },
        children: hasChildren
          ? menuTreeToRoutes(node.children!, nodeVis)
          : undefined
      }

      // 如果有名称，添加 name
      if (node.path) {
        route.name = node.title.replace(/\s+/g, '')
      }

      routes.push(route)
    }
  }

  return routes
}
