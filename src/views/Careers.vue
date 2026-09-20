<template>
  <div class="careers-page">
    <!-- Hero Section -->
    <section class="careers-hero">
      <div class="container">
        <h1 class="hero-title" data-aos="fade-up">加入我们</h1>
        <p class="hero-subtitle" data-aos="fade-up" data-aos-delay="100">
          与优秀的人一起，做有价值的事
        </p>
        <div class="hero-stats" data-aos="fade-up" data-aos-delay="200">
          <div class="stat-item">
            <div class="stat-value">200+</div>
            <div class="stat-label">团队成员</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">15+</div>
            <div class="stat-label">国家地区</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">98%</div>
            <div class="stat-label">员工满意度</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 为什么选择我们 -->
    <section class="why-join-section section">
      <div class="container">
        <div class="section-header">
          <h2 data-aos="fade-up">为什么选择 Bolent？</h2>
          <p data-aos="fade-up" data-aos-delay="100">我们提供的不仅是一份工作，更是一个成长的平台</p>
        </div>
        <div class="benefits-grid">
          <div 
            v-for="(benefit, index) in benefits" 
            :key="index"
            class="benefit-card"
            data-aos="fade-up"
            :data-aos-delay="index * 100"
          >
            <div class="benefit-icon">{{ benefit.icon }}</div>
            <h3>{{ benefit.title }}</h3>
            <p>{{ benefit.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 职位列表 -->
    <section class="jobs-section section">
      <div class="container">
        <div class="section-header">
          <h2 data-aos="fade-up">热招职位</h2>
          <p data-aos="fade-up" data-aos-delay="100">发现最适合你的机会</p>
        </div>

        <!-- 职位筛选 -->
        <div class="job-filters" data-aos="fade-up">
          <div class="filter-group">
            <label>部门：</label>
            <select v-model="selectedDepartment">
              <option value="all">全部部门</option>
              <option value="tech">技术研发</option>
              <option value="product">产品设计</option>
              <option value="sales">销售市场</option>
              <option value="operations">运营支持</option>
            </select>
          </div>
          <div class="filter-group">
            <label>地点：</label>
            <select v-model="selectedLocation">
              <option value="all">全部地点</option>
              <option value="beijing">北京</option>
              <option value="shanghai">上海</option>
              <option value="shenzhen">深圳</option>
              <option value="remote">远程</option>
            </select>
          </div>
          <div class="filter-group">
            <label>类型：</label>
            <select v-model="selectedType">
              <option value="all">全部类型</option>
              <option value="fulltime">全职</option>
              <option value="parttime">兼职</option>
              <option value="intern">实习</option>
            </select>
          </div>
        </div>

        <!-- 职位列表 -->
        <div class="jobs-list">
          <div 
            v-for="(job, index) in filteredJobs" 
            :key="job.id"
            class="job-card"
            data-aos="fade-up"
            :data-aos-delay="(index % 4) * 100"
          >
            <div class="job-header">
              <div>
                <h3 class="job-title">{{ job.title }}</h3>
                <div class="job-meta">
                  <span class="meta-item">
                    <span class="icon">📍</span>
                    {{ job.location }}
                  </span>
                  <span class="meta-item">
                    <span class="icon">💼</span>
                    {{ job.type }}
                  </span>
                  <span class="meta-item">
                    <span class="icon">💰</span>
                    {{ job.salary }}
                  </span>
                </div>
              </div>
              <span class="department-badge">{{ job.department }}</span>
            </div>
            <div class="job-description">
              <p>{{ job.description }}</p>
            </div>
            <div class="job-requirements">
              <h4>职位要求：</h4>
              <ul>
                <li v-for="(req, i) in job.requirements.slice(0, 3)" :key="i">
                  {{ req }}
                </li>
              </ul>
            </div>
            <div class="job-footer">
              <span class="job-date">发布于 {{ job.publishDate }}</span>
              <button class="btn btn-primary" @click="applyJob(job)">
                立即申请
              </button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredJobs.length === 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>暂无符合条件的职位</p>
          <button class="btn btn-outline" @click="resetFilters">重置筛选</button>
        </div>
      </div>
    </section>

    <!-- 招聘流程 -->
    <section class="process-section section" style="background: var(--bolent-bg-soft);">
      <div class="container">
        <div class="section-header">
          <h2 data-aos="fade-up">招聘流程</h2>
          <p data-aos="fade-up" data-aos-delay="100">简单高效的面试流程</p>
        </div>
        <div class="process-timeline">
          <div 
            v-for="(step, index) in processSteps" 
            :key="index"
            class="process-step"
            data-aos="fade-up"
            :data-aos-delay="index * 100"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-content">
              <h4>{{ step.title }}</h4>
              <p>{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content" data-aos="zoom-in">
          <h3>没有找到合适的职位？</h3>
          <p>发送你的简历到我们的人才库，我们会在有合适机会时联系你</p>
          <a href="mailto:hr@szbolent.com.cn" class="btn btn-primary btn-large">
            投递简历到人才库
          </a>
        </div>
      </div>
    </section>

    <!-- 申请弹窗 -->
    <div v-if="showApplyModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeModal">×</button>
        <h3>申请职位：{{ selectedJob?.title }}</h3>
        <form @submit.prevent="submitApplication" class="apply-form">
          <div class="form-group">
            <label>姓名 *</label>
            <input v-model="applicationForm.name" type="text" required />
          </div>
          <div class="form-group">
            <label>邮箱 *</label>
            <input v-model="applicationForm.email" type="email" required />
          </div>
          <div class="form-group">
            <label>手机 *</label>
            <input v-model="applicationForm.phone" type="tel" required />
          </div>
          <div class="form-group">
            <label>个人简介 *</label>
            <textarea v-model="applicationForm.intro" rows="4" required></textarea>
          </div>
          <div class="form-group">
            <label>简历附件</label>
            <input type="file" accept=".pdf,.doc,.docx" />
            <small>支持 PDF、Word 格式，不超过 5MB</small>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="closeModal">取消</button>
            <button type="submit" class="btn btn-primary">提交申请</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AOS from 'aos'
import { apiPost } from '@/api/looma'

// 福利亮点
const benefits = [
  {
    icon: '💰',
    title: '具有竞争力的薪酬',
    description: '行业领先的薪资水平，完善的绩效奖金和股权激励'
  },
  {
    icon: '🎯',
    title: '职业发展',
    description: '清晰的职业晋升路径，丰富的培训和学习机会'
  },
  {
    icon: '⏰',
    title: '弹性工作',
    description: '灵活的工作时间和地点，支持远程办公'
  },
  {
    icon: '🏥',
    title: '全面保障',
    description: '五险一金、商业保险、定期体检'
  },
  {
    icon: '🌴',
    title: '带薪假期',
    description: '充足的年假、病假，还有生日假、婚假等'
  },
  {
    icon: '🎉',
    title: '团队活动',
    description: '定期团建、节日福利、员工关怀'
  },
  {
    icon: '💻',
    title: '顶级设备',
    description: 'Mac/高配PC，双显示器，人体工学座椅'
  },
  {
    icon: '🚀',
    title: '创新文化',
    description: '扁平化管理，鼓励创新，快速试错'
  }
]

// 招聘流程
const processSteps = [
  {
    title: '在线申请',
    description: '提交简历和个人信息'
  },
  {
    title: '简历筛选',
    description: '1-3个工作日内反馈'
  },
  {
    title: '初试',
    description: '技术/业务初步面试'
  },
  {
    title: '复试',
    description: '深入技术/管理面试'
  },
  {
    title: 'Offer',
    description: '发放 Offer，入职准备'
  }
]

// 筛选条件
const selectedDepartment = ref('all')
const selectedLocation = ref('all')
const selectedType = ref('all')

// 职位数据
const jobs = ref([
  {
    id: 1,
    title: '高级前端工程师',
    department: '技术研发',
    departmentId: 'tech',
    location: '北京',
    locationId: 'beijing',
    type: '全职',
    typeId: 'fulltime',
    salary: '25K-40K',
    publishDate: '2024-01-20',
    description: '负责公司核心产品的前端开发，参与技术架构设计，优化用户体验。',
    requirements: [
      '3年以上前端开发经验，精通 Vue3/React',
      '熟悉 TypeScript、Webpack/Vite 等工具',
      '有大型项目架构经验，良好的编码习惯',
      '优秀的沟通能力和团队协作精神'
    ]
  },
  {
    id: 2,
    title: 'Node.js 后端工程师',
    department: '技术研发',
    departmentId: 'tech',
    location: '上海',
    locationId: 'shanghai',
    type: '全职',
    typeId: 'fulltime',
    salary: '30K-50K',
    publishDate: '2024-01-18',
    description: '负责后端服务开发和维护，设计和优化系统架构，保证服务高可用。',
    requirements: [
      '5年以上 Node.js 开发经验',
      '熟悉微服务架构、消息队列、缓存等',
      '有高并发系统开发经验',
      '熟悉 Docker、K8s 等容器技术'
    ]
  },
  {
    id: 3,
    title: '产品经理',
    department: '产品设计',
    departmentId: 'product',
    location: '深圳',
    locationId: 'shenzhen',
    type: '全职',
    typeId: 'fulltime',
    salary: '25K-45K',
    publishDate: '2024-01-15',
    description: '负责产品规划和设计，深入了解用户需求，推动产品迭代优化。',
    requirements: [
      '3年以上互联网产品经验',
      '优秀的需求分析和产品设计能力',
      '熟练使用 Axure、Figma 等工具',
      '有 B端/SaaS 产品经验优先'
    ]
  },
  {
    id: 4,
    title: 'UI/UX 设计师',
    department: '产品设计',
    departmentId: 'product',
    location: '北京',
    locationId: 'beijing',
    type: '全职',
    typeId: 'fulltime',
    salary: '20K-35K',
    publishDate: '2024-01-12',
    description: '负责产品界面设计，提升用户体验，建立和维护设计系统。',
    requirements: [
      '3年以上 UI/UX 设计经验',
      '精通 Figma、Sketch 等设计工具',
      '有完整的 B端/C端项目设计经验',
      '良好的审美和创新能力'
    ]
  },
  {
    id: 5,
    title: '销售经理',
    department: '销售市场',
    departmentId: 'sales',
    location: '上海',
    locationId: 'shanghai',
    type: '全职',
    typeId: 'fulltime',
    salary: '15K-30K + 提成',
    publishDate: '2024-01-10',
    description: '负责客户开发和维护，完成销售目标，建立良好的客户关系。',
    requirements: [
      '3年以上 IT/软件行业销售经验',
      '优秀的沟通和谈判能力',
      '有大客户销售经验优先',
      '自驱力强，目标导向'
    ]
  },
  {
    id: 6,
    title: '市场运营专员',
    department: '销售市场',
    departmentId: 'sales',
    location: '远程',
    locationId: 'remote',
    type: '全职',
    typeId: 'fulltime',
    salary: '12K-20K',
    publishDate: '2024-01-08',
    description: '负责品牌推广、内容运营、活动策划等市场工作。',
    requirements: [
      '2年以上市场运营经验',
      '熟悉新媒体运营和内容创作',
      '有活动策划和执行经验',
      '优秀的文案能力'
    ]
  },
  {
    id: 7,
    title: '测试工程师',
    department: '技术研发',
    departmentId: 'tech',
    location: '深圳',
    locationId: 'shenzhen',
    type: '全职',
    typeId: 'fulltime',
    salary: '18K-30K',
    publishDate: '2024-01-05',
    description: '负责产品测试工作，保证产品质量，参与自动化测试建设。',
    requirements: [
      '3年以上软件测试经验',
      '熟悉自动化测试框架和工具',
      '有性能测试、安全测试经验优先',
      '细心负责，质量意识强'
    ]
  },
  {
    id: 8,
    title: '前端开发实习生',
    department: '技术研发',
    departmentId: 'tech',
    location: '北京',
    locationId: 'beijing',
    type: '实习',
    typeId: 'intern',
    salary: '150-250/天',
    publishDate: '2024-01-03',
    description: '协助前端团队进行产品开发，学习前沿技术，快速成长。',
    requirements: [
      '计算机相关专业在读',
      '熟悉 HTML/CSS/JavaScript',
      '了解 Vue 或 React 框架',
      '每周至少工作3天，可实习3个月以上'
    ]
  }
])

// 筛选职位
const filteredJobs = computed(() => {
  return jobs.value.filter(job => {
    const departmentMatch = selectedDepartment.value === 'all' || job.departmentId === selectedDepartment.value
    const locationMatch = selectedLocation.value === 'all' || job.locationId === selectedLocation.value
    const typeMatch = selectedType.value === 'all' || job.typeId === selectedType.value
    return departmentMatch && locationMatch && typeMatch
  })
})

// 重置筛选
const resetFilters = () => {
  selectedDepartment.value = 'all'
  selectedLocation.value = 'all'
  selectedType.value = 'all'
}

// 申请职位
const showApplyModal = ref(false)
const selectedJob = ref<{ title: string } | null>(null)
const applicationForm = ref({
  name: '',
  email: '',
  phone: '',
  intro: ''
})

const applyJob = (job: any) => {
  selectedJob.value = job
  showApplyModal.value = true
}

const closeModal = () => {
  showApplyModal.value = false
  selectedJob.value = null
  applicationForm.value = {
    name: '',
    email: '',
    phone: '',
    intro: ''
  }
}

const submitApplication = async () => {
  try {
    await apiPost('/careers/apply', {
      job: selectedJob.value?.title,
      ...applicationForm.value,
    })
    alert('申请提交成功！我们会尽快与您联系。')
    closeModal()
  } catch (err) {
    console.error('申请提交失败:', err)
    alert('提交失败，请稍后重试或直接发送简历至 hr@szbolent.com.cn')
  }
}

onMounted(() => {
  AOS.refresh()
})
</script>

<style scoped lang="scss">
.careers-page {
  .careers-hero {
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
      margin-bottom: 50px;
    }

    .hero-stats {
      display: flex;
      justify-content: center;
      gap: 80px;

      .stat-item {
        .stat-value {
          font-size: 42px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 16px;
          opacity: 0.9;
        }
      }
    }
  }

  .section-header {
    text-align: center;
    margin-bottom: 50px;

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

  .why-join-section {
    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
    }

    .benefit-card {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: var(--bolent-shadow);
      transition: var(--bolent-transition);

      &:hover {
        transform: translateY(-5px);
        box-shadow: var(--bolent-shadow-md);
      }

      .benefit-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      h3 {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 12px;
      }

      p {
        color: var(--bolent-text-secondary);
        line-height: 1.6;
      }
    }
  }

  .jobs-section {
    .job-filters {
      display: flex;
      gap: 20px;
      margin-bottom: 40px;
      flex-wrap: wrap;
      justify-content: center;

      .filter-group {
        display: flex;
        align-items: center;
        gap: 10px;

        label {
          font-weight: 500;
          color: var(--bolent-text);
        }

        select {
          padding: 8px 16px;
          border: 2px solid var(--bolent-border);
          border-radius: 6px;
          font-size: 15px;
          cursor: pointer;
          transition: border-color 0.3s ease;

          &:focus {
            outline: none;
            border-color: var(--bolent-primary);
          }
        }
      }
    }

    .jobs-list {
      display: grid;
      gap: 24px;
      margin-bottom: 40px;
    }

    .job-card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: var(--bolent-shadow);
      transition: var(--bolent-transition);

      &:hover {
        transform: translateY(-3px);
        box-shadow: var(--bolent-shadow-md);
      }

      .job-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;

        .job-title {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 12px;
          color: var(--bolent-ink);
        }

        .job-meta {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--bolent-text-secondary);
            font-size: 14px;

            .icon {
              font-size: 16px;
            }
          }
        }

        .department-badge {
          padding: 6px 16px;
          background: var(--bolent-primary-50);
          color: var(--bolent-primary);
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
        }
      }

      .job-description {
        color: var(--bolent-text-secondary);
        line-height: 1.6;
        margin-bottom: 16px;
      }

      .job-requirements {
        margin-bottom: 20px;

        h4 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          color: var(--bolent-text);
        }

        ul {
          list-style: none;
          padding: 0;

          li {
            padding-left: 24px;
            position: relative;
            color: var(--bolent-text-secondary);
            line-height: 1.8;

            &::before {
              content: '•';
              position: absolute;
              left: 8px;
              color: var(--bolent-primary);
              font-weight: bold;
            }
          }
        }
      }

      .job-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 20px;
        border-top: 1px solid #f0f0f0;

        .job-date {
          color: var(--bolent-text-muted);
          font-size: 14px;
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: var(--bolent-text-muted);

      .empty-icon {
        font-size: 64px;
        margin-bottom: 20px;
      }

      p {
        font-size: 18px;
        margin-bottom: 24px;
      }
    }
  }

  .process-section {
    .process-timeline {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      gap: 40px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .process-step {
      flex: 1;
      min-width: 150px;
      text-align: center;
      position: relative;

      .step-number {
        width: 60px;
        height: 60px;
        background: var(--bolent-gradient);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: 700;
        margin: 0 auto 20px;
        box-shadow: 0 4px 12px rgba(14, 110, 106, 0.3);
      }

      .step-content {
        h4 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--bolent-text);
        }

        p {
          color: var(--bolent-text-secondary);
          font-size: 14px;
        }
      }
    }
  }

  .cta-section {
    background: var(--bolent-gradient);
    color: white;
    padding: 80px 0;

    .cta-content {
      text-align: center;

      h3 {
        font-size: 36px;
        font-weight: 700;
        margin-bottom: 16px;
      }

      p {
        font-size: 18px;
        margin-bottom: 32px;
        opacity: 0.95;
      }

      .btn-large {
        padding: 16px 48px;
        font-size: 18px;
        background: white;
        color: var(--bolent-primary);
        border: none;
        text-decoration: none;

        &:hover {
          background: var(--bolent-border-light);
          transform: translateY(-3px);
        }
      }
    }
  }

  // 申请弹窗
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    padding: 40px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;

    .modal-close {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border: none;
      background: var(--bolent-bg-soft);
      border-radius: 50%;
      font-size: 24px;
      cursor: pointer;
      transition: var(--bolent-transition);

      &:hover {
        background: var(--bolent-border);
        transform: rotate(90deg);
      }
    }

    h3 {
      font-size: 24px;
      margin-bottom: 30px;
      color: var(--bolent-ink);
    }

    .apply-form {
      .form-group {
        margin-bottom: 20px;

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--bolent-text);
        }

        input,
        textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid var(--bolent-border);
          border-radius: 8px;
          font-size: 15px;
          transition: border-color 0.3s ease;

          &:focus {
            outline: none;
            border-color: var(--bolent-primary);
          }
        }

        textarea {
          resize: vertical;
        }

        small {
          display: block;
          margin-top: 6px;
          color: var(--bolent-text-muted);
          font-size: 13px;
        }
      }

      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 30px;
      }
    }
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .careers-page {
    .careers-hero {
      padding: 60px 0 40px;

      .hero-title {
        font-size: 32px;
      }

      .hero-subtitle {
        font-size: 16px;
      }

      .hero-stats {
        gap: 40px;

        .stat-value {
          font-size: 32px;
        }
      }
    }

    .section-header {
      h2 {
        font-size: 28px;
      }
    }

    .why-join-section {
      .benefits-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
    }

    .jobs-section {
      .job-filters {
        flex-direction: column;
        align-items: stretch;

        .filter-group {
          flex-direction: column;
          align-items: stretch;

          select {
            width: 100%;
          }
        }
      }

      .job-card {
        padding: 20px;

        .job-header {
          flex-direction: column;
          gap: 16px;

          .department-badge {
            align-self: flex-start;
          }
        }

        .job-meta {
          flex-direction: column;
          gap: 8px;
        }
      }
    }

    .process-section {
      .process-timeline {
        flex-direction: column;
        gap: 30px;
      }
    }

    .cta-section {
      padding: 50px 0;

      .cta-content {
        h3 {
          font-size: 24px;
        }

        p {
          font-size: 16px;
        }
      }
    }

    .modal-content {
      padding: 30px 20px;

      h3 {
        font-size: 20px;
        margin-bottom: 20px;
      }
    }
  }
}
</style>
