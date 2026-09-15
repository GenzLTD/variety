<template>
  <div class="blog-detail-page">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误 / 降级空态 -->
    <div v-else-if="error" class="error-container">
      <h2>内容暂不可用</h2>
      <p>{{ error }}</p>
      <p class="error-hint">博客由 WordPress 提供；若持续失败请检查本地 :8800 与 MySQL 容器。</p>
      <router-link to="/blog" class="btn btn-primary">返回博客列表</router-link>
    </div>

    <!-- 文章内容 -->
    <article v-else-if="post" class="post-article">
      <!-- 文章头部 -->
      <header class="post-header">
        <div class="container">
          <div class="breadcrumb">
            <router-link to="/">首页</router-link>
            <span>/</span>
            <router-link to="/blog">博客</router-link>
            <span>/</span>
            <span>{{ post.title.rendered }}</span>
          </div>

          <h1 class="post-title" data-aos="fade-up">{{ post.title.rendered }}</h1>

          <div class="post-meta" data-aos="fade-up" data-aos-delay="100">
            <div class="meta-left">
              <div v-if="author" class="author-info">
                <img 
                  v-if="author.avatar_urls"
                  :src="author.avatar_urls['48']"
                  :alt="author.name"
                  class="author-avatar"
                />
                <span class="author-name">{{ author.name }}</span>
              </div>
              <span class="post-date">{{ formatDate(post.date) }}</span>
            </div>

            <div class="meta-right">
              <div v-if="postCategories.length" class="post-categories">
                <span 
                  v-for="cat in postCategories"
                  :key="cat.id"
                  class="category-tag"
                >
                  {{ cat.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- 特色图片 -->
      <div v-if="featuredImage" class="featured-image">
        <img :src="featuredImage" :alt="post.title.rendered" />
      </div>

      <!-- 文章正文 -->
      <section class="post-content">
        <div class="container">
          <div class="content-grid">
            <!-- 主要内容 -->
            <div class="main-content">
              <div class="wp-content" v-html="safeContent"></div>

              <!-- 标签 -->
              <div v-if="postTags.length" class="post-tags">
                <h4>标签：</h4>
                <div class="tags-list">
                  <span 
                    v-for="tag in postTags"
                    :key="tag.id"
                    class="tag-item"
                  >
                    #{{ tag.name }}
                  </span>
                </div>
              </div>

              <!-- 分享 -->
              <div class="post-share">
                <h4>分享文章：</h4>
                <div class="share-buttons">
                  <button @click="shareToWeChat" class="share-btn wechat">
                    <span>微信</span>
                  </button>
                  <button @click="shareToWeibo" class="share-btn weibo">
                    <span>微博</span>
                  </button>
                  <button @click="copyLink" class="share-btn link">
                    <span>{{ copied ? '✓ 已复制' : '复制链接' }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 侧边栏 -->
            <aside class="sidebar">
              <div class="sidebar-card author-card" v-if="author">
                <h3>关于作者</h3>
                <div class="author-details">
                  <img 
                    v-if="author.avatar_urls"
                    :src="author.avatar_urls['96']"
                    :alt="author.name"
                    class="author-avatar-large"
                  />
                  <h4>{{ author.name }}</h4>
                  <p v-if="author.description">{{ author.description }}</p>
                </div>
              </div>

              <div class="sidebar-card toc-card">
                <h3>目录</h3>
                <div class="table-of-contents">
                  <p class="toc-placeholder">文章目录正在生成中...</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <!-- 相关文章 -->
      <section class="related-posts section" v-if="relatedPosts.length">
        <div class="container">
          <h2>相关文章</h2>
          <div class="related-grid">
            <div 
              v-for="relatedPost in relatedPosts"
              :key="relatedPost.id"
              class="related-card"
            >
              <div class="related-thumbnail">
                <img 
                  v-if="getRelatedFeaturedImage(relatedPost)"
                  :src="getRelatedFeaturedImage(relatedPost)"
                  :alt="relatedPost.title.rendered"
                />
                <div v-else class="thumbnail-placeholder">📝</div>
              </div>
              <div class="related-content">
                <h4>
                  <router-link :to="`/blog/${relatedPost.slug}`">
                    {{ relatedPost.title.rendered }}
                  </router-link>
                </h4>
                <p class="related-date">{{ formatDate(relatedPost.date) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 增长型门户 CTA：主 PlanetX / 次 DemoPPI -->
      <section class="growth-cta section">
        <div class="container">
          <div class="growth-cta__inner">
            <h3>{{ growthCopy.title }}</h3>
            <p class="growth-cta__lead">{{ growthCopy.lead }}</p>
            <div class="growth-cta__actions">
              <a
                class="btn btn-primary btn-large"
                :href="planetxUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ growthCopy.primary }}
              </a>
              <a
                v-if="demoppiUrl"
                class="btn btn-outline btn-large"
                :href="demoppiUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ growthCopy.secondary }}
              </a>
              <router-link to="/contact" class="btn btn-outline btn-large">
                {{ growthCopy.contact }}
              </router-link>
            </div>
            <p v-if="hasRefCode" class="growth-cta__hint">
              演示模式：主按钮已拼 <code>?ref=</code>（仅验 URL，不代表归因核销）。
              正式环境请将 <code>VITE_PLANETX_REF_CODE</code> 留空。
            </p>
          </div>
        </div>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getPostBySlug, getPosts, formatDate, sanitizeHTML, type WPPost } from '@/api/wordpress'
import {
  DEMOPPI_URL,
  PLANETX_REF_CODE,
  growthCtaCopy,
  planetxInviteUrl,
} from '@/config/growth'

const route = useRoute()

const post = ref<WPPost | null>(null)
const relatedPosts = ref<WPPost[]>([])
const loading = ref(false)
const error = ref('')
const copied = ref(false)

const growthCopy = growthCtaCopy
const planetxUrl = planetxInviteUrl()
const demoppiUrl = DEMOPPI_URL
const hasRefCode = Boolean(PLANETX_REF_CODE)

// 计算属性
const author = computed(() => post.value?._embedded?.author?.[0])
const postCategories = computed(() => post.value?._embedded?.['wp:term']?.[0] || [])
const postTags = computed(() => post.value?._embedded?.['wp:term']?.[1] || [])
const featuredImage = computed(() => post.value?._embedded?.['wp:featuredmedia']?.[0]?.source_url)
const safeContent = computed(() => sanitizeHTML(post.value?.content?.rendered || ''))

// 加载文章
const loadPost = async () => {
  const slug = route.params.slug as string
  
  if (!slug) {
    error.value = '文章不存在'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const postData = await getPostBySlug(slug)
    
    if (!postData) {
      error.value = '文章未找到'
      return
    }

    post.value = postData
    
    // 加载相关文章
    if (postData.categories.length > 0) {
      loadRelatedPosts(postData.categories[0], postData.id)
    }
  } catch (err: any) {
    const msg = String(err?.message || '')
    if (/Failed to fetch|NetworkError|ECONNREFUSED|500|502|503|504/i.test(msg)) {
      error.value = '内容暂不可用，请稍后再试'
    } else {
      error.value = msg || '加载失败，请稍后重试'
    }
    console.error('加载文章失败:', err)
  } finally {
    loading.value = false
  }
}

// 加载相关文章
const loadRelatedPosts = async (categoryId: number, currentPostId: number) => {
  try {
    const result = await getPosts({
      categories: [categoryId],
      per_page: 3
    })
    
    relatedPosts.value = result.posts.filter(p => p.id !== currentPostId).slice(0, 3)
  } catch (err) {
    console.error('加载相关文章失败:', err)
  }
}

// 分享功能
const shareToWeChat = () => {
  alert('请使用微信扫描分享')
  // 实际应用中可以生成二维码
}

const shareToWeibo = () => {
  const url = window.location.href
  const title = post.value?.title.rendered || ''
  window.open(`https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`)
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 辅助函数
const getRelatedFeaturedImage = (post: WPPost) => {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url || ''
}

// 监听路由变化
watch(() => route.params.slug, () => {
  if (route.name === 'blog-detail') {
    loadPost()
    window.scrollTo(0, 0)
  }
})

// 初始化
onMounted(() => {
  loadPost()
})
</script>

<style scoped lang="scss">
.blog-detail-page {
  padding-top: 70px;
  min-height: calc(100vh - 70px);

  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;

    .spinner {
      width: 50px;
      height: 50px;
      margin-bottom: 20px;
      border: 4px solid var(--bolent-bg-soft);
      border-top: 4px solid var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .error-hint {
      max-width: 420px;
      font-size: 0.95rem;
      color: var(--bolent-text-muted);
      margin: 0 16px 20px;
      line-height: 1.6;
    }

    h2 {
      margin-bottom: 16px;
      color: var(--text-primary);
    }

    p {
      color: var(--text-secondary);
      margin-bottom: 24px;
    }
  }

  .post-article {
    .post-header {
      background: var(--bg-light);
      padding: 40px 0 60px;

      .breadcrumb {
        margin-bottom: 30px;
        font-size: 14px;
        color: var(--text-secondary);

        a {
          color: var(--text-secondary);
          text-decoration: none;

          &:hover {
            color: var(--primary-color);
          }
        }

        span {
          margin: 0 10px;
        }
      }

      .post-title {
        font-size: 2.5rem;
        line-height: 1.3;
        margin-bottom: 30px;
        color: var(--text-primary);
        max-width: 900px;

        @media (max-width: 768px) {
          font-size: 2rem;
        }
      }

      .post-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 20px;

        .meta-left {
          display: flex;
          align-items: center;
          gap: 20px;

          .author-info {
            display: flex;
            align-items: center;
            gap: 12px;

            .author-avatar {
              width: 40px;
              height: 40px;
              border-radius: 50%;
            }

            .author-name {
              font-weight: 500;
              color: var(--text-primary);
            }
          }

          .post-date {
            color: var(--text-secondary);
          }
        }

        .post-categories {
          display: flex;
          gap: 8px;

          .category-tag {
            padding: 6px 16px;
            background: var(--primary-color);
            color: white;
            border-radius: 16px;
            font-size: 0.875rem;
          }
        }
      }
    }

    .featured-image {
      max-width: 1200px;
      margin: -40px auto 60px;
      padding: 0 20px;

      img {
        width: 100%;
        border-radius: 12px;
        box-shadow: var(--bolent-shadow-lg);
      }
    }

    .post-content {
      padding: 40px 0;

      .content-grid {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 60px;

        @media (max-width: 992px) {
          grid-template-columns: 1fr;
          gap: 40px;
        }
      }

      .main-content {
        max-width: 800px;

        .wp-content {
          font-size: 1.125rem;
          line-height: 1.8;
          color: var(--text-primary);

          :deep(h2), :deep(h3), :deep(h4) {
            margin: 40px 0 20px;
            color: var(--text-primary);
          }

          :deep(h2) {
            font-size: 2rem;
          }

          :deep(h3) {
            font-size: 1.5rem;
          }

          :deep(p) {
            margin-bottom: 20px;
          }

          :deep(img) {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 30px 0;
          }

          :deep(a) {
            color: var(--primary-color);
            text-decoration: none;

            &:hover {
              text-decoration: underline;
            }
          }

          :deep(code) {
            padding: 2px 8px;
            background: var(--bolent-bg-soft);
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
          }

          :deep(pre) {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 30px 0;

            code {
              background: none;
              padding: 0;
            }
          }

          :deep(blockquote) {
            border-left: 4px solid var(--primary-color);
            padding-left: 20px;
            margin: 30px 0;
            color: var(--text-secondary);
            font-style: italic;
          }

          :deep(ul), :deep(ol) {
            margin: 20px 0;
            padding-left: 30px;

            li {
              margin-bottom: 10px;
            }
          }
        }

        .post-tags {
          margin: 60px 0 40px;
          padding-top: 30px;
          border-top: 1px solid var(--bolent-border);

          h4 {
            margin-bottom: 16px;
            color: var(--text-primary);
          }

          .tags-list {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;

            .tag-item {
              padding: 8px 16px;
              background: var(--bg-light);
              border-radius: 20px;
              color: var(--primary-color);
              font-size: 0.95rem;
            }
          }
        }

        .post-share {
          padding: 30px 0;
          border-top: 1px solid var(--bolent-border);

          h4 {
            margin-bottom: 16px;
            color: var(--text-primary);
          }

          .share-buttons {
            display: flex;
            gap: 12px;

            .share-btn {
              padding: 10px 20px;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 0.95rem;
              transition: var(--bolent-transition);

              &.wechat {
                background: #07c160;
                color: white;

                &:hover {
                  background: #06ad56;
                }
              }

              &.weibo {
                background: #e6162d;
                color: white;

                &:hover {
                  background: #d0162b;
                }
              }

              &.link {
                background: var(--bg-light);
                color: var(--text-primary);

                &:hover {
                  background: var(--bolent-border);
                }
              }
            }
          }
        }
      }

      .sidebar {
        .sidebar-card {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: var(--bolent-shadow);
          margin-bottom: 30px;

          h3 {
            font-size: 1.25rem;
            margin-bottom: 20px;
            color: var(--text-primary);
          }
        }

        .author-card {
          .author-details {
            text-align: center;

            .author-avatar-large {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              margin-bottom: 16px;
            }

            h4 {
              margin-bottom: 12px;
              color: var(--text-primary);
            }

            p {
              font-size: 0.95rem;
              color: var(--text-secondary);
              line-height: 1.6;
            }
          }
        }

        .toc-card {
          .toc-placeholder {
            color: var(--text-secondary);
            font-size: 0.95rem;
          }
        }
      }
    }

    .related-posts {
      background: var(--bg-light);

      h2 {
        text-align: center;
        margin-bottom: 40px;
        color: var(--text-primary);
      }

      .related-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 30px;

        @media (max-width: 992px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
      }

      .related-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: var(--bolent-shadow);
        transition: var(--bolent-transition);

        &:hover {
          transform: translateY(-5px);
          box-shadow: var(--bolent-shadow-lg);
        }

        .related-thumbnail {
          position: relative;
          padding-top: 56.25%;
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
            font-size: 3rem;
            background: var(--bolent-gradient);
          }
        }

        .related-content {
          padding: 20px;

          h4 {
            margin-bottom: 8px;

            a {
              color: var(--text-primary);
              text-decoration: none;
              transition: color 0.3s ease;

              &:hover {
                color: var(--primary-color);
              }
            }
          }

          .related-date {
            font-size: 0.875rem;
            color: var(--text-secondary);
          }
        }
      }
    }

    .growth-cta {
      background: var(--bolent-gradient);
      padding: 80px 0;
      text-align: center;
      color: white;

      .growth-cta__inner {
        max-width: 720px;
        margin: 0 auto;
      }

      h3 {
        font-size: 2rem;
        margin-bottom: 16px;
        color: white;
      }

      .growth-cta__lead {
        font-size: 1.125rem;
        margin-bottom: 28px;
        opacity: 0.95;
        line-height: 1.7;
      }

      .growth-cta__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: center;
      }

      .btn-primary {
        background: white;
        color: var(--primary-color);
        border: none;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
          color: var(--primary-color);
        }
      }

      .btn-outline {
        background: transparent;
        border: 1.5px solid rgba(255, 255, 255, 0.75);
        color: white;

        &:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: white;
          color: white;
        }
      }

      .growth-cta__hint {
        margin-top: 20px;
        font-size: 0.9rem;
        opacity: 0.85;

        code {
          font-family: var(--bolent-font-mono, monospace);
          padding: 0 4px;
        }
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
