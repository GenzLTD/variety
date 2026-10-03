<template>
  <div class="home-page">
    <!-- ════════════════════════════════════════════════════
         Hero — HarmonyOS 生态服务商
         ════════════════════════════════════════════════════ -->
    <section class="hero-section">
      <div class="hero-bg">
        <div class="hero-glow hero-glow--1"></div>
        <div class="hero-glow hero-glow--2"></div>
        <div class="hero-grid"></div>
      </div>
      <div class="container">
        <div class="hero-content" data-aos="fade-up">
          <!-- 生态认证徽章 -->
          <div class="hero-badges">
            <span class="badge" v-for="badge in partnerBadges" :key="badge.text">
              <component :is="badge.icon" :size="16" stroke-width="2" />
              {{ badge.text }}
            </span>
          </div>

          <h1 class="hero-title">HarmonyOS <span class="hero-highlight">生态服务商</span></h1>
          <p class="hero-subtitle">智能终端 · 应用开发 · 解决方案</p>
          <p class="hero-description">{{ company.tagline }}</p>

          <div class="hero-actions">
            <router-link to="/case-study" class="btn btn-harmony btn-large">
              <Zap :size="18" />
              查看案例
            </router-link>
            <router-link to="/blog" class="btn btn-outline-light btn-large">
              书店
            </router-link>
            <router-link to="/contact" class="btn btn-outline-light btn-large">
              联系我们
            </router-link>
          </div>
        </div>
      </div>

      <!-- 滚动提示 -->
      <div class="scroll-indicator" data-aos="fade-up" data-aos-delay="800">
        <ChevronDown :size="20" />
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════
         鸿蒙全栈能力
         ════════════════════════════════════════════════════ -->
    <section class="harmony-section section">
      <div class="container">
        <div class="section-header-center" data-aos="fade-up">
          <span class="section-tag">HARMONYOS ECOSYSTEM</span>
          <h2 class="section-heading">鸿蒙全栈能力</h2>
          <p class="section-lead">
            覆盖从芯片适配、昇腾 AI 到应用分发的 HarmonyOS 全生态链路，<br />打造端到端的鸿蒙化与算力解决方案
          </p>
        </div>

        <div class="harmony-grid">
          <div
            v-for="(item, i) in harmonyCapabilities"
            :key="item.title"
            class="harmony-card"
            data-aos="fade-up"
            :data-aos-delay="i * 100"
          >
            <div class="harmony-card-icon">
              <component :is="item.icon" :size="28" stroke-width="1.5" />
            </div>
            <h3 class="harmony-card-title">{{ item.title }}</h3>
            <p class="harmony-card-desc">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════
         核心服务
         ════════════════════════════════════════════════════ -->
    <section class="services-section section">
      <div class="container">
        <div class="section-header-center" data-aos="fade-up">
          <span class="section-tag">SERVICES</span>
          <h2 class="section-heading">核心服务</h2>
          <p class="section-lead">全方位 IT 服务，以工程精度交付每一个项目</p>
        </div>

        <div class="services-grid">
          <div
            v-for="(service, index) in services"
            :key="service.slug"
            class="service-card card"
            data-aos="fade-up"
            :data-aos-delay="index * 80"
          >
            <div class="service-icon" :style="{ background: service.gradient }">
              <component :is="service.icon" :size="32" stroke-width="1.5" color="#fff" />
            </div>
            <h3 class="service-title">{{ service.title }}</h3>
            <p class="service-description">{{ service.description }}</p>
            <router-link :to="`/services/${service.slug}`" class="service-link">
              了解更多
              <ArrowRight :size="16" />
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════
         精选案例
         ════════════════════════════════════════════════════ -->
    <section class="cases-section section" style="background: var(--bolent-bg-soft);">
      <div class="container">
        <div class="section-header-center" data-aos="fade-up">
          <span class="section-tag">CASE STUDIES</span>
          <h2 class="section-heading">精选案例</h2>
          <p class="section-lead">以结果说话，这是我们交付价值的证明</p>
        </div>

        <div class="cases-grid">
          <div
            v-for="(item, i) in featuredCases"
            :key="item.title"
            class="case-card"
            data-aos="fade-up"
            :data-aos-delay="i * 150"
          >
            <div class="case-visual">
              <component :is="item.icon" :size="48" stroke-width="1" />
              <span class="case-tag">{{ item.tag }}</span>
            </div>
            <div class="case-body">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <div class="case-metrics" v-if="item.metrics">
                <div class="metric" v-for="m in item.metrics" :key="m.label">
                  <span class="metric-value">{{ m.value }}</span>
                  <span class="metric-label">{{ m.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════
         为什么选择我们
         ════════════════════════════════════════════════════ -->
    <section class="features-section section">
      <div class="container">
        <div class="section-header-center" data-aos="fade-up">
          <span class="section-tag">深伯乐</span>
          <h2 class="section-heading">为什么选择我们</h2>
          <p class="section-lead">不只是外包，我们是您值得信赖的技术合伙人</p>
        </div>

        <div class="features-grid">
          <div
            v-for="(feature, index) in features"
            :key="feature.title"
            class="feature-card"
            data-aos="zoom-in"
            :data-aos-delay="index * 100"
          >
            <div class="feature-icon">
              <component :is="feature.icon" :size="36" stroke-width="1.5" />
            </div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════
         CTA
         ════════════════════════════════════════════════════ -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content" data-aos="fade-up">
          <h2>准备好开启鸿蒙化之旅了吗？</h2>
          <p>无论是应用迁移、硬件适配还是生态共建，我们与您并肩前行</p>
          <router-link to="/contact" class="btn btn-harmony btn-large">
            <MessageCircle :size="18" />
            立即咨询
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { companyInfo as company } from '@/config/company'
import {
  Database, Code2, Bot, Settings, Rocket, Globe,
  Target, Sparkles, Wrench, HeartHandshake,
  Smartphone, Cpu, Atom, Package, GitMerge,
  Layers, ShoppingBag, Cloud, BrainCircuit,
  Zap, ArrowRight, ChevronDown, MessageCircle,
  CheckCircle, Shield, Award,
} from 'lucide-vue-next'
import type { Component } from 'vue'

// ─── 生态认证徽章（真源：company.certifications）───
const badgeIconByLabel: Record<string, Component> = {
  'HarmonyOS 开发者': CheckCircle,
  '鸿蒙生态合作伙伴': Shield,
  'OpenHarmony 贡献者': Award,
  '昇腾 ISV 认证服务商': BrainCircuit,
}

const partnerBadges = computed(() =>
  company.certifications.map((text) => ({
    text,
    icon: badgeIconByLabel[text] ?? Award,
  })),
)

// ─── 鸿蒙全栈能力（含昇腾 AI）───
const harmonyCapabilities = ref([
  {
    icon: Smartphone,
    title: '鸿蒙应用开发',
    description: '基于 ArkUI + ArkTS 的原生应用开发，覆盖手机、平板、车机等多设备形态',
  },
  {
    icon: Cpu,
    title: '硬件适配 & 驱动',
    description: '芯片平台适配、HDF 驱动开发、外设接入，让硬件轻松融入鸿蒙生态',
  },
  {
    icon: BrainCircuit,
    title: '昇腾 AI 适配',
    description: '面向昇腾算力的模型迁移、推理部署与行业方案集成，服务 ISV 认证交付链路',
  },
  {
    icon: Atom,
    title: '原子化服务',
    description: '免安装、即用即走的轻量化服务，多端流转，提升用户体验与留存',
  },
  {
    icon: Package,
    title: '鸿蒙分发 & 上架',
    description: '全流程指引 AppGallery Connect 上架、测试分发、合规审核',
  },
  {
    icon: GitMerge,
    title: 'OpenHarmony 共建',
    description: '开源社区贡献、SIG 组参与、行业发行版定制，推动生态共建',
  },
  {
    icon: Layers,
    title: '跨端迁移方案',
    description: '从 Android/iOS 到 HarmonyOS 的应用迁移，降低迁移成本与风险',
  },
])

// ─── 核心服务 ───
const services = ref([
  {
    icon: Database,
    title: '数字化 & 数据',
    description: '数据采集、治理与分析平台搭建，让数据成为您的核心资产',
    slug: 'digital',
    gradient: 'var(--service-blue)',
  },
  {
    icon: Code2,
    title: '软件开发',
    description: '从需求到交付的全周期应用开发，前后端、移动端全覆盖',
    slug: 'development',
    gradient: 'var(--service-purple)',
  },
  {
    icon: Bot,
    title: '自动化 & QA',
    description: '测试自动化框架搭建、CI/CD 流水线建设，提升交付质量与效率',
    slug: 'automation',
    gradient: 'var(--service-teal)',
  },
  {
    icon: Settings,
    title: 'IT 管理',
    description: '基础设施运维、监控告警、成本优化，让 IT 资产可管可控',
    slug: 'it-management',
    gradient: 'var(--service-green)',
  },
  {
    icon: Rocket,
    title: '敏捷咨询',
    description: 'Scrum/Kanban 落地辅导、工程效能诊断，帮团队跑得更快',
    slug: 'agile',
    gradient: 'var(--service-orange)',
  },
  {
    icon: Globe,
    title: 'IT 外包',
    description: '按需组建技术团队，灵活扩展产能，专注核心业务增长',
    slug: 'outsourcing',
    gradient: 'var(--service-amber)',
  },
])

// ─── 精选案例 ───
const featuredCases = ref([
  {
    icon: Smartphone,
    tag: '鸿蒙应用',
    title: '智能诗词 App — HarmonyOS 原生版',
    description: '基于 ArkUI 重构诗词鉴赏应用，集成 AI 语音朗读与卡片流转，已上架 AppGallery',
    metrics: [
      { value: '4.8★', label: '应用评分' },
      { value: '50K+', label: '下载量' },
    ],
  },
  {
    icon: Cloud,
    tag: '数字化',
    title: '某制造业工厂数字化平台',
    description: '端到端数据采集与可视化系统，实现产线实时监控与异常预警，良品率提升 12%',
    metrics: [
      { value: '12%', label: '良品率提升' },
      { value: '30%', label: '运维效率提升' },
    ],
  },
  {
    icon: ShoppingBag,
    tag: '电商',
    title: '跨境电商全链路平台',
    description: '从选品到履约的完整电商系统，多语言、多币种、多仓储，月 GMV 破百万',
    metrics: [
      { value: '1M+', label: '月 GMV' },
      { value: '99.9%', label: '系统可用性' },
    ],
  },
])

// ─── 为什么选择我们 ───
const features = ref([
  {
    icon: Target,
    title: '领域专业',
    description: '深耕鸿蒙生态与企业数字化，丰富的行业落地经验',
  },
  {
    icon: Sparkles,
    title: '卓越品质',
    description: '工程级精度交付，代码评审覆盖率 > 85%，测试覆盖率 > 80%',
  },
  {
    icon: Wrench,
    title: '技术前沿',
    description: '持续跟进 HarmonyOS/OpenHarmony 最新版本与技术演进',
  },
  {
    icon: HeartHandshake,
    title: '客户至上',
    description: '不止于交付，我们关注长期合作与客户成功',
  },
])
</script>

<style scoped lang="scss">
/* ══════════════════════════════════════════════
   Shared Section Styles
   ══════════════════════════════════════════════ */
.section-header-center {
  text-align: center;
  margin-bottom: 64px;
}

.section-tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2.5px;
  color: var(--bolent-primary);
  background: var(--bolent-primary-50);
  padding: 6px 16px;
  border-radius: var(--bolent-radius-pill);
  margin-bottom: 20px;
}

.section-heading {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--bolent-ink);
  margin-bottom: 16px;
}

