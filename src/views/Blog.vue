<template>
  <div class="blog-page">
    <!-- Hero Section -->
    <section class="page-hero">
      <div class="container">
        <h1 data-aos="fade-up">博客</h1>
        <p data-aos="fade-up" data-aos-delay="100">
          书架精选：聚合作者博客的优质文章，阅读全文跳转原文
        </p>
      </div>
    </section>

    <!-- 文章列表（书架 feed） -->
    <section class="blog-list section">
      <div class="container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 错误 / 降级空态 -->
        <div v-else-if="error" class="error-state">
          <p>📭 {{ error }}</p>
          <p class="error-hint">书架内容由作者博客（bolent-shelf-bridge）提供；服务恢复后即可正常浏览。</p>
          <button @click="loadFeed" class="btn btn-primary">重试</button>
        </div>

        <!-- 文章列表 -->
        <div v-else-if="items.length" class="posts-grid">
          <article
            v-for="item in items"
            :key="item.id"
            class="post-card"
            data-aos="fade-up"
          >
            <!-- 封面图 -->
            <div class="post-thumbnail">
              <img
                v-if="item.cover"
                :src="item.cover"
                :alt="item.title"
                loading="lazy"
              />
              <div v-else class="thumbnail-placeholder">
                📝
              </div>
            </div>

            <!-- 文章内容 -->
            <div class="post-content">
              <div class="post-meta">
                <span class="post-date">{{ formatDate(item.published) }}</span>
                <span v-if="item.categories.length" class="post-categories">
                  <span
                    v-for="cat in item.categories"
                    :key="cat.slug"
                    class="category-tag"
                  >
                    {{ cat.name }}
                  </span>
                </span>
              </div>

              <h3 class="post-title">
                <a :href="item.url" target="_blank" rel="noopener noreferrer">
                  {{ item.title }}
                </a>
              </h3>

              <p class="post-excerpt">{{ item.excerpt }}</p>

              <div class="post-footer">
                <a :href="item.url" target="_blank" rel="noopener noreferrer" class="read-more">
                  阅读原文 →
                </a>

                <div v-if="item.author.name" class="post-author">
                  <img
                    v-if="item.author.avatar"
                    :src="item.author.avatar"
                    :alt="item.author.name"
                    class="author-avatar"
                  />
                  <span>{{ item.author.name }}</span>
                </div>
              </div>
            </div>
          </article>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <p>📭 暂无文章</p>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="btn btn-outline"
          >
            ← 上一页
          </button>

          <div class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="goToPage(page)"
              :class="['page-btn', { active: page === currentPage }]"
            >
              {{ page }}
            </button>
          </div>

          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="btn btn-outline"
          >
            下一页 →
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getShelfFeed, formatDate, type ShelfFeedItem } from '@/api/wordpress'

const route = useRoute()

// 数据
const items = ref<ShelfFeedItem[]>([])
const loading = ref(false)
const error = ref('')

// 分页
const currentPage = ref(1)
const totalPages = ref(0)
const perPage = 9

// 计算可见的页码
const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// 加载书架 feed
const loadFeed = async () => {
  loading.value = true
  error.value = ''

  try {
    const result = await getShelfFeed({
      page: currentPage.value,
      limit: perPage,
    })

    items.value = result.items
    const limit = Math.max(1, result.limit || perPage)
    totalPages.value = Math.max(1, Math.ceil(result.total / limit))
  } catch (err: any) {
    const msg = String(err?.message || '')
    if (/Failed to fetch|NetworkError|ECONNREFUSED|500|502|503|504/i.test(msg)) {
      error.value = '内容暂不可用，请稍后再试'
    } else {
      error.value = msg || '加载失败，请稍后重试'
    }
    console.error('加载书架失败:', err)
  } finally {
    loading.value = false
  }
}

