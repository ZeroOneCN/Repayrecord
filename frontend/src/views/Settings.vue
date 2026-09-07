<template>
  <AppLayout>
    <div class="page-shell">
      <section class="page-header">
        <div class="page-header-main">
          <span class="page-icon-badge">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 8.75A3.25 3.25 0 1 0 12 15.25A3.25 3.25 0 1 0 12 8.75Z" />
              <path d="M19 12A7 7 0 0 0 18.88 10.7L21 9.12L19.5 6.52L16.96 7.3A7.02 7.02 0 0 0 14.8 6.08L14.42 3H9.58L9.2 6.08A7.02 7.02 0 0 0 7.04 7.3L4.5 6.52L3 9.12L5.12 10.7A7.27 7.27 0 0 0 5.12 13.3L3 14.88L4.5 17.48L7.04 16.7A7.02 7.02 0 0 0 9.2 17.92L9.58 21H14.42L14.8 17.92A7.02 7.02 0 0 0 16.96 16.7L19.5 17.48L21 14.88L18.88 13.3C18.96 12.87 19 12.44 19 12Z" />
            </svg>
          </span>
          <div>
            <p class="page-kicker">Preferences</p>
            <h1 class="page-title">平台设置与自动化</h1>
            <p class="page-description">
              集中管理提醒策略、企业微信通知和账单还款自动流水。所有开关会在本地界面和后端提醒任务中同步生效。
            </p>
          </div>
        </div>
      </section>

      <section class="surface-card settings-shell">
        <div class="settings-topbar">
          <div>
            <h2 class="settings-title">提醒与联动配置</h2>
            <p class="settings-subtitle">保存后会立即刷新本地偏好与后端定时提醒。</p>
          </div>
          <div class="toolbar-actions">
            <button class="theme-btn theme-btn-outline" :disabled="isSaving" @click="reset">恢复默认</button>
            <button class="theme-btn theme-btn-primary" :disabled="isSaving" @click="save">
              <svg
                v-if="isSaving"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="spin"
              >
                <path d="M21 12A9 9 0 1 1 18.36 5.64" />
              </svg>
              保存设置
            </button>
          </div>
        </div>

        <div class="settings-grid">
          <section class="settings-section">
            <div class="settings-section-head">
              <div>
                <h3>提醒中心</h3>
                <p>控制全局提醒是否启用、提醒频率和逾期联动策略。</p>
              </div>
              <label class="switch-row switch-row-compact">
                <div>
                  <span class="switch-label">启用提醒中心</span>
                  <p class="switch-hint">关闭后将暂停到期与逾期提醒。</p>
                </div>
                <ToggleSwitch v-model="prefs.notificationsEnabled" />
              </label>
            </div>

            <div class="form-grid">
              <div class="form-row">
                <div class="form-item">
                  <label class="form-label">提醒频次</label>
                  <Dropdown
                    v-model="prefs.notificationFrequency"
                    :options="frequencyOptions"
                    :disabled="notificationsLocked"
                  />
                  <p class="form-hint">“每日首次”避免重复推送，“每次进入”更适合高频核对。</p>
                </div>
                <div class="form-item">
                  <label class="form-label">提前提醒天数</label>
                  <input
                    v-model.number="prefs.upcomingDays"
                    class="theme-input"
                    type="number"
                    min="0"
                    max="30"
                    :disabled="notificationsLocked"
                  />
                  <p class="form-hint">支持 0 到 30 天，建议控制在 3 到 7 天之间。</p>
                </div>
              </div>

              <label class="switch-row">
                <div>
                  <span class="switch-label">启用逾期提醒</span>
                  <p class="switch-hint">打开后，已过还款截止日的账单会单独发送告警提醒。</p>
                </div>
                <ToggleSwitch
                  v-model="prefs.overdueEnabled"
                  :disabled="notificationsLocked"
                  @change="showToggleTip('逾期提醒', $event)"
                />
              </label>
            </div>
          </section>

          <section class="settings-section">
            <div class="settings-section-head">
              <div>
                <h3>企业微信通知</h3>
                <p>将提醒消息推送到企业微信群机器人，适合多设备同步查看。</p>
              </div>
              <label class="switch-row switch-row-compact">
                <div>
                  <span class="switch-label">启用企业微信推送</span>
                  <p class="switch-hint">需要填写有效的 Webhook 地址。</p>
                </div>
                <ToggleSwitch
                  v-model="prefs.wechatEnabled"
                  :disabled="notificationsLocked"
                  @change="showToggleTip('企业微信推送', $event)"
                />
              </label>
            </div>

            <div class="form-grid">
              <div class="form-item">
                <label class="form-label">Webhook 地址</label>
                <div class="webhook-row">
                  <input
                    v-model="prefs.wechatWebhookUrl"
                    class="theme-input"
                    type="text"
                    placeholder="请输入企业微信群机器人 Webhook URL"
                    :disabled="notificationsLocked"
                  />
                  <button
                    class="theme-btn theme-btn-outline"
                    :disabled="!canTestWebhook"
                    @click="testWebhook"
                  >
                    <svg
                      v-if="isTestingWebhook"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="spin"
                    >
                      <path d="M21 12A9 9 0 1 1 18.36 5.64" />
                    </svg>
                    发送测试
                  </button>
                </div>
                <p class="form-hint">测试消息会通过后端代理发送，避免浏览器跨域限制。</p>
              </div>
            </div>
          </section>

          <section class="settings-section">
            <div class="settings-section-head">
              <div>
                <h3>账单还款自动流水</h3>
                <p>控制在“标记还款”时是否自动写入还款记录，并同步利息数据。</p>
              </div>
            </div>

            <label class="switch-row">
              <div>
                <span class="switch-label">自动生成还款记录</span>
                <p class="switch-hint">启用后，账单在概览页或账单页标记为已还时，会自动写入还款流水。</p>
              </div>
              <ToggleSwitch
                v-model="prefs.autoRepaymentOnMarkPaid"
                @change="showToggleTip('自动还款流水', $event)"
              />
            </label>
          </section>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { settingsAPI } from '@/services/api'
