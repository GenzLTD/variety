<template>
  <div class="service-detail-page">
    <!-- Hero Section -->
    <section class="service-hero">
      <div class="container">
        <div class="breadcrumb">
          <router-link to="/">首页</router-link>
          <span>/</span>
          <router-link to="/services">服务</router-link>
          <span>/</span>
          <span>{{ service?.title }}</span>
        </div>
        <h1 class="service-title" data-aos="fade-up">{{ service?.title }}</h1>
        <p class="service-subtitle" data-aos="fade-up" data-aos-delay="100">
          {{ service?.subtitle }}
        </p>
      </div>
    </section>

    <!-- 服务详情 -->
    <section class="service-content section">
      <div class="container">
        <div class="content-grid">
          <!-- 左侧内容 -->
          <div class="content-main">
            <div class="service-overview" data-aos="fade-up">
              <h2>服务概述</h2>
              <p>{{ service?.overview }}</p>
            </div>

            <div class="service-features" data-aos="fade-up" data-aos-delay="100">
              <h2>核心特点</h2>
              <div class="features-list">
                <div 
                  v-for="(feature, index) in service?.features" 
                  :key="index"
                  class="feature-item"
                >
                  <div class="feature-icon">✓</div>
                  <div class="feature-content">
                    <h4>{{ feature.title }}</h4>
                    <p>{{ feature.description }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="service-benefits" data-aos="fade-up" data-aos-delay="200">
              <h2>为什么选择我们</h2>
              <ul class="benefits-list">
                <li v-for="(benefit, index) in service?.benefits" :key="index">
                  {{ benefit }}
                </li>
              </ul>
            </div>
          </div>

          <!-- 右侧侧边栏 -->
          <div class="content-sidebar">
            <div class="sidebar-card contact-card" data-aos="fade-left">
              <h3>需要帮助？</h3>
              <p>联系我们的专家团队，获取专业咨询</p>
              <router-link to="/contact" class="btn btn-primary btn-block">
                立即咨询
              </router-link>
            </div>

            <div class="sidebar-card services-list" data-aos="fade-left" data-aos-delay="100">
              <h3>其他服务</h3>
              <ul>
                <li v-for="item in otherServices" :key="item.slug">
                  <router-link :to="`/services/${item.slug}`">
                    {{ item.title }}
                  </router-link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content" data-aos="zoom-in">
          <h3>准备好开始您的项目了吗？</h3>
          <p>让我们一起探讨如何助力您的业务成功</p>
          <router-link to="/contact" class="btn btn-primary btn-large">
            联系我们
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AOS from 'aos'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

// 服务数据
const servicesData = {
  'outsourcing': {
    title: 'IT 外包服务',
    subtitle: '专业的 IT 资源外包解决方案，助力企业降本增效',
    overview: 'Bolent 提供全方位的 IT 外包服务，包括软件开发、技术支持、系统维护等。我们的专业团队能够快速响应您的需求，为您提供高质量、高性价比的技术服务，让您专注于核心业务发展。',
    features: [
      {
        title: '灵活的资源配置',
        description: '根据项目需求灵活调配技术人员，确保资源利用最大化'
      },
      {
        title: '专业团队支持',
        description: '经验丰富的开发团队，精通多种技术栈和行业最佳实践'
      },
      {
        title: '成本可控',
        description: '透明的定价机制，帮助企业有效控制 IT 成本'
      },
      {
        title: '质量保证',
        description: '严格的质量管理流程，确保交付高质量的服务'
      }
    ],
    benefits: [
      '降低运营成本，无需维持大规模内部 IT 团队',
      '快速获取专业技术人才，缩短项目周期',
      '专注核心业务，将非核心 IT 工作外包',
      '获得最新技术和行业最佳实践',
      '灵活的合作模式，按需付费'
    ]
  },
  'agile': {
    title: '敏捷咨询服务',
    subtitle: '帮助企业实现敏捷转型，提升团队协作效率',
    overview: '我们的敏捷咨询服务帮助组织采用敏捷方法论，优化开发流程，提高交付速度和质量。通过系统化的培训和实践指导，我们协助团队建立敏捷文化，实现持续改进。',
    features: [
      {
        title: '敏捷转型规划',
        description: '制定适合企业现状的敏捷转型路线图'
      },
      {
        title: 'Scrum/Kanban 实施',
        description: '指导团队采用 Scrum、Kanban 等敏捷框架'
      },
      {
        title: '团队培训',
        description: '提供敏捷方法论培训和实践工作坊'
      },
      {
        title: '持续改进',
        description: '建立回顾机制，推动团队持续优化'
      }
    ],
    benefits: [
      '加快产品上市时间，提升市场竞争力',
      '提高团队协作效率和沟通质量',
      '增强项目透明度和可预测性',
      '快速响应需求变化，降低项目风险',
      '提升团队士气和工作满意度'
    ]
  },
  'automation': {
    title: '自动化测试 & QA',
    subtitle: '全面的质量保证和自动化测试解决方案',
    overview: '我们提供端到端的软件质量保证服务，包括测试策略制定、自动化测试框架搭建、性能测试等。通过自动化和持续测试，帮助企业提升软件质量，加快发布速度。',
    features: [
      {
        title: '自动化测试框架',
        description: '搭建适合项目的自动化测试框架和 CI/CD 集成'
      },
      {
        title: '全面的测试服务',
        description: '功能测试、性能测试、安全测试、兼容性测试'
      },
      {
        title: '测试策略制定',
        description: '根据项目特点制定合理的测试策略和计划'
      },
      {
        title: '质量度量',
        description: '建立质量指标体系，持续监控软件质量'
      }
    ],
    benefits: [
      '大幅提升测试效率，减少人工测试成本',
      '及早发现缺陷，降低修复成本',
      '提高软件质量和用户满意度',
      '支持持续集成和持续交付',
      '建立可重复、可维护的测试体系'
    ]
  },
  'development': {
    title: '定制软件开发',
    subtitle: '量身定制的软件解决方案，满足您的独特需求',
    overview: 'Bolent 提供全栈软件开发服务，从需求分析到上线维护，为客户打造高质量的定制化软件产品。我们精通主流技术栈，能够开发 Web 应用、移动应用、企业系统等各类软件。',
    features: [
      {
        title: '全栈开发能力',
        description: '精通前端、后端、移动端、云服务等全栈技术'
      },
      {
        title: '敏捷开发流程',
        description: '采用敏捷方法，快速迭代，及时响应需求变化'
      },
      {
        title: '现代化技术栈',
        description: '使用 React、Vue、Node.js、Python 等主流技术'
      },
      {
        title: '完整的项目支持',
        description: '从需求分析到部署运维，提供全生命周期服务'
      }
    ],
    benefits: [
      '获得完全符合业务需求的定制化解决方案',
      '提升业务流程效率和用户体验',
      '拥有软件的完整知识产权',
      '灵活的功能扩展和系统集成能力',
      '长期技术支持和系统维护'
    ]
  },
  'digital': {
    title: '数字化转型 & 数据分析',
    subtitle: '助力企业数字化转型，释放数据价值',
    overview: '我们帮助企业进行数字化转型，建立数据驱动的决策体系。提供数据平台建设、数据分析、商业智能、大数据处理等服务，让数据成为企业的核心资产。',
    features: [
      {
        title: '数字化转型咨询',
        description: '制定企业数字化转型策略和实施路线图'
      },
      {
        title: '数据平台建设',
        description: '搭建数据仓库、数据湖等数据基础设施'
      },
      {
        title: '商业智能(BI)',
        description: '开发数据可视化和商业智能分析系统'
      },
      {
        title: '大数据分析',
        description: '提供大数据处理、机器学习、AI 应用服务'
      }
    ],
    benefits: [
      '实现业务流程数字化，提升运营效率',
      '通过数据分析发现业务洞察',
      '建立数据驱动的决策文化',
      '提升客户体验和满意度',
      '获得市场竞争优势'
    ]
  },
  'it-management': {
    title: 'IT 项目管理',
    subtitle: '专业的 IT 项目管理服务，确保项目成功交付',
    overview: '我们提供专业的 IT 项目管理服务，帮助企业有效管理复杂的 IT 项目。经验丰富的项目经理团队运用成熟的管理方法论，确保项目按时、按质、按预算完成。',
    features: [
      {
        title: '项目规划与执行',
        description: '制定详细的项目计划，协调资源，推动项目执行'
      },
      {
        title: '风险管理',
        description: '识别、评估和控制项目风险，确保项目顺利进行'
      },
      {
        title: '质量管理',
        description: '建立质量标准，实施质量控制，保证交付质量'
      },
      {
        title: '沟通协调',
        description: '促进团队协作，管理干系人期望，确保信息透明'
      }
    ],
    benefits: [
      '提高项目成功率，降低项目失败风险',
      '优化资源配置，提升项目效率',
      '控制项目成本和进度',
      '改善团队协作和沟通',
      '积累项目管理经验和最佳实践'
    ]
  }
}

const service = computed(() => servicesData[slug.value as keyof typeof servicesData] || null)

const allServices = [
  { slug: 'outsourcing', title: 'IT 外包服务' },
  { slug: 'agile', title: '敏捷咨询服务' },
  { slug: 'automation', title: '自动化测试 & QA' },
  { slug: 'development', title: '定制软件开发' },
  { slug: 'digital', title: '数字化转型 & 数据分析' },
  { slug: 'it-management', title: 'IT 项目管理' }
]

const otherServices = computed(() => {
  return allServices.filter(s => s.slug !== slug.value)
})

onMounted(() => {
  AOS.refresh()
})
</script>

<style scoped lang="scss">
.service-detail-page {
  padding-top: 70px;

  .service-hero {
    background: var(--bolent-gradient);
    padding: 80px 0 60px;
    color: white;

    .breadcrumb {
      margin-bottom: 30px;
      font-size: 14px;
      opacity: 0.9;

      a {
        color: white;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }

      span {
        margin: 0 10px;
      }
    }

    .service-title {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 20px;
      color: white;
    }

    .service-subtitle {
      font-size: 1.25rem;
      opacity: 0.95;
      max-width: 700px;
    }
  }

  .service-content {
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 60px;

      @media (max-width: 992px) {
        grid-template-columns: 1fr;
        gap: 40px;
      }
    }

    .content-main {
      h2 {
        font-size: 2rem;
        margin-bottom: 24px;
        color: var(--text-primary);
      }

      .service-overview {
        margin-bottom: 60px;

        p {
          font-size: 1.125rem;
          line-height: 1.8;
          color: var(--text-secondary);
        }
      }

      .service-features {
        margin-bottom: 60px;

        .features-list {
          display: grid;
          gap: 30px;
        }

        .feature-item {
          display: flex;
          gap: 20px;
          padding: 30px;
          background: white;
          border-radius: 12px;
          box-shadow: var(--bolent-shadow);
          transition: var(--bolent-transition);

          &:hover {
            transform: translateY(-5px);
            box-shadow: var(--bolent-shadow-lg);
          }

          .feature-icon {
            flex-shrink: 0;
            width: 40px;
            height: 40px;
            background: var(--bolent-gradient);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: bold;
          }

          .feature-content {
            flex: 1;

            h4 {
              font-size: 1.25rem;
              margin-bottom: 8px;
              color: var(--text-primary);
            }

            p {
              color: var(--text-secondary);
              line-height: 1.6;
            }
          }
        }
      }

      .service-benefits {
        .benefits-list {
          list-style: none;
          padding: 0;

          li {
            padding: 16px 0 16px 40px;
            position: relative;
            font-size: 1.125rem;
            line-height: 1.6;
            color: var(--text-secondary);
            border-bottom: 1px solid var(--bolent-border);

            &:last-child {
              border-bottom: none;
            }

            &::before {
              content: '✓';
              position: absolute;
              left: 0;
              top: 16px;
              width: 24px;
              height: 24px;
              background: var(--bolent-gradient);
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              font-weight: bold;
            }
          }
        }
      }
    }

    .content-sidebar {
      .sidebar-card {
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: var(--bolent-shadow);
        margin-bottom: 30px;

        h3 {
          font-size: 1.5rem;
          margin-bottom: 16px;
          color: var(--text-primary);
        }

        p {
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 20px;
        }
      }

      .contact-card {
        background: var(--bolent-gradient);
        color: white;

        h3 {
          color: white;
        }

        p {
          color: rgba(255, 255, 255, 0.9);
        }

        .btn {
          background: white;
          color: var(--primary-color);
          width: 100%;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          }
        }
      }

      .services-list {
        ul {
          list-style: none;
          padding: 0;

          li {
            border-bottom: 1px solid var(--bolent-border);

            &:last-child {
              border-bottom: none;
            }

            a {
              display: block;
              padding: 12px 0;
              color: var(--text-secondary);
              text-decoration: none;
              transition: var(--bolent-transition);

              &:hover {
                color: var(--primary-color);
                padding-left: 10px;
              }
            }
          }
        }
      }
    }
  }

  .cta-section {
    background: var(--bolent-gradient);
    padding: 80px 0;
    text-align: center;
    color: white;

    .cta-content {
      h3 {
        font-size: 2.5rem;
        margin-bottom: 16px;
        color: white;
      }

      p {
        font-size: 1.25rem;
        margin-bottom: 40px;
        opacity: 0.9;
      }

      .btn {
        background: white;
        color: var(--primary-color);

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
        }
      }
    }
  }
}
</style>