.section-lead {
  font-size: 1.125rem;
  color: var(--bolent-text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.7;
}

/* ══════════════════════════════════════════════
   Hero
   ══════════════════════════════════════════════ */
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #0A0E27 0%, #111640 30%, #0E2A4A 60%, #0A4F4C 100%);
  overflow: hidden;

  .hero-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .hero-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.3;

    &--1 {
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(26, 115, 232, 0.4), transparent 70%);
      top: -200px;
      right: -100px;
      animation: glowPulse 8s ease-in-out infinite;
    }

    &--2 {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(107, 78, 255, 0.3), transparent 70%);
      bottom: -150px;
      left: -100px;
      animation: glowPulse 8s ease-in-out infinite 3s;
    }
  }

  .hero-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  .container {
    position: relative;
    z-index: 1;
  }

  .hero-content {
    text-align: center;
    color: #fff;
    max-width: 860px;
    margin: 0 auto;
    padding: 40px 20px;

    /* 覆盖全局 h1/p 的深色墨色（main.scss），否则暗色 hero 上几乎不可见 */
    h1, h2, h3, h4, h5, h6, p {
      color: inherit;
    }
  }

  .hero-badges {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 32px;

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      border-radius: var(--bolent-radius-pill);
      font-size: 13px;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.9);
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.18);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
      }
    }
  }

  .hero-title {
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 800;
    line-height: 1.15;
    margin-bottom: 20px;
    letter-spacing: -0.02em;
    color: #fff;

    .hero-highlight {
      background: linear-gradient(135deg, #7EB6F6, #C4B5FD);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .hero-subtitle {
    font-size: 1.35rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 12px;
    letter-spacing: 4px;
  }

  .hero-description {
    font-size: 1.15rem;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 48px;
    line-height: 1.7;
  }

  .hero-actions {
    display: flex;
    gap: 20px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .scroll-indicator {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.35);
    animation: scrollBounce 2s ease-in-out infinite;
  }
}

/* ─── Harmony Button ─── */
.btn-harmony {
  background: linear-gradient(135deg, #1A73E8, #6B4EFF);
  color: #fff;
  border: none;

  &:hover {
    box-shadow: 0 8px 32px rgba(26, 115, 232, 0.4);
    transform: translateY(-3px);
    color: #fff;
  }

  &:active {
    transform: scale(0.97);
  }
}

.btn-outline-light {
  background: transparent;
  border: 1.5px solid rgba(255, 255, 255, 0.65);
  color: #fff;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.9);
    color: #fff;
  }
}

/* ══════════════════════════════════════════════
   HarmonyOS Section
   ══════════════════════════════════════════════ */
.harmony-section {
  background: linear-gradient(180deg, var(--harmony-bg), #fff);

  .section-tag {
    color: var(--harmony-primary);
    background: rgba(26, 115, 232, 0.08);
  }

  .harmony-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
  }

  .harmony-card {
    background: #fff;
    border-radius: var(--bolent-radius-lg);
    padding: 36px 28px;
    box-shadow: var(--bolent-shadow);
    border: 1px solid transparent;
    transition: var(--bolent-transition);

    &:hover {
      box-shadow: var(--harmony-card-shadow);
      border-color: rgba(26, 115, 232, 0.15);
      transform: translateY(-4px);

      .harmony-card-icon {
        background: var(--harmony-gradient);
        svg { color: #fff; }
      }
    }

    .harmony-card-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: var(--harmony-gradient-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      transition: var(--bolent-transition);
      color: var(--harmony-primary);
    }

    .harmony-card-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 10px;
      color: var(--bolent-ink);
    }

    .harmony-card-desc {
      font-size: 0.95rem;
      color: var(--bolent-text-secondary);
      line-height: 1.65;
      margin: 0;
    }
  }
}

/* ══════════════════════════════════════════════
   Services Section
   ══════════════════════════════════════════════ */
.services-section {
  .services-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
  }

  .service-card {
    padding: 36px 28px;
    cursor: default;

    .service-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      transition: var(--bolent-transition);
    }

    &:hover .service-icon {
      transform: scale(1.08);
    }

    .service-title {
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 12px;
      color: var(--bolent-ink);
    }

    .service-description {
      font-size: 0.95rem;
      color: var(--bolent-text-secondary);
      line-height: 1.65;
      margin-bottom: 20px;
    }

    .service-link {
      font-size: 14px;
      font-weight: 600;
      color: var(--bolent-primary);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: gap 0.3s;

      &:hover { gap: 10px; }
    }
  }
}

