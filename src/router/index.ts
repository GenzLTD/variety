import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useDynamicRouter } from '@/composables/useDynamicRouter'

/**
 * 路由架构说明
 * ─────────────
 * 静态路由（本文件）：核心 layout + Looma 诗词专区 + 404 + 必要 fallback
 * 动态路由（Page Engine :5300）：blog / careers / 未来新增页面
 *
 * 注入方式：loadMenus(router, 'szbolent', undefined, 'main')
 *   → 动态路由作为 'main' (MainLayout) 的子路由注入，与 Header 菜单同源
 *   → 冲突检查：已存在同 path 的静态路由不会被覆盖
 */

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'main',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/About.vue'),
        meta: { title: '关于我们' }
      },
      {
        path: 'services',
        name: 'Services',
        component: () => import('@/views/Services.vue'),
        meta: { title: '我们的服务' }
      },
      {
        path: 'services/:slug',
        name: 'ServiceDetail',
        component: () => import('@/views/ServiceDetail.vue'),
        meta: { title: '服务详情' }
      },
      // blog 列表可由 Page Engine 动态注入；详情带 :slug，静态兜底（菜单通常不挂参数路由）
      {
        path: 'blog/:slug',
        name: 'BlogDetail',
        component: () => import('@/views/BlogDetail.vue'),
        meta: { title: '博客详情' }
      },
      {
        path: 'case-study',
        name: 'CaseStudy',
        component: () => import('@/views/CaseStudy.vue'),
        meta: { title: '案例研究' }
      },
      {
        path: 'case-study/:slug',
        name: 'CaseStudyDetail',
        component: () => import('@/views/CaseStudyDetail.vue'),
        meta: { title: '案例详情' }
      },
      // careers → 由 Page Engine 动态路由管理
      {
        path: 'contact',
        name: 'Contact',
        component: () => import('@/views/Contact.vue'),
        meta: { title: '联系我们' }
      },
      // 诗词专区路由（Looma 管理，非 Page Engine）
      {
        path: 'poetry',
        name: 'Poetry',
        component: () => import('@/views/poetry/Layout.vue'),
        meta: { title: '诗词鉴赏' },
        children: [
          {
            path: '',
            name: 'PoetryList',
            component: () => import('@/views/poetry/List.vue'),
            meta: { title: '诗词列表' }
          },
          {
            path: ':id',
            name: 'PoetryDetail',
            component: () => import('@/views/poetry/Detail.vue'),
            meta: { title: '诗词详情' }
          },
          {
            path: 'poets',
            name: 'PoetList',
            component: () => import('@/views/poetry/PoetList.vue'),
            meta: { title: '诗人列表' }
          },
          {
            path: 'poets/:id',
            name: 'PoetDetail',
            component: () => import('@/views/poetry/PoetDetail.vue'),
            meta: { title: '诗人详情' }
          }
        ]
      },
      {
        path: 'pricing',
        name: 'Pricing',
        component: () => import('@/views/Pricing.vue'),
        meta: {
          title: '定价方案',
          icpRisk: 'personal-domain-no-pricing'
        }
      },
      {
        path: 'privacy',
        name: 'Privacy',
        component: () => import('@/views/Privacy.vue'),
        meta: { title: '隐私政策' }
      },
      {
        path: 'terms',
        name: 'Terms',
        component: () => import('@/views/Terms.vue'),
        meta: { title: '用户协议' }
      }
    ]
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '404' }
  }
]

import { seoConfig } from '@/config/company'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

// 路由守卫
const { loadMenus, routeLoaded } = useDynamicRouter()

// 每次模块求值时重置已加载标记（HMR 会重建 router，需重新注入动态路由）
// production 下仅运行一次，无副作用
routeLoaded.delete('szbolent')

/** 动态路由初始化 Promise（main.ts 中 await 后挂载） */
export const menusInit = loadMenus(router, 'szbolent', undefined, 'main')

let menusReady: Promise<void> | null = null

router.beforeEach(async (to, _from, next) => {
  // 确保动态路由已加载（首屏 / HMR 重载场景）
  if (!menusReady) {
    if (!routeLoaded.get('szbolent')) {
      menusReady = loadMenus(router, 'szbolent', undefined, 'main')
    } else {
      menusReady = Promise.resolve()
    }
  }
  await menusReady

  // 动态路由加载后，重新匹配当前路径（修复全页刷新 Race Condition）
  if (to.name === 'NotFound' && to.fullPath !== '/404') {
    const resolved = router.resolve(to.fullPath)
    if (resolved.name !== 'NotFound') {
      return next(to.fullPath)
    }
  }

  const page = (to.meta.title as string) || seoConfig.defaultTitle
  document.title = seoConfig.titleTemplate.replace('%s', page)

  if (to.meta.icpRisk === 'personal-domain-no-pricing' && import.meta.env.PROD) {
    console.warn(
      '[router] /pricing 在个人备案生产环境不可用。' +
      '请将定价页面迁移至小程序或公司备案域名（szbolent.com.cn）。'
    )
  }

  next()
})

export default router
