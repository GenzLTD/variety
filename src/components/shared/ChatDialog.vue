<script setup lang="ts">
/**
 * ChatDialog — 诗词 AI 对话组件
 *
 * 状态机：COLLAPSED → LOGIN（未认证）→ CONSENT（未授权）→ CHAT
 *
 * 使用：
 *   <ChatDialog />
 *   无需 props，自主管理认证/授权/会话生命周期。
 */
import { ref, computed, nextTick, watch } from 'vue'
import { MessageCircle, Send, X, Loader2, ShieldCheck, LogIn, Trash2 } from 'lucide-vue-next'
import { ask, login, setToken, grantConsent } from '@/api/looma'
import { usePermission } from '@/composables/usePermission'

// ── 权限状态 ──
const { isAuthenticated, refresh: refreshAuth } = usePermission()

// ── UI 状态 ──
const isOpen = ref(false)
const panelState = ref<'collapsed' | 'login' | 'consent' | 'chat'>('collapsed')
const loading = ref(false)

// ── 登录表单 ──
const loginEmail = ref('')
const loginPassword = ref('')
const loginError = ref('')
const loginLoading = ref(false)

// ── 同意授权状态 ──
const CONSENT_SCOPE = 'ask_rag'
const CONSENT_KEY = `looma_consent_${CONSENT_SCOPE}`
const consentGranted = ref(localStorage.getItem(CONSENT_KEY) === '1')
const consentLoading = ref(false)

// ── 消息 ──
interface ChatMessage {
  role: 'user' | 'ai' | 'system'
  content: string
  intent?: string
  sources?: Array<{ title: string; author: string; content_snippet: string }>
  timestamp: number
}

const messages = ref<ChatMessage[]>([])
const inputValue = ref('')

const messagesContainer = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

// ── 已认证 + 已授权才可聊天 ──
const canChat = computed(() => isAuthenticated.value && consentGranted.value)

// ── 打开面板 ──
async function open() {
  isOpen.value = true
  if (!isAuthenticated.value) {
    panelState.value = 'login'
  } else if (!consentGranted.value) {
    panelState.value = 'consent'
  } else {
    panelState.value = 'chat'
  }
  await nextTick()
  if (panelState.value === 'chat') inputRef.value?.focus()
}

function close() {
  isOpen.value = false
  panelState.value = 'collapsed'
}

// ── 登录 ──
async function handleLogin() {
  if (!loginEmail.value || !loginPassword.value) {
    loginError.value = '请输入邮箱和密码'
    return
  }
  loginLoading.value = true
  loginError.value = ''
  try {
    await login(loginEmail.value, loginPassword.value)
    await refreshAuth()
    loginEmail.value = ''
    loginPassword.value = ''
    // 登录成功 → 检查同意
    if (!consentGranted.value) {
      panelState.value = 'consent'
    } else {
      panelState.value = 'chat'
      await nextTick()
      inputRef.value?.focus()
    }
  } catch (e: any) {
    const msg = e?.response?.data?.detail || e?.response?.data?.message || e?.message || '登录失败'
    loginError.value = msg
  } finally {
    loginLoading.value = false
  }
}

// ── 同意授权 ──
async function doGrantConsent() {
  consentLoading.value = true
  try {
    await grantConsent(CONSENT_SCOPE)
    localStorage.setItem(CONSENT_KEY, '1')
    consentGranted.value = true
    panelState.value = 'chat'
    await nextTick()
    inputRef.value?.focus()
  } catch (e: any) {
    const msg = e?.response?.data?.detail || e?.message || '授权失败，请重试'
    messages.value.push({ role: 'system', content: msg, timestamp: Date.now() })
  } finally {
    consentLoading.value = false
  }
}