/* ══════════════════════════════════════════════
   Cases Section
   ══════════════════════════════════════════════ */
.cases-section {
  .cases-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
  }

  .case-card {
    background: #fff;
    border-radius: var(--bolent-radius-lg);
    overflow: hidden;
    box-shadow: var(--bolent-shadow);
    transition: var(--bolent-transition);

    &:hover {
      box-shadow: var(--bolent-shadow-lg);
      transform: translateY(-4px);
    }

    .case-visual {
      height: 160px;
      background: var(--bolent-gradient-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      color: var(--bolent-primary);

      .case-tag {
        position: absolute;
        top: 14px;
        right: 14px;
        font-size: 11px;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: var(--bolent-radius-pill);
        background: var(--bolent-primary);
        color: #fff;
      }
    }

    .case-body {
      padding: 24px;

      h3 {
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 10px;
        color: var(--bolent-ink);
      }

      p {
        font-size: 0.9rem;
        color: var(--bolent-text-secondary);
        line-height: 1.6;
        margin-bottom: 18px;
      }

      .case-metrics {
        display: flex;
        gap: 28px;
        padding-top: 18px;
        border-top: 1px solid var(--bolent-border-light);

        .metric {
          text-align: center;

          .metric-value {
            display: block;
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--bolent-primary);
          }

          .metric-label {
            font-size: 12px;
            color: var(--bolent-text-muted);
          }
        }
      }
    }
  }
}

