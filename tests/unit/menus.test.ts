/**
 * 烘焙菜单 —— 构建期快照验收
 *
 * 目的：菜单烘进 dist 之后，「导航到底有几项」在**构建时**就能断言，
 * 不必等发布到线上开浏览器才发现导航空（那是 2026-09-28 两次假绿的口子）。
 * 发布后仍有 verify:nav 的真实浏览器断言兜底，两者不互相替代。
 *
 * 真源是 backend/migrations 里的 share_menus 种子；若有人改了种子却没重跑
 * `node scripts/gen-menus.mjs`，这里的期望值会先红，再由 CI 的 --check 门禁补刀。
 */
import { describe, it, expect } from 'vitest'
import {
  getBakedMenu,
  getRawMenuTree,
  filterMenusByVisibility,
  isMenuVisibleTo,
} from '@/menus'

const titles = (items: { title: string }[]) => items.map((i) => i.title)

describe('烘焙菜单 — szbolent（门户唯一消费的产品）', () => {
  it('完整树来自种子，顺序与标题与 share_menus 一致', () => {
    expect(titles(getRawMenuTree('szbolent'))).toEqual([
      '首页',
      '服务',
      '案例',
      '关于',
      '联系',
      '博客',
      '加入我们',
    ])
  })

  it('案例的 path 取 003 迁移修正后的 /case-study，不是种子初值 /cases', () => {
    const cases = getRawMenuTree('szbolent').find((m) => m.title === '案例')
    expect(cases?.path).toBe('/case-study')
    expect(cases?.component).toBe('CaseStudy')
  })

  it('默认上下文（未登录、无角色）只剩 public 项 —— 与后端 filter_by_visibility 同语义', () => {
    const nav = getBakedMenu('szbolent')
    expect(nav).toHaveLength(7)
    expect(nav.every((m) => m.visibleTo === 'public')).toBe(true)
  })

  it('每个菜单项都能拿到 component，否则路由注入会退化成 NotFound', () => {
    for (const item of getBakedMenu('szbolent')) {
      expect(item.component, `${item.title} 缺 component`).toBeTruthy()
    }
  })
})

describe('可见性过滤 — 与后端 menu_service.rs::filter_by_visibility 对齐', () => {
  it('public 恒可见，authenticated 需登录', () => {
    expect(isMenuVisibleTo('public')).toBe(true)
    expect(isMenuVisibleTo('authenticated')).toBe(false)
    expect(isMenuVisibleTo('authenticated', { isAuthenticated: true })).toBe(true)
  })

  it('角色名直接匹配 roles，不做别名映射', () => {
    expect(isMenuVisibleTo('employer', { roles: ['employer'] })).toBe(true)
    expect(isMenuVisibleTo('employer', { roles: ['admin'] })).toBe(false)
  })

  it('jobfirst 的 employer 菜单：未登录/无角色时不可见，有角色时出现', () => {
    const employerItem = getRawMenuTree('jobfirst').find((m) => m.visibleTo === 'employer')
    expect(employerItem).toBeDefined()

    expect(titles(getBakedMenu('jobfirst'))).not.toContain('企业面板')
    expect(titles(getBakedMenu('jobfirst', { isAuthenticated: true }))).not.toContain('企业面板')
    expect(
      titles(getBakedMenu('jobfirst', { isAuthenticated: true, roles: ['employer'] }))
    ).toContain('企业面板')
  })

  it('父项不可见时整枝丢弃，不会漏出子菜单', () => {
    const tree = [
      {
        id: 1,
        parentId: null,
        title: '父',
        path: '/p',
        visibleTo: 'employer' as const,
        sortOrder: 0,
        product: 'szbolent' as const,
        children: [
          {
            id: 2,
            parentId: 1,
            title: '子',
            path: '/p/c',
            visibleTo: 'public' as const,
            sortOrder: 0,
            product: 'szbolent' as const,
          },
        ],
      },
    ]
    expect(filterMenusByVisibility(tree)).toHaveLength(0)
  })
})

describe('烘焙边界', () => {
  it('没有烘焙数据的产品返回空数组（与过去 5300 404 时的行为一致，不引入新失败模式）', () => {
    expect(getBakedMenu('genzer')).toEqual([])
  })
})
