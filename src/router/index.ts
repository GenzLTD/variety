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
        meta: {
          title: '首页',
          description:
            '深伯乐（深圳）科技有限公司 — 融合科技与人文的数智企业，提供软件开发、数字化、IT 管理及 AI 读诗；HarmonyOS 生态与昇腾 ISV 认证服务商。',
        }
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/About.vue'),
        meta: {
          title: '关于我们',
          description: '深伯乐（深圳）科技有限公司简介：数智企业、HarmonyOS 生态与昇腾 ISV 认证服务商。',
        }
      },
      {
        path: 'services',
        name: 'Services',
        component: () => import('@/views/Services.vue'),
        meta: {
          title: '我们的服务',
          description: '深伯乐服务：IT 外包、敏捷咨询、测试、项目管理、HarmonyOS 与昇腾方案。',
        }
      },
      {
        path: 'services/:slug',
        name: 'ServiceDetail',
        component: () => import('@/views/ServiceDetail.vue'),
        meta: { title: '服务详情' }
      },
      // 书店列表是橱窗自己的页面，不依赖 Page Engine 菜单
      {
        path: 'blog',
        name: 'Blog',
        component: () => import('@/views/Blog.vue'),
        meta: {
          title: '书店',
          description: '深伯乐书店节选：诗词与文化内容同源陈列于 szbolent.com/blog',
          robots: 'noindex, follow',
        }
      },
      {
        path: 'blog/:slug',
        name: 'BlogDetail',
        component: () => import('@/views/BlogDetail.vue'),
        meta: { title: '博客详情', robots: 'noindex, follow' }
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
        meta: {
          title: '联系我们',
          description: '联系深伯乐（深圳）科技有限公司：企业咨询请使用官网联系表单。',
        }
      },
      // 诗词专区路由（Looma 管理，非 Page Engine）
      {
        path: 'poetry',
        name: 'Poetry',
        component: () => import('@/views/poetry/Layout.vue'),
        meta: {
          title: '诗词鉴赏',
          description: '深伯乐诗词鉴赏入口：浏览、检索与 AI 读诗。',
        },
        children: [
          {
            path: '',
            name: 'PoetryList',
            component: () => import('@/views/poetry/List.vue'),
            meta: {
              title: '诗词列表',
              description: '深伯乐诗词鉴赏入口：浏览、检索与 AI 读诗。',
            }
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
        meta: {
          title: '隐私政策',
          description: '深伯乐（深圳）科技有限公司隐私政策摘要。',
        }
      },
      {
        path: 'terms',
        name: 'Terms',
        component: () => import('@/views/Terms.vue'),
        meta: {
          title: '用户协议',
          description: '深伯乐（深圳）科技有限公司网站服务条款。',
        }
      },
      {
        path: ':pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue'),
        meta: { title: '建设中' }
      }
    ]
  }
]

import { applyPageSeo } from '@/composables/usePageSeo'

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

  applyPageSeo({
    title: (to.meta.title as string) || undefined,
    description: (to.meta.description as string) || undefined,
    path: to.path,
    robots: (to.meta.robots as string) || 'index, follow',
  })

  if (to.meta.icpRisk === 'personal-domain-no-pricing' && import.meta.env.PROD) {
    console.warn(
      '[router] /pricing 在个人备案生产环境不可用。' +
      '请将定价页面迁移至小程序或企业备案通道；公开橱窗权威域为 szbolent.com。'
    )
  }

  next()
})

export default router