/* ══════════════════════════════════════════════
   Features Section
   ══════════════════════════════════════════════ */
.features-section {
  .features-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 28px;
  }

  .feature-card {
    text-align: center;
    padding: 36px 24px;
    background: var(--bolent-bg-soft);
    border-radius: var(--bolent-radius-lg);
    border: 1px solid transparent;
    transition: var(--bolent-transition);

    &:hover {
      border-color: var(--bolent-primary-100);
      box-shadow: var(--bolent-shadow-primary);
      transform: translateY(-4px);

      .feature-icon {
        color: var(--bolent-primary);
        transform: scale(1.1);
      }
    }

    .feature-icon {
      margin-bottom: 20px;
      color: var(--bolent-text-muted);
      transition: var(--bolent-transition);
    }

    h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 10px;
      color: var(--bolent-ink);
    }

    p {
      font-size: 0.9rem;
      color: var(--bolent-text-secondary);
      line-height: 1.6;
      margin: 0;
    }
  }
}

/* ══════════════════════════════════════════════
   CTA
   ══════════════════════════════════════════════ */
.cta-section {
  background: var(--harmony-gradient);
  padding: 120px 0;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 50%);
  }

  .cta-content {
    position: relative;
    z-index: 1;
    text-align: center;
    color: #fff;
    max-width: 600px;
    margin: 0 auto;

    h2 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 16px;
    }

    p {
      font-size: 1.2rem;
      margin-bottom: 40px;
      opacity: 0.85;
      color: rgba(255,255,255,0.9);
    }

    .btn-harmony {
      background: #fff;
      color: var(--harmony-primary);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);

      &:hover {
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
        transform: translateY(-4px);
      }
    }
  }
}

