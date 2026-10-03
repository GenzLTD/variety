<template>
  <div class="about-page">
    <!-- 页面标题 -->
    <section class="page-header">
      <div class="container">
        <h1 data-aos="fade-up">关于我们</h1>
        <nav class="breadcrumb" data-aos="fade-up" data-aos-delay="100">
          <router-link to="/">首页</router-link>
          <span>/</span>
          <span>关于我们</span>
        </nav>
      </div>
    </section>

    <!-- 公司简介 -->
    <section class="about-intro section">
      <div class="container">
        <div class="about-grid">
          <div class="about-image" data-aos="fade-right">
            <div class="about-image-placeholder" role="img" aria-label="关于我们" />
            <div class="services-list">
              <ul>
                <li><i>✓</i> IT 外包</li>
                <li><i>✓</i> 敏捷咨询</li>
                <li><i>✓</i> 自动化 & QA</li>
                <li><i>✓</i> 软件开发</li>
                <li><i>✓</i> 数字化 & 数据</li>
                <li><i>✓</i> IT 管理</li>
              </ul>
            </div>
          </div>
          <div class="about-content" data-aos="fade-left">
            <h3>我们的愿景</h3>
            <p>
              深伯乐在咨询、IT 服务和数字创新领域运营。我们的使命是通过将人放在项目的核心来重塑服务。
            </p>
            <p>
              深伯乐凭借其才华横溢和具有明显企业家精神的员工，激发集体智慧，
              旨在通过支持公司开发新服务和控制数字体验，成为公司转型和绩效的主要参与者。
            </p>

            <h3>我们的使命</h3>
            <p>
              自成立以来，我们一直在共同构建可持续的创新，以愿景和敬业的员工为指导。
              我们的使命基于成功的三大支柱：
            </p>
            <ul>
              <li>为员工提供重要的专业体验</li>
              <li>不断创新并在客户产品中创造卓越</li>
              <li>通过 CSR 政策发展积极影响经济</li>
            </ul>
          </div>
        </div>

        <div class="who-we-are" data-aos="fade-up">
          <h3>我们是谁</h3>
          <p>
            深伯乐是一家领先的中国公司，专注于信息技术解决方案领域，
            特别关注软件测试、数字化和数据以及新时代技术。
            作为该地区的主要提供商之一，我们结合各自领域的高度专业化专家提供服务。
            深伯乐在传统和敏捷环境中都提供结构化和专业的整体方法。
          </p>
          <p>
            我们专注于创建创新的软件解决方案。我们与客户在软件开发过程的每个阶段合作，
            从战略规划到分析、设计、开发和部署应用程序，再到维护和扩展。
          </p>
          <p>
            我们的优势在于在工作中合理实施现代软件技术和方法论、低内部成本、
            责任心以及对客户成功的承诺。我们始终认真倾听他们的需求，
            并努力使他们对我们的解决方案感到满意。
          </p>
        </div>
      </div>
    </section>

    <!-- 为什么选择我们 -->
    <section class="why-choose section" style="background: var(--bg-light);">
      <div class="container">
        <div class="section-title" data-aos="fade-up">
          <h3>为什么选择我们</h3>
        </div>
        
        <div class="why-grid">
          <div 
            v-for="(item, index) in whyChooseUs" 
            :key="index"
            class="why-card"
            data-aos="zoom-in"
            :data-aos-delay="index * 100"
          >
            <div class="why-icon">{{ item.icon }}</div>
            <h4>{{ item.title }}</h4>
            <p>{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 生态资质背书 -->
    <section class="certifications-section section">
      <div class="container">
        <div class="section-title" data-aos="fade-up">
          <h3>生态资质</h3>
          <p class="cert-lead">
            在 HarmonyOS / OpenHarmony 生态之外，深伯乐同时面向昇腾算力场景提供 ISV 级交付能力。
          </p>
        </div>
        <ul class="cert-list" data-aos="fade-up" data-aos-delay="80">
          <li v-for="item in company.certifications" :key="item">{{ item }}</li>
        </ul>
      </div>
    </section>

    <!-- 团队 CTA -->
    <section class="team-cta section">
      <div class="container">
        <div class="cta-content" data-aos="fade-up">
          <h3>加入我们的团队</h3>
          <p>我们正在寻找有才华的人才加入我们的团队</p>
          <router-link to="/careers" class="btn btn-primary btn-large">查看职位</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { companyInfo as company } from '@/config/company'

const whyChooseUs = ref([
  {
    icon: '🎯',
    title: '领域专业知识',
    description: '深厚的行业经验和技术专长，为您提供最专业的解决方案'
  },
  {
    icon: '✨',
    title: '卓越品质',
    description: '致力于提供高质量的产品和服务，超越客户期望'
  },
  {
    icon: '🔧',
    title: '技术创新',
    description: '采用最新技术和最佳实践，保持竞争优势'
  },
  {
    icon: '🤝',
    title: '客户至上',
    description: '以客户需求为核心，提供定制化的解决方案'
  },
  {
    icon: '⚡',
    title: '高效交付',
    description: '敏捷开发流程，确保项目按时高质量交付'
  },
  {
    icon: '💡',
    title: '持续支持',
    description: '提供全方位的售后支持和维护服务'
  }
])
</script>

<style scoped lang="scss">
.about-page {
  .page-header {
    background: var(--bolent-gradient);
    padding: 100px 0 60px;
    text-align: center;
    color: white;

    h1 {
      font-size: 3rem;
      margin-bottom: 20px;
      color: white;
    }

    .breadcrumb {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      font-size: 15px;
      opacity: 0.9;

      a {
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .about-intro {
    .about-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      margin-bottom: 60px;

      .about-image {
        position: relative;

        .about-image-placeholder {
          width: 100%;
          aspect-ratio: 3 / 2;
          border-radius: 12px;
          box-shadow: var(--bolent-shadow-lg);
          background: var(--bolent-gradient-soft);
        }

        .services-list {
          margin-top: 24px;
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: var(--bolent-shadow-md);

          ul {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;

            li {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;
              color: var(--text-dark);

              i {
                color: var(--primary-color);
                font-style: normal;
                font-weight: bold;
              }
            }
          }
        }
      }

      .about-content {
        h3 {
          color: var(--text-dark);
          margin-bottom: 16px;
          margin-top: 24px;

          &:first-child {
            margin-top: 0;
          }
        }

        p {
          color: var(--text-light);
          line-height: 1.8;
          margin-bottom: 16px;
        }

        ul {
          list-style: none;
          padding: 0;

          li {
            padding-left: 24px;
            position: relative;
            margin-bottom: 12px;
            color: var(--text-light);
            line-height: 1.6;

            &::before {
              content: '→';
              position: absolute;
              left: 0;
              color: var(--primary-color);
              font-weight: bold;
            }
          }
        }
      }
    }

    .who-we-are {
      background: var(--bg-light);
      padding: 60px 40px;
      border-radius: 12px;

      h3 {
        color: var(--text-dark);
        margin-bottom: 24px;
      }

      p {
        color: var(--text-light);
        line-height: 1.8;
        margin-bottom: 20px;
      }
    }
  }

  .why-choose {
    .why-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 32px;
      margin-top: 60px;

      .why-card {
        background: white;
        padding: 40px 32px;
        border-radius: 12px;
        text-align: center;
        transition: var(--bolent-transition);

        &:hover {
          transform: translateY(-8px);
          box-shadow: var(--bolent-shadow-lg);
        }

        .why-icon {
          font-size: 60px;
          margin-bottom: 24px;
        }

        h4 {
          color: var(--text-dark);
          margin-bottom: 16px;
        }

        p {
          color: var(--text-light);
          line-height: 1.6;
        }
      }
    }
  }

  .certifications-section {
    .section-title {
      text-align: center;
      margin-bottom: 32px;

      h3 {
        margin-bottom: 12px;
      }

      .cert-lead {
        max-width: 640px;
        margin: 0 auto;
        color: var(--bolent-text-secondary);
        line-height: 1.7;
      }
    }

    .cert-list {
      list-style: none;
      padding: 0;
      margin: 0 auto;
      max-width: 820px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;

      li {
        padding: 18px 22px;
        border: 1px solid var(--bolent-border);
        border-radius: var(--bolent-radius-md);
        background: var(--bolent-bg-soft);
        color: var(--bolent-ink);
        font-weight: 500;
      }
    }
  }

  .team-cta {
    background: var(--bolent-gradient);
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

/* 响应式 */
@media (max-width: 992px) {
  .about-page {
    .about-intro {
      .about-grid {
        grid-template-columns: 1fr;
        gap: 40px;
      }
    }
  }
}

@media (max-width: 768px) {
  .about-page {
    .page-header {
      padding: 80px 0 40px;

      h1 {
        font-size: 2rem;
      }
    }

    .why-choose {
      .why-grid {
        grid-template-columns: 1fr;
      }
    }

    .certifications-section .cert-list {
      grid-template-columns: 1fr;
    }

    .team-cta {
      .cta-content {
        h3 {
          font-size: 2rem;
        }
      }
    }
  }
}
</style>