// ── 发送消息 ──
async function sendMessage() {
  const text = inputValue.value.trim()
  if (!text || loading.value || !canChat.value) return

  inputValue.value = ''
  messages.value.push({ role: 'user', content: text, timestamp: Date.now() })

  loading.value = true
  try {
    const resp = await ask(text, { top_k: 3 })
    messages.value.push({
      role: 'ai',
      content: resp.answer,
      intent: resp.intent || 'poetry',
      sources: resp.sources,
      timestamp: Date.now(),
    })
  } catch (e: any) {
    // 后端要求授权 — 尝试自动 re-grant 后重试
    if (e?.code === 'CONSENT_REQUIRED') {
      localStorage.removeItem(CONSENT_KEY)
      consentGranted.value = false
      try {
        await grantConsent(CONSENT_SCOPE)
        localStorage.setItem(CONSENT_KEY, '1')
        consentGranted.value = true
        // 重试原问题
        const retryResp = await ask(text, { top_k: 3 })
        messages.value.push({
          role: 'ai',
          content: retryResp.answer,
          intent: retryResp.intent || 'poetry',
          sources: retryResp.sources,
          timestamp: Date.now(),
        })
      } catch (retryErr: any) {
        messages.value.push({
          role: 'system',
          content: 'AI 检索需授权，请先在「同意并开始提问」页面完成授权后再提问',
          timestamp: Date.now(),
        })
        panelState.value = 'consent'
      }
    } else if (e?.response?.status === 401) {
      // 会话过期
      const msg = '会话已过期，请重新登录'
      messages.value.push({ role: 'system', content: msg, timestamp: Date.now() })
      setToken('')
      consentGranted.value = false
      localStorage.removeItem(CONSENT_KEY)
      await refreshAuth()
      panelState.value = 'login'
    } else {
      const msg = e?.message || '出了点问题，请稍后再试'
      messages.value.push({ role: 'system', content: msg, timestamp: Date.now() })
    }
  } finally {
    loading.value = false
    await nextTick()
    scrollToBottom()
  }
}

// ── 清空对话 ──
function clearChat() {
  messages.value = []
}

// ── 自动滚底 ──
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 快捷键 Enter 发送
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// 面板打开时聚焦输入框
watch(isOpen, async (val) => {
  if (val && panelState.value === 'chat') {
    await nextTick()
    inputRef.value?.focus()
  }
})

// 新消息自动滚底
watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)
</script>

