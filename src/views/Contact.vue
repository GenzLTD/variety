<template>
  <div class="contact-page">
    <!-- Hero Section -->
    <section class="page-hero">
      <div class="container">
        <h1 data-aos="fade-up">联系我们</h1>
        <p data-aos="fade-up" data-aos-delay="100">
          我们期待与您合作，共创美好未来
        </p>
      </div>
    </section>

    <!-- 联系方式和表单 -->
    <section class="contact-section section">
      <div class="container">
        <div class="contact-grid">
          <!-- 左侧：联系信息 -->
          <div class="contact-info" data-aos="fade-right">
            <h2>与我们取得联系</h2>
            <p class="info-description">
              无论您有任何问题或需求，我们都随时准备为您提供帮助。
            </p>

            <div class="info-list">
              <div class="info-item">
                <div class="info-icon">📍</div>
                <div class="info-content">
                  <h4>公司地址</h4>
                  <p>中国 深圳市 南山区<br>科技园南区</p>
                </div>
              </div>

              <div class="info-item">
                <div class="info-icon">&#x1F4E7;</div>
                <div class="info-content">
                  <h4>电子邮箱</h4>
                  <p>hello@szbolent.com<br>support@szbolent.com</p>
                </div>
              </div>

              <div class="info-item">
                <div class="info-icon">&#x1F4AC;</div>
                <div class="info-content">
                  <h4>社交媒体</h4>
                  <div class="social-links">
                    <a href="#" target="_blank">微信</a>
                    <a href="#" target="_blank">微博</a>
                    <a href="#" target="_blank">LinkedIn</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：联系表单 -->
          <div class="contact-form-wrapper" data-aos="fade-left">
            <form @submit.prevent="handleSubmit" class="contact-form">
              <h3>发送消息</h3>
              
              <div class="form-group">
                <label for="name">姓名 *</label>
                <input 
                  type="text" 
                  id="name" 
                  v-model="formData.name"
                  :class="{ error: errors.name }"
                  placeholder="请输入您的姓名"
                  required
                />
                <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
              </div>

              <div class="form-group">
                <label for="email">邮箱 *</label>
                <input 
                  type="email" 
                  id="email" 
                  v-model="formData.email"
                  :class="{ error: errors.email }"
                  placeholder="your@email.com"
                  required
                />
                <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
              </div>

              <div class="form-group">
                <label for="phone">电话</label>
                <input 
                  type="tel" 
                  id="phone" 
                  v-model="formData.phone"
                  placeholder="请输入您的电话"
                />
              </div>

              <div class="form-group">
                <label for="company">公司名称</label>
                <input 
                  type="text" 
                  id="company" 
                  v-model="formData.company"
                  placeholder="请输入您的公司名称"
                />
              </div>

              <div class="form-group">
                <label for="service">感兴趣的服务</label>
                <select id="service" v-model="formData.service">
                  <option value="">请选择服务</option>
                  <option value="outsourcing">IT 外包服务</option>
                  <option value="agile">敏捷咨询服务</option>
                  <option value="automation">自动化测试 & QA</option>
                  <option value="development">定制软件开发</option>
                  <option value="digital">数字化转型 & 数据分析</option>
                  <option value="it-management">IT 项目管理</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div class="form-group">
                <label for="message">留言 *</label>
                <textarea 
                  id="message" 
                  v-model="formData.message"
                  :class="{ error: errors.message }"
                  rows="5"
                  placeholder="请告诉我们您的需求..."
                  required
                ></textarea>
                <span v-if="errors.message" class="error-message">{{ errors.message }}</span>
              </div>

              <button 
                type="submit" 
                class="btn btn-primary btn-block"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? '发送中...' : '发送消息' }}
              </button>

              <p v-if="submitSuccess" class="success-message">
                ✓ 感谢您的留言！我们会尽快与您联系。
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- 地图区域 (可选) -->
    <section class="map-section">
      <div class="map-placeholder">
        <div class="map-overlay">
          <div class="map-info">
            <h3>📍 深伯乐深圳总部</h3>
            <p>深圳市南山区科技园南区</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { apiPost } from '@/api/looma'