import { sendWeComMarkdown } from '@/services/notify'
import { applyPreferences, defaultPrefs, normalizePreferences } from '@/services/preferences'
import AppLayout from '@/components/Layout/AppLayout.vue'
import Dropdown from '@/components/ui/Dropdown.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'

const prefs = reactive({ ...defaultPrefs })
const isSaving = ref(false)
const isTestingWebhook = ref(false)

const frequencyOptions = computed(() => [
  { value: 'daily', label: '每日首次' },
  { value: 'always', label: '每次进入' }
])

const notificationsLocked = computed(() => !prefs.notificationsEnabled)
const canTestWebhook = computed(
  () =>
    !notificationsLocked.value &&
    prefs.wechatEnabled &&
    Boolean(String(prefs.wechatWebhookUrl || '').trim()) &&
    !isTestingWebhook.value
)

const applyToState = (source) => {
  Object.assign(prefs, normalizePreferences(source))
}

const loadSettings = async () => {
  try {
    const serverPrefs = await settingsAPI.getAll()
    if (serverPrefs && Object.keys(serverPrefs).length > 0) {
      applyToState(serverPrefs)
      applyPreferences(serverPrefs)
    } else {
      applyToState(defaultPrefs)
    }
  } catch (error) {
    console.log('从后端加载设置失败，继续使用本地偏好', error)
  }
}

const showToggleTip = (name, value) => {
  window.$message?.[value ? 'success' : 'info'](`${name}${value ? '已开启' : '已关闭'}`)
}

const save = async () => {
  try {
    isSaving.value = true
    const normalized = normalizePreferences(prefs)
    applyToState(normalized)
    await settingsAPI.update(normalized)
    applyPreferences(normalized)
    window.$message?.success('设置已保存并立即生效')
  } catch (error) {
    console.error('保存设置失败:', error)
    window.$message?.error('保存设置失败')
  } finally {
    isSaving.value = false
  }
}

const reset = async () => {
  try {
    isSaving.value = true
    applyToState(defaultPrefs)
    await settingsAPI.update(defaultPrefs)
    applyPreferences(defaultPrefs)
    window.$message?.success('已恢复默认设置')
  } catch (error) {
    console.error('重置设置失败:', error)
    window.$message?.error('重置设置失败')
  } finally {
    isSaving.value = false
  }
}

const testWebhook = async () => {
  try {
    if (!canTestWebhook.value) return

    isTestingWebhook.value = true
    const content = [
      '> 【测试消息】借款还款管理平台',
      `- 时间：${new Date().toLocaleString('zh-CN')}`,
      '- 状态：通知链路正常',
      '- 来源：平台设置页',
      '',
      '如果您收到此消息，说明企业微信 Webhook 配置可用。'
    ].join('\n')

    await sendWeComMarkdown(String(prefs.wechatWebhookUrl).trim(), content)
    window.$message?.success('测试消息已发送')
  } catch (error) {
    console.error('发送测试消息失败:', error)
    window.$message?.error('发送测试消息失败')
  } finally {
    isTestingWebhook.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-shell {
  padding: 24px;
}

.settings-topbar {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-soft);
}

.settings-title {
  margin: 0;
  color: var(--text-strong);
  font-size: 1.45rem;
  font-weight: 800;
}

.settings-subtitle {
  margin: 8px 0 0;
  color: var(--text-muted);
}

.settings-grid {
  display: grid;
  gap: 18px;
  padding-top: 24px;
}

.settings-section {
  padding: 22px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(247, 251, 248, 0.88));
  border: 1px solid var(--border-soft);
}

.settings-section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 20px;
}

.settings-section-head h3 {
  margin: 0;
  color: var(--text-strong);
  font-size: 1.12rem;
  font-weight: 800;
}

.settings-section-head p {
  margin: 8px 0 0;
  color: var(--text-muted);
  line-height: 1.6;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(237, 245, 238, 0.78);
  border: 1px solid rgba(21, 45, 33, 0.08);
}

.switch-row-compact {
  min-width: min(100%, 360px);
}

.switch-label {
  display: block;
  color: var(--text-strong);
  font-weight: 700;
}

.switch-hint {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.6;
}

.webhook-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .settings-shell {
    padding: 18px;
  }

  .settings-topbar,
  .settings-section-head,
  .switch-row {
    flex-direction: column;
    align-items: stretch;
  }

  .switch-row-compact {
    min-width: 0;
  }

  .webhook-row {
    grid-template-columns: 1fr;
  }
}
</style>