/* ══════════════════════════════════════════════
   Animations
   ══════════════════════════════════════════════ */
@keyframes glowPulse {
  0%, 100% { opacity: 0.25; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.15); }
}

@keyframes scrollBounce {
  0%, 100% { transform: translate(-50%, 0); opacity: 0.35; }
  50% { transform: translate(-50%, 8px); opacity: 0.7; }
}

/* ══════════════════════════════════════════════
   Responsive
   ══════════════════════════════════════════════ */
@media (max-width: 1024px) {
  .harmony-section .harmony-grid { grid-template-columns: repeat(2, 1fr); }
  .services-section .services-grid { grid-template-columns: repeat(2, 1fr); }
  .cases-section .cases-grid { grid-template-columns: repeat(2, 1fr); }
  .features-section .features-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .section-heading { font-size: 2rem; }
  .hero-section .hero-title { font-size: 2.2rem; }
  .hero-section .hero-subtitle { letter-spacing: 2px; }
  .cta-section { padding: 80px 0; }
  .cta-section .cta-content h2 { font-size: 2rem; }

  .harmony-section .harmony-grid { grid-template-columns: 1fr; }
  .services-section .services-grid { grid-template-columns: 1fr; }
  .cases-section .cases-grid { grid-template-columns: 1fr; }
  .features-section .features-grid { grid-template-columns: 1fr; }

  .hero-section .hero-badges { gap: 8px; }
  .hero-section .hero-badges .badge { padding: 6px 14px; font-size: 12px; }
}
</style>