<template>
  <div class="chat-dialog" :class="{ 'chat-dialog--open': isOpen }">
    <!-- ── 浮动按钮 ── -->
    <button
      v-if="!isOpen"
      class="chat-toggle"
      :title="canChat ? '诗词 AI 助手' : '登录后使用 AI 助手'"
      @click="open"
      aria-label="打开 AI 对话"
    >
      <MessageCircle :size="24" />
      <span v-if="!canChat" class="chat-toggle__dot" />
    </button>

    <!-- ── 面板 ── -->
    <Transition name="chat-slide">
      <div v-if="isOpen" class="chat-panel">
        <!-- Header -->
        <div class="chat-panel__header">
          <div class="chat-panel__title-row">
            <h3 class="chat-panel__title">诗词 AI 助手</h3>
            <span class="chat-panel__badge">Looma</span>
          </div>
          <p class="chat-panel__sub">以诗句为索引，与 AI 品读千年诗意</p>
          <button class="chat-panel__close" @click="close" aria-label="关闭">
            <X :size="18" />
          </button>
        </div>

        <!-- Body: Login -->
        <div v-if="panelState === 'login'" class="chat-panel__body chat-login">
          <div class="chat-login__icon">
            <LogIn :size="48" />
          </div>
          <h4 class="chat-login__title">登录后使用 AI 诗词助手</h4>
          <p class="chat-login__desc">用您的 Bolent 账号登录，即可向 AI 提问诗词相关问题</p>

          <form class="chat-login__form" @submit.prevent="handleLogin">
            <div class="chat-login__field">
              <label for="chat-email" class="chat-login__label">邮箱</label>
              <input
                id="chat-email"
                v-model="loginEmail"
                type="email"
                class="chat-login__input"
                placeholder="you@example.com"
                :disabled="loginLoading"
              />
            </div>
            <div class="chat-login__field">
              <label for="chat-password" class="chat-login__label">密码</label>
              <input
                id="chat-password"
                v-model="loginPassword"
                type="password"
                class="chat-login__input"
                placeholder="••••••••"
                :disabled="loginLoading"
                @keydown.enter="handleLogin"
              />
            </div>
            <p v-if="loginError" class="chat-login__error">{{ loginError }}</p>
            <button
              type="submit"
              class="chat-login__submit"
              :disabled="loginLoading"
            >
              <Loader2 v-if="loginLoading" :size="16" class="chat-spin" />
              <span>{{ loginLoading ? '登录中...' : '登录' }}</span>
            </button>
          </form>
        </div>

        <!-- Body: Consent -->
        <div v-else-if="panelState === 'consent'" class="chat-panel__body chat-consent">
          <div class="chat-consent__icon">
            <ShieldCheck :size="48" />
          </div>
          <h4 class="chat-consent__title">授权 AI 检索</h4>
          <p class="chat-consent__desc">
            AI 将根据您的提问在诗词知识库中检索相关内容并生成回答。
            点击下方按钮即授权处理您的查询请求。
          </p>
          <button class="chat-consent__btn" :disabled="consentLoading" @click="doGrantConsent">
            <Loader2 v-if="consentLoading" :size="16" class="chat-spin" style="margin-right:8px" />
            <span>{{ consentLoading ? '授权中...' : '同意并开始提问' }}</span>
          </button>
          <p class="chat-consent__hint">可随时在对话中清空记录</p>
        </div>

        <!-- Body: Chat -->
        <div v-else class="chat-panel__body chat-messages" ref="messagesContainer">
          <!-- 欢迎消息 -->
          <div v-if="messages.length === 0" class="chat-welcome">
            <p class="chat-welcome__icon">📜</p>
            <h4 class="chat-welcome__title">开始诗词对话</h4>
            <p class="chat-welcome__desc">试试问我：</p>
            <div class="chat-welcome__hints">
              <button
                v-for="hint in ['李白的静夜思表达了什么情感？', '推荐几首描写春天的唐诗', '分析苏轼的水调歌头']"
                :key="hint"
                class="chat-welcome__hint"
                @click="inputValue = hint; sendMessage()"
              >
                {{ hint }}
              </button>
            </div>
          </div>

          <!-- 消息列表 -->
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="chat-msg"
            :class="`chat-msg--${msg.role}`"
          >
            <div class="chat-msg__bubble">
              <div class="chat-msg__text">{{ msg.content }}</div>

              <!-- 来源引用 -->
              <div v-if="msg.role === 'ai' && msg.sources?.length" class="chat-msg__sources">
                <div class="chat-msg__sources-title">📖 引用来源</div>
                <div v-for="(src, si) in msg.sources" :key="si" class="chat-msg__source">
                  <span class="chat-msg__source-name">{{ src.title }}</span>
                  <span class="chat-msg__source-author">— {{ src.author }}</span>
                  <p class="chat-msg__source-snippet">{{ src.content_snippet }}</p>
                </div>
              </div>

              <!-- Intent 标签 -->
              <div v-if="msg.intent" class="chat-msg__intent">
                <span class="chat-msg__intent-tag">{{ msg.intent }}</span>
              </div>
            </div>
          </div>

          <!-- 加载中 -->
          <div v-if="loading" class="chat-msg chat-msg--ai">
            <div class="chat-msg__bubble chat-msg__bubble--typing">
              <Loader2 :size="16" class="chat-spin" />
              <span>AI 正在思考...</span>
            </div>
          </div>
        </div>

        <!-- Input: Chat -->
        <div v-if="panelState === 'chat'" class="chat-panel__input">
          <button
            v-if="messages.length > 0"
            class="chat-input__clear"
            title="清空对话"
            @click="clearChat"
          >
            <Trash2 :size="16" />
          </button>
          <input
            ref="inputRef"
            v-model="inputValue"
            class="chat-input__field"
            placeholder="输入诗词问题..."
            :disabled="loading"
            @keydown="onKeydown"
          />
          <button
            class="chat-input__send"
            :disabled="!inputValue.trim() || loading"
            @click="sendMessage"
            title="发送"
          >
            <Send :size="16" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ══════════════════════════════════════════════
   ChatDialog — 诗词 AI 对话
   ══════════════════════════════════════════════ */

.chat-dialog {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

/* ── 浮动按钮 ── */
.chat-toggle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: var(--bolent-gradient);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(14, 110, 106, 0.35);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}
.chat-toggle:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(14, 110, 106, 0.45);
}
.chat-toggle__dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--bolent-accent);
  border: 2px solid #fff;
}

/* ── 面板 ── */
.chat-panel {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 400px;
  height: 560px;
  background: var(--bolent-bg);
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--bolent-border-light);
}