// 翻页
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadFeed()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 监听路由变化
watch(() => route.query, () => {
  if (route.name === 'blog') {
    const page = parseInt(route.query.page as string) || 1
    if (page !== currentPage.value) {
      currentPage.value = page
      loadFeed()
    }
  }
})

// 初始化
onMounted(() => {
  const pageQuery = route.query.page
  if (pageQuery) {
    currentPage.value = parseInt(pageQuery as string)
  }

  loadFeed()
})
</script>

<style scoped lang="scss">
.blog-page {
  padding-top: 70px;

  .page-hero {
    background: var(--bolent-gradient);
    padding: 100px 0 60px;
    text-align: center;
    color: white;

    h1 {
      font-size: 3rem;
      margin-bottom: 20px;
      color: white;
    }

    p {
      font-size: 1.25rem;
      opacity: 0.9;
    }
  }

  .blog-filters {
    background: var(--bg-light);
    padding: 40px 0;

    .filters-wrapper {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .search-box {
      display: flex;
      gap: 12px;
      max-width: 600px;

      input {
        flex: 1;
        padding: 12px 20px;
        border: 2px solid var(--bolent-border);
        border-radius: 8px;
        font-size: 1rem;

        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }
      }
    }

    .category-filter {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .filter-btn {
        padding: 8px 20px;
        border: 2px solid var(--bolent-border);
        background: white;
        border-radius: 20px;
        cursor: pointer;
        transition: var(--bolent-transition);
        font-size: 0.95rem;

        &:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        &.active {
          background: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
        }
      }
    }
  }

  .blog-list {
    .loading-state,
    .error-state,
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      
      .spinner {
        width: 50px;
        height: 50px;
        margin: 0 auto 20px;
        border: 4px solid var(--bolent-bg-soft);
        border-top: 4px solid var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      p {
        font-size: 1.125rem;
        color: var(--text-secondary);
        margin-bottom: 20px;
      }

      .error-hint {
        font-size: 0.95rem;
        color: var(--bolent-text-muted);
        margin-top: -8px;
      }
    }

    .posts-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 40px;

      @media (max-width: 992px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .post-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--bolent-shadow);
      transition: var(--bolent-transition);

      &:hover {
        transform: translateY(-8px);
        box-shadow: var(--bolent-shadow-lg);
      }

      .post-thumbnail {
        position: relative;
        padding-top: 56.25%; // 16:9
        overflow: hidden;
        background: var(--bg-light);

        img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumbnail-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          background: var(--bolent-gradient);
        }
      }

      .post-content {
        padding: 24px;

        .post-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          font-size: 0.875rem;
          color: var(--text-secondary);

          .post-categories {
            display: flex;
            gap: 8px;
          }

          .category-tag {
            padding: 4px 12px;
            background: var(--bg-light);
            border-radius: 12px;
            color: var(--primary-color);
            font-weight: 500;
          }
        }

        .post-title {
          margin-bottom: 12px;
          font-size: 1.25rem;
          line-height: 1.4;

          a {
            color: var(--text-primary);
            text-decoration: none;
            transition: color 0.3s ease;

            &:hover {
              color: var(--primary-color);
            }
          }
        }

        .post-excerpt {
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .post-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;

          .read-more {
            color: var(--primary-color);
            text-decoration: none;
            font-weight: 500;

            &:hover {
              text-decoration: underline;
            }
          }

          .post-author {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.875rem;
            color: var(--text-secondary);

            .author-avatar {
              width: 24px;
              height: 24px;
              border-radius: 50%;
            }
          }
        }
      }
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-top: 60px;

      .page-numbers {
        display: flex;
        gap: 8px;
      }

      .page-btn {
        min-width: 40px;
        height: 40px;
        padding: 8px 12px;
        border: 2px solid var(--bolent-border);
        background: white;
        border-radius: 8px;
        cursor: pointer;
        transition: var(--bolent-transition);

        &:hover:not(.active) {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        &.active {
          background: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
        }
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.section-sm {
  padding: 30px 0;
}
</style>