const formData = reactive({
  name: '',
  email: '',
  phone: '',
  company: '',
  service: '',
  message: ''
})

const errors = reactive({
  name: '',
  email: '',
  message: ''
})

const isSubmitting = ref(false)
const submitSuccess = ref(false)

const validateForm = () => {
  let isValid = true

  errors.name = ''
  errors.email = ''
  errors.message = ''

  if (!formData.name.trim()) {
    errors.name = '请输入您的姓名'
    isValid = false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!formData.email.trim()) {
    errors.email = '请输入您的邮箱'
    isValid = false
  } else if (!emailRegex.test(formData.email)) {
    errors.email = '请输入有效的邮箱地址'
    isValid = false
  }

  if (!formData.message.trim()) {
    errors.message = '请输入您的留言'
    isValid = false
  } else if (formData.message.trim().length < 10) {
    errors.message = '留言至少需要10个字符'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  submitSuccess.value = false

  try {
    await apiPost('/contact/submit', {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      service: formData.service,
      message: formData.message,
    })

    submitSuccess.value = true

    formData.name = ''
    formData.email = ''
    formData.phone = ''
    formData.company = ''
    formData.service = ''
    formData.message = ''
  } catch (err) {
    console.error('表单提交失败:', err)
    errors.message = '提交失败，请稍后重试或直接发送邮件至 hello@szbolent.com'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped lang="scss">
.contact-page {
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

  .contact-section {
    .contact-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 80px;
      align-items: start;

      @media (max-width: 992px) {
        grid-template-columns: 1fr;
        gap: 60px;
      }
    }

    .contact-info {
      h2 {
        font-size: 2.5rem;
        margin-bottom: 20px;
        color: var(--text-primary);
      }

      .info-description {
        font-size: 1.125rem;
        color: var(--text-secondary);
        margin-bottom: 40px;
        line-height: 1.6;
      }

      .info-list {
        display: grid;
        gap: 30px;
      }

      .info-item {
        display: flex;
        gap: 20px;

        .info-icon {
          flex-shrink: 0;
          width: 50px;
          height: 50px;
          background: var(--bolent-gradient);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .info-content {
          h4 {
            font-size: 1.25rem;
            margin-bottom: 8px;
            color: var(--text-primary);
          }

          p {
            color: var(--text-secondary);
            line-height: 1.6;
          }

          .social-links {
            display: flex;
            gap: 15px;

            a {
              color: var(--primary-color);
              text-decoration: none;
              font-weight: 500;

              &:hover {
                text-decoration: underline;
              }
            }
          }
        }
      }
    }

    .contact-form-wrapper {
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: var(--bolent-shadow-md);

      h3 {
        font-size: 2rem;
        margin-bottom: 30px;
        color: var(--text-primary);
      }

      .form-group {
        margin-bottom: 24px;

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--text-primary);
        }

        input,
        select,
        textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid var(--bolent-border);
          border-radius: 8px;
          font-size: 1rem;
          transition: var(--bolent-transition);
          font-family: inherit;

          &:focus {
            outline: none;
            border-color: var(--primary-color);
          }

          &.error {
            border-color: #ff4d4f;
          }

          &::placeholder {
            color: var(--bolent-text-muted);
          }
        }

        textarea {
          resize: vertical;
          min-height: 120px;
        }

        .error-message {
          display: block;
          margin-top: 6px;
          color: #ff4d4f;
          font-size: 0.875rem;
        }
      }

      .btn {
        margin-top: 10px;

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .success-message {
        margin-top: 20px;
        padding: 16px;
        background: #f6ffed;
        border: 1px solid #b7eb8f;
        border-radius: 8px;
        color: #52c41a;
        text-align: center;
        font-weight: 500;
      }
    }
  }

  .map-section {
    .map-placeholder {
      height: 400px;
      background: var(--bolent-gradient);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;

      .map-overlay {
        text-align: center;
        color: white;

        .map-info {
          h3 {
            font-size: 2rem;
            margin-bottom: 10px;
            color: white;
          }

          p {
            font-size: 1.125rem;
            opacity: 0.9;
          }
        }
      }
    }
  }
}
</style>