/* ── Header ── */
.chat-panel__header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--bolent-border-light);
  background: var(--bolent-bg-soft);
  position: relative;
}
.chat-panel__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chat-panel__title {
  font-size: var(--bolent-fs-body);
  font-weight: var(--bolent-fw-bold);
  color: var(--bolent-ink);
  margin: 0;
}
.chat-panel__badge {
  font-size: 11px;
  font-weight: var(--bolent-fw-medium);
  color: var(--bolent-primary);
  background: var(--bolent-primary-50);
  padding: 2px 8px;
  border-radius: 10px;
  letter-spacing: 0.5px;
}
.chat-panel__sub {
  font-size: var(--bolent-fs-caption);
  color: var(--bolent-text-muted);
  margin: 4px 0 0;
}
.chat-panel__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--bolent-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.chat-panel__close:hover {
  background: var(--bolent-border-light);
  color: var(--bolent-ink);
}

/* ── Body ── */
.chat-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* ── Login ── */
.chat-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-top: 24px;
}
.chat-login__icon {
  color: var(--bolent-text-muted);
  margin-bottom: 16px;
}
.chat-login__title {
  font-size: var(--bolent-fs-h4);
  font-weight: var(--bolent-fw-bold);
  color: var(--bolent-ink);
  margin: 0 0 8px;
}
.chat-login__desc {
  font-size: var(--bolent-fs-small);
  color: var(--bolent-text-secondary);
  margin: 0 0 20px;
  max-width: 280px;
}
.chat-login__form {
  width: 100%;
  max-width: 320px;
}
.chat-login__field {
  margin-bottom: 12px;
  text-align: left;
}
.chat-login__label {
  display: block;
  font-size: var(--bolent-fs-caption);
  font-weight: var(--bolent-fw-medium);
  color: var(--bolent-text);
  margin-bottom: 4px;
}
.chat-login__input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--bolent-border);
  border-radius: 8px;
  font-size: var(--bolent-fs-body-sm);
  font-family: var(--bolent-font-sans);
  color: var(--bolent-ink);
  background: var(--bolent-bg);
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.chat-login__input:focus {
  outline: none;
  border-color: var(--bolent-primary);
  box-shadow: 0 0 0 3px var(--bolent-primary-50);
}
.chat-login__input:disabled {
  background: var(--bolent-bg-soft);
  opacity: 0.7;
}
.chat-login__error {
  font-size: var(--bolent-fs-caption);
  color: var(--bolent-error);
  margin: 0 0 8px;
}
.chat-login__submit {
  width: 100%;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: var(--bolent-gradient);
  color: #fff;
  font-size: var(--bolent-fs-body-sm);
  font-weight: var(--bolent-fw-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.15s;
  font-family: var(--bolent-font-sans);
}
.chat-login__submit:hover:not(:disabled) {
  opacity: 0.9;
}
.chat-login__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Consent ── */
.chat-consent {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-top: 32px;
}
.chat-consent__icon {
  color: var(--bolent-accent);
  margin-bottom: 16px;
}
.chat-consent__title {
  font-size: var(--bolent-fs-h4);
  font-weight: var(--bolent-fw-bold);
  color: var(--bolent-ink);
  margin: 0 0 8px;
}
.chat-consent__desc {
  font-size: var(--bolent-fs-small);
  color: var(--bolent-text-secondary);
  margin: 0 0 20px;
  max-width: 300px;
  line-height: var(--bolent-lh-relaxed);
}
.chat-consent__btn {
  padding: 10px 28px;
  border: none;
  border-radius: 8px;
  background: var(--bolent-gradient);
  color: #fff;
  font-size: var(--bolent-fs-body-sm);
  font-weight: var(--bolent-fw-medium);
  cursor: pointer;
  transition: opacity 0.15s;
  font-family: var(--bolent-font-sans);
}
.chat-consent__btn:hover {
  opacity: 0.9;
}
.chat-consent__hint {
  font-size: var(--bolent-fs-caption);
  color: var(--bolent-text-muted);
  margin-top: 12px;
}

/* ── Messages ── */
.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Welcome ── */
.chat-welcome {
  text-align: center;
  padding: 20px 0;
}
.chat-welcome__icon {
  font-size: 36px;
  margin: 0 0 8px;
}
.chat-welcome__title {
  font-size: var(--bolent-fs-body);
  font-weight: var(--bolent-fw-bold);
  color: var(--bolent-ink);
  margin: 0 0 4px;
}
.chat-welcome__desc {
  font-size: var(--bolent-fs-small);
  color: var(--bolent-text-secondary);
  margin: 0 0 12px;
}
.chat-welcome__hints {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}
.chat-welcome__hint {
  padding: 8px 16px;
  border: 1px solid var(--bolent-border);
  border-radius: 12px;
  background: var(--bolent-bg-soft);
  font-size: var(--bolent-fs-small);
  color: var(--bolent-text);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  max-width: 300px;
  text-align: left;
  width: 100%;
  font-family: var(--bolent-font-sans);
}
.chat-welcome__hint:hover {
  border-color: var(--bolent-primary);
  background: var(--bolent-primary-50);
}

/* ── Message ── */
.chat-msg {
  display: flex;
}
.chat-msg--user {
  justify-content: flex-end;
}
.chat-msg--ai {
  justify-content: flex-start;
}
.chat-msg--system {
  justify-content: center;
}

.chat-msg__bubble {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: var(--bolent-fs-small);
  line-height: var(--bolent-lh-normal);
  word-break: break-word;
  white-space: pre-wrap;
}
.chat-msg--user .chat-msg__bubble {
  background: var(--bolent-gradient);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.chat-msg--ai .chat-msg__bubble {
  background: var(--bolent-bg-soft);
  color: var(--bolent-ink);
  border: 1px solid var(--bolent-border-light);
  border-bottom-left-radius: 4px;
}
.chat-msg--system .chat-msg__bubble {
  background: var(--bolent-warning-bg);
  color: var(--bolent-text-secondary);
  font-size: var(--bolent-fs-caption);
  text-align: center;
  max-width: 100%;
}

.chat-msg__bubble--typing {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--bolent-text-muted);
  font-size: var(--bolent-fs-caption);
}

/* ── Sources ── */
.chat-msg__sources {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--bolent-border-light);
}
.chat-msg__sources-title {
  font-size: var(--bolent-fs-caption);
  font-weight: var(--bolent-fw-medium);
  color: var(--bolent-text-secondary);
  margin-bottom: 6px;
}
.chat-msg__source {
  margin-bottom: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}
