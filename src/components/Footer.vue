<template>
  <footer class="footer">
    <div class="footer-main">
      <div class="container">
        <div class="footer-grid">
          <!-- 公司信息 -->
          <div class="footer-col">
            <div class="footer-logo">
              <router-link to="/" class="logo-link">
                <img src="/bolent-logo-white.svg" alt="深伯乐" class="logo-img" />
              </router-link>
            </div>
            <p class="footer-desc">
              您值得信赖的 IT 合作伙伴<br>
              咨询 | 方案 | 外包服务
            </p>
            <div class="social-links">
              <router-link to="/building" class="social-link" aria-label="建设中">
                <Github :size="18" />
              </router-link>
            </div>
          </div>

          <!-- 服务 -->
          <div class="footer-col">
            <h4 class="footer-title">我们的服务</h4>
            <ul class="footer-links">
              <li><router-link to="/services/outsourcing">IT 外包</router-link></li>
              <li><router-link to="/services/agile">敏捷咨询</router-link></li>
              <li><router-link to="/services/automation">自动化 & QA</router-link></li>
              <li><router-link to="/services/development">软件开发</router-link></li>
              <li><router-link to="/services/digital">数字化 & 数据</router-link></li>
              <li><router-link to="/services/it-management">IT 管理</router-link></li>
            </ul>
          </div>

          <!-- 快速链接 — 动态菜单驱动（与 Header 同源 Page Engine） -->
          <div class="footer-col">
            <h4 class="footer-title">快速链接</h4>
            <ul class="footer-links">
              <li v-for="item in quickLinks" :key="item.path">
                <router-link :to="item.path">{{ item.title }}</router-link>
              </li>
            </ul>
          </div>

          <!-- 联系方式 -->
          <div class="footer-col">
            <h4 class="footer-title">联系我们</h4>
            <ul class="footer-contact">
              <li>
                <MapPin :size="18" class="icon" />
                <span>中国 · 深圳 · 南山区</span>
              </li>
              <li>
                <Mail :size="18" class="icon" />
                <span>hello@szbolent.com.cn</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部版权 -->
    <div class="footer-bottom">
      <div class="container">
        <div class="footer-bottom-content">
          <p>&copy; {{ currentYear }} {{ companyInfo.fullName }} | <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">{{ companyInfo.icp }}</a></p>
          <div class="footer-bottom-links">
            <router-link to="/privacy">隐私政策</router-link>
            <router-link to="/terms">服务条款</router-link>
          </div>
        </div>
        <p class="release-note">tag {{ releaseTag }}</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Github, MapPin, Mail } from 'lucide-vue-next'
import { useDynamicRouter } from '@/composables/useDynamicRouter'
import { companyInfo } from '@/config/company'

const { menus, loadMenus } = useDynamicRouter()

/** 快捷链接：来自 Page Engine 的动态菜单（去重首页、过滤外链） */
const quickLinks = computed(() => {
  return menus.value.filter((item) => {
    // 首页 Footer 已有 logo 区域，不重复
    if (item.path === '/') return false
    // 外链不展示在快速链接
    if (item.path?.startsWith('http')) return false
    return true
  })
})

onMounted(() => {
  // 幂等加载菜单数据（与 Header 共享 ref，不会重复请求）
  loadMenus(undefined, 'szbolent')
})

const currentYear = computed(() => new Date().getFullYear())
const releaseTag = __RELEASE_TAG__
</script>

<style scoped lang="scss">
.footer {
  background: var(--bolent-ink);
  color: rgba(255, 255, 255, 0.7);

  .footer-main {
    padding: 80px 0 40px;

    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 40px;

      .footer-col {
        .footer-logo {
          margin-bottom: 20px;

          .logo-link {
            display: inline-block;
            transition: opacity 0.3s;

            &:hover {
              opacity: 0.85;
            }
          }

          .logo-img {
            height: 44px;
            width: auto;
          }
        }

        .footer-desc {
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.8;
          margin-bottom: 24px;
        }

        .social-links {
          display: flex;
          gap: 12px;

          .social-link {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.7);
            transition: var(--bolent-transition);

            &:hover {
              background: rgba(255, 255, 255, 0.2);
              color: #fff;
              transform: translateY(-3px);
            }
          }
        }

        .footer-title {
          font-size: 18px;
          font-weight: var(--bolent-fw-medium);
          color: #fff;
          margin-bottom: 24px;
          position: relative;
          padding-bottom: 12px;

          &::after {
            content: '';
            position: absolute;
            left: 0;
            bottom: 0;
            width: 40px;
            height: 2px;
            background: var(--bolent-accent-light);
            opacity: 0.5;
          }
        }

        .footer-links {
          li {
            margin-bottom: 12px;

            a {
              color: rgba(255, 255, 255, 0.8);
              font-size: 14px;
              transition: var(--bolent-transition);
              display: inline-block;

              &:hover {
                color: white;
                padding-left: 8px;
              }
            }
          }
        }

        .footer-contact {
          li {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            line-height: 1.6;
            align-items: center;

            .icon {
              flex-shrink: 0;
              opacity: 0.6;
            }
          }
        }
      }
    }
  }

  .footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 24px 0;

    .release-note {
      margin: 10px 0 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      letter-spacing: 0.02em;
      color: rgba(255, 255, 255, 0.45);
    }

    .footer-bottom-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;

      p {
        margin: 0;
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
      }

      .footer-bottom-links {
        display: flex;
        gap: 24px;

        a {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          transition: color 0.3s;

          &:hover {
            color: white;
          }
        }
      }
    }
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .footer {
    .footer-main {
      padding: 50px 0 30px;

      .footer-grid {
        grid-template-columns: 1fr;
        gap: 30px;
      }
    }

    .footer-bottom {
      .footer-bottom-content {
        flex-direction: column;
        text-align: center;
      }
    }
  }
}
</style>
