<template>
  <header class="header" :class="{ 'header-scrolled': isScrolled }">
    <div class="container">
      <div class="header-wrapper">
        <!-- Logo -->
        <router-link to="/" class="logo">
          <img src="/bolent-logo.svg" alt="Bolent" class="logo-img" />
        </router-link>

        <!-- 桌面导航 — 数据源：Page Engine :5300 GET /v1/menus?product=szbolent -->
        <nav class="nav-desktop">
          <ul class="nav-menu">
            <li
              v-for="item in navItems"
              :key="item.id"
              :class="{ dropdown: item.children && item.children.length > 0 }"
            >
              <template v-if="item.children && item.children.length > 0">
                <a href="#" class="nav-link">
                  {{ item.title }}
                  <i class="icon-arrow-down"></i>
                </a>
                <ul class="dropdown-menu">
                  <li v-for="child in item.children" :key="child.id">
                    <router-link :to="child.path">{{ child.title }}</router-link>
                  </li>
                </ul>
              </template>
              <router-link v-else :to="item.path" class="nav-link">{{ item.title }}</router-link>
            </li>
          </ul>
        </nav>

        <!-- CTA 按钮 -->
        <router-link to="/contact" class="btn btn-contact">联系我们</router-link>

        <!-- 移动端菜单按钮 -->
        <button class="mobile-menu-toggle" @click="toggleMobileMenu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>

    <!-- 移动端导航 — 数据源：Page Engine -->
    <div class="mobile-nav" :class="{ 'mobile-nav-open': isMobileMenuOpen }">
      <nav>
        <ul class="mobile-nav-menu">
          <template v-for="item in navItems" :key="item.id">
            <li v-if="item.children && item.children.length > 0">
              <a href="#" @click.prevent="toggleMobileExpand(item.id)">
                {{ item.title }}
                <i class="icon-arrow-down" :class="{ 'rotate': expandedMobileIds.includes(item.id) }"></i>
              </a>
              <ul class="submenu" v-show="expandedMobileIds.includes(item.id)">
                <li v-for="child in item.children" :key="child.id">
                  <router-link :to="child.path" @click="closeMobileMenu">{{ child.title }}</router-link>
                </li>
              </ul>
            </li>
            <li v-else>
              <router-link :to="item.path" @click="closeMobileMenu">{{ item.title }}</router-link>
            </li>
          </template>
          <li>
            <router-link to="/contact" @click="closeMobileMenu" class="btn btn-primary">联系我们</router-link>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDynamicRouter } from '@/composables/useDynamicRouter'

// ── Page Engine 动态菜单 ──
const { menus, loadMenus } = useDynamicRouter()

const navItems = computed(() => menus.value)

// ── 滚动 & 移动端状态 ──
const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)

/** 移动端手风琴：记录展开的菜单项 ID */
const expandedMobileIds = ref<number[]>([])

function toggleMobileExpand(id: number) {
  const idx = expandedMobileIds.value.indexOf(id)
  if (idx > -1) expandedMobileIds.value.splice(idx, 1)
  else expandedMobileIds.value.push(id)
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  document.body.style.overflow = isMobileMenuOpen.value ? 'hidden' : ''
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  expandedMobileIds.value = []
  document.body.style.overflow = ''
}

onMounted(() => {
  // P2 最小切片：加载 szbolent 菜单树（不注入路由，仅消费数据）
  loadMenus(undefined, 'szbolent')
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.body.style.overflow = ''
})
</script>

<style scoped lang="scss">
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: var(--bolent-transition);

  &.header-scrolled {
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  }

  .header-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 70px;
  }

  .logo {
    display: flex;
    align-items: center;
    text-decoration: none;
    transition: var(--bolent-transition);

    &:hover {
      transform: translateY(-2px);
    }

    .logo-img {
      height: 40px;
      width: auto;
    }
  }

  .nav-desktop {
    flex: 1;
    display: flex;
    justify-content: center;

    .nav-menu {
      display: flex;
      align-items: center;
      gap: 32px;

      li {
        position: relative;

        &.dropdown:hover .dropdown-menu {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
      }

      .nav-link {
        font-size: 15px;
        font-weight: 500;
        padding: 8px 0;
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--text-dark);
        transition: color 0.3s;

        &:hover,
        &.router-link-active {
          color: var(--primary-color);
        }

        .icon-arrow-down::before {
          content: '▼';
          font-size: 10px;
        }
      }

      .dropdown-menu {
        position: absolute;
        top: 100%;
        left: -20px;
        min-width: 200px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        padding: 12px 0;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: var(--bolent-transition);

        li {
          a {
            display: block;
            padding: 10px 24px;
            color: var(--text-dark);
            font-size: 14px;
            transition: var(--bolent-transition);

            &:hover {
              background: var(--bg-light);
              color: var(--primary-color);
              padding-left: 28px;
            }
          }
        }
      }
    }
  }

  .btn-contact {
    padding: 10px 28px;
    background: var(--primary-color);
    color: white;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    transition: var(--bolent-transition);

    &:hover {
      background: var(--bolent-primary-dark);
      transform: translateY(-2px);
      box-shadow: var(--bolent-shadow-primary);
    }
  }

  .mobile-menu-toggle {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;

    span {
      display: block;
      width: 25px;
      height: 3px;
      background: var(--text-dark);
      border-radius: 2px;
      transition: var(--bolent-transition);
    }
  }

  .mobile-nav {
    display: none;
  }
}

/* 响应式 */
@media (max-width: 992px) {
  .header {
    .nav-desktop,
    .btn-contact {
      display: none;
    }

    .mobile-menu-toggle {
      display: flex;
    }

    .mobile-nav {
      display: block;
      position: fixed;
      top: 70px;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      overflow-y: auto;
      padding: 24px;

      &.mobile-nav-open {
        transform: translateX(0);
      }

      .mobile-nav-menu {
        li {
          border-bottom: 1px solid var(--border-color);

          &:last-child {
            border-bottom: none;
          }

          a {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 0;
            font-size: 16px;
            color: var(--text-dark);

            &.router-link-active {
              color: var(--primary-color);
            }

            .icon-arrow-down {
              transition: transform 0.3s;

              &::before {
                content: '▼';
                font-size: 10px;
              }

              &.rotate {
                transform: rotate(180deg);
              }
            }
          }

          .submenu {
            padding-left: 20px;

            li {
              border-bottom: none;

              a {
                padding: 12px 0;
                font-size: 14px;
              }
            }
          }

          .btn {
            width: 100%;
            margin-top: 16px;
            justify-content: center;
          }
        }
      }
    }
  }
}
</style>