.chat-msg__source-name {
  font-size: var(--bolent-fs-caption);
  font-weight: var(--bolent-fw-medium);
  color: var(--bolent-ink);
}
.chat-msg__source-author {
  font-size: 12px;
  color: var(--bolent-text-muted);
}
.chat-msg__source-snippet {
  font-size: 12px;
  color: var(--bolent-text-secondary);
  margin: 4px 0 0;
  line-height: var(--bolent-lh-snug);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Intent ── */
.chat-msg__intent {
  margin-top: 8px;
}
.chat-msg__intent-tag {
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--bolent-accent-50);
  color: var(--bolent-accent-dark);
  font-weight: var(--bolent-fw-medium);
}

/* ── Input ── */
.chat-panel__input {
  padding: 12px 16px;
  border-top: 1px solid var(--bolent-border-light);
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bolent-bg);
}
.chat-input__clear {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--bolent-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}
.chat-input__clear:hover {
  background: var(--bolent-border-light);
  color: var(--bolent-error);
}
.chat-input__field {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--bolent-border);
  border-radius: 10px;
  font-size: var(--bolent-fs-small);
  font-family: var(--bolent-font-sans);
  color: var(--bolent-ink);
  background: var(--bolent-bg-soft);
  transition: border-color 0.15s;
  min-width: 0;
}
.chat-input__field:focus {
  outline: none;
  border-color: var(--bolent-primary);
  box-shadow: 0 0 0 3px var(--bolent-primary-50);
}
.chat-input__field:disabled {
  opacity: 0.6;
}
.chat-input__send {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 10px;
  background: var(--bolent-primary);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, opacity 0.15s;
}
.chat-input__send:hover:not(:disabled) {
  background: var(--bolent-primary-dark);
}
.chat-input__send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Animations ── */
.chat-spin {
  animation: chat-spin 1s linear infinite;
}
@keyframes chat-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.chat-slide-enter-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.chat-slide-leave-active {
  transition: all 0.2s ease-in;
}
.chat-slide-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

/* ── Responsive ── */
@media (max-width: 440px) {
  .chat-dialog {
    bottom: 16px;
    right: 16px;
  }
  .chat-panel {
    width: calc(100vw - 32px);
    height: 480px;
    right: auto;
    left: 0;
    bottom: 0;
  }
}
</style>
