<template>
  <!--
    PageRenderer — Schema 驱动的页面渲染器

    这是整个页面引擎的"渲染终点"——接收 PageSchema，输出真实 DOM。

    工作流：
      1. 根据 route.path 从 Looma 加载 PageSchema
      2. 按用户权限过滤 components 列表
      3. 动态加载布局模板 (Layout)
      4. 对每个 PageComponent，查找 componentMap 中的 Vue 组件
      5. 注入 dataSource 数据作为 props
      6. 渲染整页

    用法（嵌入路由）：
      <PageRenderer
        :componentMap="myComponentMap"
        :defaultLayout="DefaultLayout"
        product="blog"
      />
  -->

  <!-- 加载中 -->
  <div v-if="isLoading" class="page-renderer page-renderer--loading">
    <slot name="loading">
      <div class="page-renderer__spinner" />
    </slot>
  </div>

  <!-- 错误 -->
  <div v-else-if="error" class="page-renderer page-renderer--error">
    <slot name="error" :error="error">
      <div class="page-renderer__error-content">
        <h2>页面加载失败</h2>
        <p>{{ error }}</p>
      </div>
    </slot>
  </div>

  <!-- 正常渲染 -->
  <div
    v-else-if="pageSchema"
    class="page-renderer"
    :class="[`page-renderer--${pageSchema.layout}`, `page-renderer--${pageSchema.pageType}`]"
  >
    <!-- 页面标题 -->
    <slot name="header" :page="pageSchema" :title="pageTitle">
      <div class="page-renderer__header">
        <h1 class="page-renderer__title">{{ pageTitle }}</h1>
        <p v-if="pageDescription" class="page-renderer__desc">{{ pageDescription }}</p>
      </div>
    </slot>

    <!-- 组件列表 -->
    <slot
      name="body"
      :components="visibleComponents"
      :context="renderContext"
    >
      <div class="page-renderer__body">
        <template v-for="(comp, index) in visibleComponents" :key="comp.id">
          <div
            class="page-renderer__component"
            :data-component-type="comp.type"
            :data-component-id="comp.id"
          >
            <Component
              :is="resolveComponent(comp.type)"
              v-bind="resolveProps(comp, index)"
            />
          </div>
        </template>
      </div>
    </slot>

    <!-- 空组件列表 -->
    <div v-if="visibleComponents.length === 0" class="page-renderer__empty">
      <slot name="empty">
        <p>暂无内容</p>
      </slot>
    </div>
  </div>

  <!-- 无 Schema（404） -->
  <div v-else class="page-renderer page-renderer--empty">
    <slot name="not-found">
      <h2>页面不存在</h2>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { type Component as VueComponent } from 'vue'
import { usePageRenderer } from '@/composables/usePageRenderer'
import type {
  PageComponent,
  PageRenderContext,
  ComponentType,
  ComponentRegistry,
  ProductId
} from '@/api/page-engine.types'

const props = withDefaults(defineProps<{
  /** 组件注册表 — 组件类型名到 Vue 组件的映射 */
  componentMap: ComponentRegistry

  /** 默认布局组件（当 Schema 未指定 layout 时使用） */
  defaultLayout?: VueComponent

  /** 产品标识 */
  product?: ProductId

  /** 自定义路由路径（不跟随 vue-router） */
  staticPath?: string
}>(), {})

// ============================================================
// 初始化
// ============================================================

const {
  pageSchema,
  pageData,
  isLoading,
  error,
  visibleComponents,
  renderContext,
  pageTitle,
  pageDescription
} = usePageRenderer(props.product)

// ============================================================
// 组件解析
// ============================================================

/**
 * 组件类型 → Vue 组件
 *
 * 查找顺序：用户提供的 componentMap（同步）→ 未知类型返回 div 占位
 */
function resolveComponent(type: string): VueComponent | string {
  const ct = type as ComponentType

  if (props.componentMap[ct]) {
    // componentMap 的值是 () => Promise<{default: ...}>，Vue 支持异步组件
    return defineAsyncComponent(props.componentMap[ct] as any)
  }

  console.warn(`[PageRenderer] Unknown component type: "${type}"`)
  return 'div'  // 未知类型渲染为占位 div
}

/**
 * 解析组件的 props
 *
 * 注入：Schema 中定义的 props + 数据源数据 + 渲染上下文
 */
function resolveProps(comp: PageComponent, index: number): Record<string, any> {
  const ctx: PageRenderContext = {
    ...renderContext.value!,
    componentIndex: index
  }

  // 基础 props（从 Schema 定义）
  const base = { ...comp.props }

  // 注入渲染上下文
  base._ctx = ctx
  base._pageData = pageData.value

  // 组件有独立 dataSource：注入数据获取函数（懒加载）
  if (comp.dataSource) {
    base._loadData = async () => {
      const { apiGet } = await import('@/api/looma')
      return apiGet(comp.dataSource!)
    }
  }

  return base
}

// ============================================================
// 异步组件包装
// ============================================================

import { defineAsyncComponent } from 'vue'
</script>

<style scoped>
.page-renderer {
  width: 100%;
}

.page-renderer--loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.page-renderer__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border, #e0e0e0);
  border-top-color: var(--color-primary, #0066ff);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.page-renderer--error {
  padding: 2rem;
}

.page-renderer__error-content {
  text-align: center;
  color: var(--color-error, #cc0000);
}

.page-renderer__header {
  margin-bottom: 2rem;
}

.page-renderer__title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}

.page-renderer__desc {
  color: var(--color-text-secondary, #666);
  font-size: 1rem;
  margin: 0;
}

.page-renderer__body {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-renderer__component {
  /* 组件间隔离 */
  container-type: inline-size;
}

.page-renderer__empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-secondary, #999);
}

.page-renderer--sidebar .page-renderer__body {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
}

.page-renderer--cardGrid .page-renderer__body {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}
</style>
