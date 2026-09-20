/**
 * usePermission — 权限检查引擎
 *
 * 职责：
 * 1. 管理当前用户的认证状态和权限缓存
 * 2. 提供 canAccess() / isVisible() 权限判断
 * 3. 对接 YeDall DID 认证和 Casbin 策略后端
 *
 * 使用：
 *   const { user, isVisible, canAccess, refresh } = usePermission()
 *   if (isVisible(comp.visibleTo, comp.requiredRole)) { ... }
 *
 * @module composables/usePermission
 */

import { ref, computed, type Ref } from 'vue'
import { apiGet, apiPost } from '@/api/looma'
import type {
  UserContext,
  VisibilityLevel,
  ProductId,
  PermissionCheckRequest,
  PermissionCheckResponse
} from '@/api/page-engine.types'

// ============================================================
// 全局单例状态
// ============================================================

/** 当前用户上下文（跨组件共享） */
const currentUser: Ref<UserContext> = ref({
  id: '',
  did: undefined,
  roles: [],
  vcs: [],
  isAuthenticated: false
})

/** 已加载的产品权限缓存（避免重复请求） */
const permissionCache = new Map<string, string>()
/** 产品级权限列表缓存（loadPermissions 专用） */
const productPermsCache = new Map<string, string[]>()

/** 初始化中标记 */
let initializing = false

// ============================================================
// 认证
// ============================================================

/**
 * 从 Looma /v1/auth/profile 拉取当前用户信息
 */
async function fetchUserContext(): Promise<UserContext> {
  try {
    const res = await apiGet<{
      id: string
      did?: string
      roles?: string[]
      vcs?: string[]
    }>('/auth/profile')

    return {
      id: res.id,
      did: res.did,
      roles: res.roles ?? [],
      vcs: res.vcs ?? [],
      isAuthenticated: true
    }
  } catch {
    // 未登录
    return {
      id: '',
      roles: [],
      vcs: [],
      isAuthenticated: false
    }
  }
}

// ============================================================
// Composable
// ============================================================

export function usePermission() {
  /** 初始化：拉取用户上下文 */
  async function initialize(): Promise<void> {
    if (initializing || currentUser.value.isAuthenticated) return
    initializing = true
    try {
      currentUser.value = await fetchUserContext()
    } finally {
      initializing = false
    }
  }

  /** 刷新用户上下文（登录/登出后调用） */
  async function refresh(): Promise<void> {
    permissionCache.clear()
    currentUser.value = await fetchUserContext()
  }

  // ============================================================
  // 可见性判断
  // ============================================================

  /**
   * 判断某内容对当前用户是否可见
   *
   * @param visibleTo - 可见性级别
   * @param requiredRole - 配合 'role' 使用时的具体角色名
   * @param requiredVC - 需要的 VC 凭证类型
   */
  function isVisible(
    visibleTo: VisibilityLevel,
    requiredRole?: string | null,
    requiredVC?: string | null
  ): boolean {
    const u = currentUser.value

    switch (visibleTo) {
      // 所有人可见
      case 'public':
        return true

      // 已登录
      case 'authenticated':
        return u.isAuthenticated

      // 订阅者
      case 'subscriber':
        return u.roles.includes('subscriber') || u.roles.includes('admin')

      // 好友
      case 'friend':
        return u.roles.includes('friend') || u.roles.includes('admin')

      // 雇主/HR
      case 'employer':
        if (requiredRole) {
          return u.roles.includes(requiredRole) || u.roles.includes('admin')
        }
        return u.roles.includes('employer') || u.roles.includes('admin')

      // 管理员
      case 'admin':
        return u.roles.includes('admin')

      // VC 认证
      case 'vc_verified':
        if (requiredVC) {
          return u.vcs.includes(requiredVC)
        }
        return u.vcs.length > 0

      default:
        return false
    }
  }

  // ============================================================
  // Casbin 权限检查
  // ============================================================

  /**
   * 检查当前用户是否有某项操作权限
   * 先查缓存，未命中则调用后端 Casbin
   */
  async function canAccess(
    resource: string,
    action: 'read' | 'write' | 'delete' | 'manage' = 'read'
  ): Promise<boolean> {
    const cacheKey = `${resource}:${action}`

    // 已缓存的直接返回
    if (permissionCache.has(cacheKey)) {
      return permissionCache.get(cacheKey)!.includes('allowed')
    }

    try {
      const res = await apiPost<PermissionCheckResponse>('/permissions/check', {
        resource,
        action
      } as PermissionCheckRequest)
      permissionCache.set(cacheKey, res.allowed ? 'allowed' : 'denied')
      return res.allowed
    } catch {
      // 请求失败默认拒绝
      return false
    }
  }

  /**
   * 批量拉取当前用户在某产品下的所有权限（减少请求数）
   */
  async function loadPermissions(product: ProductId): Promise<string[]> {
    if (productPermsCache.has(product)) {
      return productPermsCache.get(product)!
    }

    try {
      const perms = await apiGet<string[]>(`/permissions/my?product=${product}`)
      productPermsCache.set(product, perms)
      return perms
    } catch {
      return []
    }
  }

  // ============================================================
  // 计算属性
  // ============================================================

  const isAuthenticated = computed(() => currentUser.value.isAuthenticated)
  const roles = computed(() => currentUser.value.roles)
  const userId = computed(() => currentUser.value.id)

  /**
   * 检查用户是否拥有某个角色
   */
  function hasRole(role: string): boolean {
    return currentUser.value.roles.includes(role)
  }

  /**
   * 检查用户是否持有某种 VC 凭证
   */
  function hasVC(vcType: string): boolean {
    return currentUser.value.vcs.includes(vcType)
  }

  return {
    // 状态
    user: currentUser,
    isAuthenticated,
    roles,
    userId,

    // 方法
    initialize,
    refresh,
    isVisible,
    canAccess,
    loadPermissions,
    hasRole,
    hasVC
  }
}
