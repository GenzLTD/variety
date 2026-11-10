<template>
  <div class="home-page">
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">深圳 · 企业软件与鸿蒙工程</p>
          <h1>以工程精度，<br><em>把系统交付出去</em></h1>
          <p class="lede">{{ company.tagline }}</p>
          <p class="certs">{{ company.certifications.join('  /  ') }}</p>
          <div class="hero-actions">
            <router-link to="/services" class="btn btn-primary btn-large">看服务</router-link>
            <router-link to="/case-study" class="btn btn-outline btn-large">看案例</router-link>
          </div>
        </div>
        <ol class="hero-list">
          <li v-for="(item, i) in harmonyCapabilities.slice(0, 4)" :key="item.title">
            <span>{{ String(i + 1).padStart(2, '0') }}</span>
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ item.description }}</p>
            </div>
          </li>
        </ol>
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
            class="service-card"
            data-aos="fade-up"
            :data-aos-delay="index * 80"
          >
            <div class="service-icon">
              <component :is="service.icon" :size="22" stroke-width="1.5" />
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
import { ref } from 'vue'
import { companyInfo as company } from '@/config/company'
import {
  Database, Code2, Bot, Settings, Rocket, Globe,
  Target, Sparkles, Wrench, HeartHandshake,
  Smartphone, Cpu, Atom, Package, GitMerge,
  Layers, ShoppingBag, Cloud, BrainCircuit,
  ArrowRight, MessageCircle,
} from 'lucide-vue-next'

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
    description: '评审和测试写进交付过程，不把半成品交给客户',
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
.home-page {
  background: var(--bolent-bg-warm);
  color: var(--bolent-ink);
}

.hero {
  padding: 72px 0 64px;
  border-bottom: 1px solid var(--bolent-border);
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
  gap: 64px;
  align-items: end;
}

.eyebrow {
  font-family: var(--bolent-font-en);
  font-size: 13px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--bolent-accent-dark);
  margin-bottom: 20px;
}

.hero-copy h1 {
  font-family: var(--bolent-font-serif);
  font-size: clamp(40px, 5vw, 64px);
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin-bottom: 20px;

  em {
    font-style: normal;
    color: var(--bolent-primary);
  }
}

.lede {
  font-size: 18px;
  max-width: 36rem;
  color: var(--bolent-text);
  margin-bottom: 16px;
}

.certs {
  font-size: 13px;
  color: var(--bolent-text-muted);
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-list {
  list-style: none;
  margin: 0;
  background: var(--bolent-ink);
  color: #f4f1ea;
  padding: 8px 28px;

  li {
    display: grid;
    grid-template-columns: 36px 1fr;
    gap: 12px;
    padding: 18px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);

    &:last-child { border-bottom: 0; }
  }

  span {
    font-family: var(--bolent-font-en);
    font-size: 12px;
    letter-spacing: 0.08em;
    color: var(--bolent-accent-light);
    padding-top: 4px;
  }

  strong {
    display: block;
    font-weight: 500;
    margin-bottom: 4px;
  }

  p {
    margin: 0;
    color: rgba(244, 241, 234, 0.72);
    font-size: 14px;
    line-height: 1.6;
  }
}

.section-header-center {
  text-align: left;
  max-width: 40rem;
  margin-bottom: 40px;
}

.section-tag {
  display: block;
  font-family: var(--bolent-font-en);
  font-size: 12px;
  letter-spacing: 0.16em;
  color: var(--bolent-accent-dark);
  margin-bottom: 10px;
}

.section-heading {
  font-family: var(--bolent-font-serif);
  font-size: clamp(28px, 3vw, 40px);
  font-weight: 500;
  margin-bottom: 12px;
}

.section-lead {
  margin: 0;
  color: var(--bolent-text-secondary);
}

.harmony-section,
.services-section,
.features-section {
  background: #fff;
}

.harmony-grid,
.services-grid,
.features-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid var(--bolent-border);
}

.harmony-card,
.service-card,
.feature-card {
  padding: 28px 8px 28px 0;
  border-bottom: 1px solid var(--bolent-border);
  background: transparent;
  box-shadow: none;
  border-radius: 0;

  &:nth-child(odd) { padding-right: 32px; }
  &:nth-child(even) { padding-left: 32px; border-left: 1px solid var(--bolent-border); }
}

.harmony-card-icon,
.service-icon,
.feature-icon {
  color: var(--bolent-primary);
  margin-bottom: 14px;
}

.service-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: var(--bolent-primary-50) !important;
  border-radius: 0;
}

.harmony-card-title,
.service-title,
.feature-card h3 {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 8px;
}

.harmony-card-desc,
.service-description,
.feature-card p {
  margin: 0;
  color: var(--bolent-text-secondary);
  font-size: 15px;
}

.service-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  color: var(--bolent-primary-dark);
  font-size: 14px;
}

.cases-grid {
  display: grid;
  gap: 20px;
}

.case-card {
  display: grid;
  grid-template-columns: 160px 1fr;
  background: #fff;
  border: 1px solid var(--bolent-border);
}

.case-visual {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  background: var(--bolent-primary-50);
  color: var(--bolent-primary-dark);
}

.case-tag {
  font-size: 12px;
  letter-spacing: 0.08em;
}

.case-body {
  padding: 20px 24px;

  h3 { font-size: 20px; font-weight: 500; margin-bottom: 8px; }
  p { margin: 0 0 16px; }
}

.case-metrics {
  display: flex;
  gap: 28px;
}

.metric-value {
  display: block;
  font-family: var(--bolent-font-serif);
  font-size: 22px;
}

.metric-label {
  font-size: 12px;
  color: var(--bolent-text-muted);
}

.cta-section {
  background: var(--bolent-ink);
  color: #f4f1ea;
  padding: 72px 0;

  h2, p { color: inherit; }
  h2 {
    font-family: var(--bolent-font-serif);
    font-weight: 500;
    margin-bottom: 12px;
  }
}

.cta-content .btn {
  margin-top: 8px;
  background: var(--bolent-accent);
  color: var(--bolent-ink);
}

@media (max-width: 860px) {
  .hero-grid,
  .harmony-grid,
  .services-grid,
  .features-grid,
  .case-card {
    grid-template-columns: 1fr;
  }

  .harmony-card,
  .service-card,
  .feature-card {
    &:nth-child(odd),
    &:nth-child(even) {
      padding: 24px 0;
      border-left: 0;
    }
  }
}
</style>
