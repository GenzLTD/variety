<template>
  <div class="services-page">
    <!-- Hero Section -->
    <section class="services-hero">
      <div class="container">
        <h1 class="hero-title" data-aos="fade-up">我们的服务</h1>
        <p class="hero-subtitle" data-aos="fade-up" data-aos-delay="100">
          专业的 IT 解决方案，助力企业数字化转型
        </p>
      </div>
    </section>

    <!-- 服务总览 -->
    <section class="services-overview section">
      <div class="container">
        <div class="overview-grid">
          <div 
            v-for="(service, index) in services" 
            :key="service.id"
            class="service-card"
            data-aos="fade-up"
            :data-aos-delay="index * 100"
          >
            <div class="service-icon">{{ service.icon }}</div>
            <h3 class="service-title">{{ service.title }}</h3>
            <p class="service-description">{{ service.description }}</p>
            <ul class="service-features">
              <li v-for="feature in service.features" :key="feature">
                <span class="check-icon">✓</span>
                {{ feature }}
              </li>
            </ul>
            <router-link :to="`/services/${service.slug}`" class="service-link">
              了解详情 →
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- 服务流程 -->
    <section class="process-section section" style="background: var(--bolent-bg-soft);">
      <div class="container">
        <div class="section-header">
          <h2 data-aos="fade-up">我们的服务流程</h2>
          <p data-aos="fade-up" data-aos-delay="100">标准化流程，保证项目高质量交付</p>
        </div>
        <div class="process-grid">
          <div 
            v-for="(step, index) in processSteps" 
            :key="index"
            class="process-card"
            data-aos="fade-up"
            :data-aos-delay="index * 100"
          >
            <div class="process-number">0{{ index + 1 }}</div>
            <div class="process-icon">{{ step.icon }}</div>
            <h4>{{ step.title }}</h4>
            <p>{{ step.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 技术栈 -->
    <section class="tech-stack-section section">
      <div class="container">
        <div class="section-header">
          <h2 data-aos="fade-up">技术栈</h2>
          <p data-aos="fade-up" data-aos-delay="100">我们精通的技术和工具</p>
        </div>
        <div class="tech-categories">
          <div 
            v-for="(category, index) in techStack" 
            :key="index"
            class="tech-category"
            data-aos="fade-up"
            :data-aos-delay="index * 100"
          >
            <h3>{{ category.name }}</h3>
            <div class="tech-items">
              <span 
                v-for="tech in category.items" 
                :key="tech"
                class="tech-item"
              >
                {{ tech }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 为什么选择我们 -->
    <section class="why-choose-section section" style="background: var(--bolent-bg-soft);">
      <div class="container">
        <div class="section-header">
          <h2 data-aos="fade-up">为什么选择 深伯乐？</h2>
          <p data-aos="fade-up" data-aos-delay="100">我们的核心优势</p>
        </div>
        <div class="advantages-grid">
          <div 
            v-for="(advantage, index) in advantages" 
            :key="index"
            class="advantage-card"
            data-aos="fade-up"
            :data-aos-delay="index * 100"
          >
            <div class="advantage-icon">{{ advantage.icon }}</div>
            <h4>{{ advantage.title }}</h4>
            <p>{{ advantage.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 客户案例预览 -->
    <section class="cases-preview-section section">
      <div class="container">
        <div class="section-header">
          <h2 data-aos="fade-up">成功案例</h2>
          <p data-aos="fade-up" data-aos-delay="100">看看我们为客户创造的价值</p>
        </div>
        <div class="cases-preview-grid">
          <div 
            v-for="(caseItem, index) in featuredCases" 
            :key="index"
            class="case-preview-card"
            data-aos="fade-up"
            :data-aos-delay="index * 100"
          >
            <div class="case-image">
              <img :src="caseItem.image" :alt="caseItem.title" />
            </div>
            <div class="case-info">
              <span class="case-tag">{{ caseItem.industry }}</span>
              <h4>{{ caseItem.title }}</h4>
              <p>{{ caseItem.result }}</p>
            </div>
          </div>
        </div>
        <div class="view-all-cases" data-aos="fade-up">
          <router-link to="/case-study" class="btn btn-outline">
            查看所有案例
          </router-link>
        </div>
      </div>
    </section>

    <!-- 客户评价 -->
    <section class="testimonials-section section" style="background: var(--bolent-gradient); color: white;">
      <div class="container">
        <div class="section-header">
          <h2 data-aos="fade-up" style="color: white;">客户评价</h2>
          <p data-aos="fade-up" data-aos-delay="100" style="color: rgba(255,255,255,0.9);">
            听听客户怎么说
          </p>
        </div>
        <div class="testimonials-grid">
          <div 
            v-for="(testimonial, index) in testimonials" 
            :key="index"
            class="testimonial-card"
            data-aos="fade-up"
            :data-aos-delay="index * 100"
          >
            <div class="quote-icon">"</div>
            <p class="testimonial-content">{{ testimonial.content }}</p>
            <div class="testimonial-author">
              <div class="author-info">
                <div class="author-name">{{ testimonial.author }}</div>
                <div class="author-role">{{ testimonial.role }}</div>
              </div>
              <div class="rating">⭐⭐⭐⭐⭐</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section section">
      <div class="container">
        <div class="cta-content" data-aos="zoom-in">
          <h3>准备开始您的项目？</h3>
          <p>联系我们，获取免费咨询和项目评估</p>
          <div class="cta-buttons">
            <router-link to="/contact" class="btn btn-primary btn-large">
              联系我们
            </router-link>
            <a href="mailto:hello@szbolent.com.cn" class="btn btn-outline btn-large">
              发送邮件
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AOS from 'aos'

// 服务列表
const services = [
  {
    id: 1,
    slug: 'outsourcing',
    icon: '👨‍💻',
    title: 'IT 外包服务',
    description: '专业的技术团队，为您提供高质量的IT资源外包服务',
    features: ['灵活的资源配置', '经验丰富的团队', '成本可控', '质量保证']
  },
  {
    id: 2,
    slug: 'agile',
    icon: '🚀',
    title: '敏捷咨询服务',
    description: '帮助企业实现敏捷转型，提升团队协作效率',
    features: ['敏捷转型规划', 'Scrum/Kanban 实施', '团队培训', '持续改进']
  },
  {
    id: 3,
    slug: 'automation',
    icon: '🤖',
    title: '自动化测试 & QA',
    description: '全面的质量保证和自动化测试解决方案',
    features: ['自动化测试框架', '全面的测试服务', '测试策略制定', '质量度量']
  },
  {
    id: 4,
    slug: 'development',
    icon: '💻',
    title: '定制软件开发',
    description: '量身定制的软件解决方案，满足您的独特需求',
    features: ['全栈开发能力', '敏捷开发流程', '现代化技术栈', '完整的项目支持']
  },
  {
    id: 5,
    slug: 'digital',
    icon: '📊',
    title: '数字化转型 & 数据分析',
    description: '助力企业数字化转型，释放数据价值',
    features: ['数字化转型咨询', '数据平台建设', '商业智能(BI)', '大数据分析']
  },
  {
    id: 6,
    slug: 'it-management',
    icon: '📋',
    title: 'IT 项目管理',
    description: '专业的IT项目管理服务，确保项目成功交付',
    features: ['项目规划与执行', '风险管理', '质量管理', '沟通协调']
  }
]

// 服务流程
const processSteps = [
  {
    icon: '📞',
    title: '需求沟通',
    description: '深入了解您的业务需求和项目目标'
  },
  {
    icon: '📝',
    title: '方案设计',
    description: '制定详细的项目方案和技术架构'
  },
  {
    icon: '⚙️',
    title: '开发实施',
    description: '敏捷开发，快速迭代，及时反馈'
  },
  {
    icon: '🧪',
    title: '测试验收',
    description: '严格的质量把控，确保交付质量'
  },
  {
    icon: '🚀',
    title: '上线部署',
    description: '平滑上线，提供完善的部署支持'
  },
  {
    icon: '🔧',
    title: '运维支持',
    description: '持续的技术支持和系统维护'
  }
]

// 技术栈
const techStack = [
  {
    name: '前端技术',
    items: ['Vue.js', 'React', 'Angular', 'TypeScript', 'Next.js', 'Nuxt.js', 'Vite', 'Webpack']
  },
  {
    name: '后端技术',
    items: ['Node.js', 'Python', 'Java', 'Go', 'Express', 'FastAPI', 'Spring Boot', 'Django']
  },
  {
    name: '移动端',
    items: ['React Native', 'Flutter', 'UniApp', 'iOS', 'Android', 'WeChat Mini Program']
  },
  {
    name: '数据库',
    items: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'ClickHouse']
  },
  {
    name: '云服务',
    items: ['AWS', 'Azure', 'Alibaba Cloud', 'Tencent Cloud', 'Docker', 'Kubernetes']
  },
  {
    name: '工具链',
    items: ['Git', 'GitLab CI/CD', 'Jenkins', 'Jira', 'Figma', 'Postman']
  }
]

// 核心优势
const advantages = [
  {
    icon: '🏆',
    title: '专业团队',
    description: '拥有10年以上行业经验的技术团队，精通各类技术栈和业务场景'
  },
  {
    icon: '⚡',
    title: '快速响应',
    description: '敏捷开发流程，快速响应需求变化，缩短项目周期'
  },
  {
    icon: '💎',
    title: '质量保证',
    description: '完善的质量管理体系，确保交付高质量的产品和服务'
  },
  {
    icon: '💰',
    title: '成本优化',
    description: '灵活的合作模式，帮助企业有效控制成本，提高ROI'
  },
  {
    icon: '🤝',
    title: '长期合作',
    description: '不仅是项目交付，更是长期的技术合作伙伴'
  },
  {
    icon: '🌐',
    title: '全球视野',
    description: '国际化团队，了解全球最新技术趋势和最佳实践'
  }
]

// 精选案例
const featuredCases = [
  {
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=300&fit=crop',
    industry: '金融科技',
    title: '某支付平台核心系统重构',
    result: '并发处理能力提升300%'
  },
  {
    image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=400&h=300&fit=crop',
    industry: '电商零售',
    title: '全渠道电商平台建设',
    result: '用户增长150%'
  },
  {
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop',
    industry: '医疗健康',
    title: '智能预约挂号系统',
    result: '预约效率提升200%'
  }
]

// 客户评价
const testimonials = [
  {
    content: '深伯乐团队非常专业，从需求分析到项目交付，每个环节都做得很到位。他们的敏捷开发流程让我们的产品能够快速上线，并且根据市场反馈及时调整。',
    author: '张总',
    role: '某互联网公司 CTO'
  },
  {
    content: '我们与深伯乐合作了多个项目，他们的技术实力和服务态度都让人印象深刻。特别是在项目管理方面，能够有效控制进度和质量，是值得信赖的合作伙伴。',
    author: '李经理',
    role: '某金融科技公司 项目总监'
  },
  {
    content: '选择深伯乐是我们做出的正确决定。他们不仅帮助我们完成了系统重构，还提供了很多有价值的技术建议，帮助我们的团队提升了技术能力。',
    author: '王女士',
    role: '某电商平台 技术负责人'
  }
]

onMounted(() => {
  AOS.refresh()
})
</script>

<style scoped lang="scss">
.services-page {
  .services-hero {
    background: var(--bolent-gradient);
    color: white;
    padding: 100px 0 80px;
    text-align: center;

    .hero-title {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .hero-subtitle {
      font-size: 20px;
      opacity: 0.95;
    }
  }

  .section-header {
    text-align: center;
    margin-bottom: 60px;

    h2 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    p {
      font-size: 18px;
      color: var(--bolent-text-secondary);
    }
  }

  .services-overview {
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 30px;
    }

    .service-card {
      background: white;
      border-radius: 16px;
      padding: 40px 30px;
      box-shadow: var(--bolent-shadow);
      transition: var(--bolent-transition);

      &:hover {
        transform: translateY(-8px);
        box-shadow: var(--bolent-shadow-lg);
      }

      .service-icon {
        font-size: 56px;
        margin-bottom: 20px;
      }

      .service-title {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 16px;
        color: var(--bolent-ink);
      }

      .service-description {
        color: var(--bolent-text-secondary);
        line-height: 1.6;
        margin-bottom: 24px;
      }

      .service-features {
        list-style: none;
        padding: 0;
        margin-bottom: 24px;

        li {
          padding: 8px 0;
          color: var(--bolent-text);
          display: flex;
          align-items: center;
          gap: 10px;

          .check-icon {
            color: #52c41a;
            font-weight: bold;
            font-size: 18px;
          }
        }
      }

      .service-link {
        display: inline-block;
        color: var(--bolent-primary);
        font-weight: 600;
        text-decoration: none;
        transition: var(--bolent-transition);

        &:hover {
          color: var(--bolent-primary-dark);
          transform: translateX(4px);
        }
      }
    }
  }

  .process-section {
    .process-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
    }

    .process-card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      box-shadow: var(--bolent-shadow-sm);
      position: relative;
      transition: var(--bolent-transition);

      &:hover {
        transform: translateY(-5px);
        box-shadow: var(--bolent-shadow-md);
      }

      .process-number {
        position: absolute;
        top: -15px;
        right: 20px;
        font-size: 48px;
        font-weight: 700;
        color: #f0f0f0;
      }

      .process-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      h4 {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 12px;
        color: var(--bolent-text);
      }

      p {
        color: var(--bolent-text-secondary);
        line-height: 1.6;
      }
    }
  }

  .tech-stack-section {
    .tech-categories {
      display: grid;
      gap: 40px;
    }

    .tech-category {
      h3 {
        font-size: 22px;
        font-weight: 600;
        margin-bottom: 20px;
        color: var(--bolent-text);
        padding-bottom: 12px;
        border-bottom: 3px solid var(--bolent-primary);
        display: inline-block;
      }

      .tech-items {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .tech-item {
        padding: 10px 20px;
        background: var(--bolent-bg-soft);
        border-radius: 20px;
        font-size: 14px;
        color: var(--bolent-text);
        transition: var(--bolent-transition);

        &:hover {
          background: var(--bolent-primary);
          color: white;
          transform: translateY(-2px);
        }
      }
    }
  }

  .why-choose-section {
    .advantages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
    }

    .advantage-card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: var(--bolent-shadow-sm);
      transition: var(--bolent-transition);

      &:hover {
        transform: translateY(-5px);
        box-shadow: var(--bolent-shadow-md);
      }

      .advantage-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      h4 {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 12px;
        color: var(--bolent-text);
      }

      p {
        color: var(--bolent-text-secondary);
        line-height: 1.6;
      }
    }
  }

  .cases-preview-section {
    .cases-preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }

    .case-preview-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--bolent-shadow);
      transition: var(--bolent-transition);

      &:hover {
        transform: translateY(-5px);
        box-shadow: var(--bolent-shadow-md);
      }

      .case-image {
        height: 200px;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
      }

      &:hover .case-image img {
        transform: scale(1.1);
      }

      .case-info {
        padding: 24px;

        .case-tag {
          display: inline-block;
          padding: 4px 12px;
          background: var(--bolent-primary-50);
          color: var(--bolent-primary);
          border-radius: 12px;
          font-size: 13px;
          margin-bottom: 12px;
        }

        h4 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--bolent-text);
        }

        p {
          color: var(--bolent-primary);
          font-weight: 500;
        }
      }
    }

    .view-all-cases {
      text-align: center;
    }
  }

  .testimonials-section {
    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 30px;
    }

    .testimonial-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 30px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);

      .quote-icon {
        font-size: 48px;
        color: rgba(255, 255, 255, 0.3);
        line-height: 1;
        margin-bottom: 16px;
      }

      .testimonial-content {
        font-size: 16px;
        line-height: 1.8;
        margin-bottom: 24px;
        color: rgba(255, 255, 255, 0.95);
      }

      .testimonial-author {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);

        .author-name {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .author-role {
          font-size: 14px;
          opacity: 0.8;
        }

        .rating {
          font-size: 16px;
        }
      }
    }
  }

  .cta-section {
    .cta-content {
      text-align: center;

      h3 {
        font-size: 36px;
        font-weight: 700;
        margin-bottom: 16px;
      }

      p {
        font-size: 18px;
        color: var(--bolent-text-secondary);
        margin-bottom: 32px;
      }

      .cta-buttons {
        display: flex;
        gap: 16px;
        justify-content: center;
        flex-wrap: wrap;

        .btn-large {
          padding: 16px 48px;
          font-size: 18px;
        }
      }
    }
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .services-page {
    .services-hero {
      padding: 60px 0 40px;

      .hero-title {
        font-size: 32px;
      }

      .hero-subtitle {
        font-size: 16px;
      }
    }

    .section-header {
      margin-bottom: 40px;

      h2 {
        font-size: 28px;
      }
    }

    .services-overview {
      .overview-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
    }

    .process-section {
      .process-grid {
        grid-template-columns: 1fr;
      }
    }

    .tech-stack-section {
      .tech-category {
        h3 {
          font-size: 20px;
        }
      }
    }

    .why-choose-section {
      .advantages-grid {
        grid-template-columns: 1fr;
      }
    }

    .cases-preview-section {
      .cases-preview-grid {
        grid-template-columns: 1fr;
      }
    }

    .testimonials-section {
      .testimonials-grid {
        grid-template-columns: 1fr;
      }
    }

    .cta-section {
      .cta-content {
        h3 {
          font-size: 24px;
        }

        .cta-buttons {
          flex-direction: column;

          .btn-large {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
