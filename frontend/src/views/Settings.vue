<template>
  <AppLayout>
    <div style="padding: 0;">
      <!-- 页面标题 -->
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #141414; margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 28px;">⚙️</span>
          平台设置
        </h1>
        <p style="font-size: 16px; color: #8c8c8c; margin: 0;">配置通知规则、企业微信集成和自动化操作</p>
      </div>

      <!-- 设置表单 -->
      <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #f0f0f0; overflow: hidden;">
        <!-- 头部 -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #f0f0f0;">
          <h3 style="font-size: 18px; font-weight: 600; color: #141414; margin: 0;">平台设置</h3>
          <div style="display: flex; gap: 12px;">
            <button @click="reset" style="padding: 10px 20px; background: #f5f5f5; color: #595959; border: 1px solid #d9d9d9; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500; transition: all 0.2s;" @mouseenter="$event.target.style.background = '#e8e8e8'" @mouseleave="$event.target.style.background = '#f5f5f5'">恢复默认</button>
            <button @click="save" style="padding: 10px 20px; background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500; box-shadow: 0 2px 8px rgba(22,119,255,0.3); transition: all 0.2s;" @mouseenter="$event.target.style.transform = 'translateY(-2px)'; $event.target.style.boxShadow = '0 4px 12px rgba(22,119,255,0.4)'" @mouseleave="$event.target.style.transform = 'translateY(0)'; $event.target.style.boxShadow = '0 2px 8px rgba(22,119,255,0.3)'">保存设置</button>
          </div>
        </div>

        <div style="padding: 24px;">
          <!-- 通知规则 -->
          <div style="margin-bottom: 32px;">
            <h4 style="font-size: 16px; font-weight: 600; color: #141414; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1677ff" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              通知规则
            </h4>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); border-radius: 10px;">
              <div>
                <label style="display: block; font-size: 15px; font-weight: 500; color: #595959; margin-bottom: 8px;">提醒频次</label>
                <Dropdown 
                  v-model="prefs.notificationFrequency" 
                  :options="frequencyOptions"
                  style="width: 100%;"
                />
                <p style="font-size: 13px; color: #8c8c8c; margin: 6px 0 0 0;">控制通知推送的频率策略</p>
              </div>
              <div>
                <label style="display: block; font-size: 15px; font-weight: 500; color: #595959; margin-bottom: 8px;">提前提醒天数</label>
                <input v-model.number="prefs.upcomingDays" type="number" min="0" max="30" style="width: 100%; padding: 12px 16px; border: 1px solid #d9d9d9; border-radius: 8px; font-size: 16px; outline: none; transition: all 0.2s;" @focus="$event.target.style.borderColor = '#1677ff'" @blur="$event.target.style.borderColor = '#d9d9d9'" />
                <p style="font-size: 13px; color: #8c8c8c; margin: 6px 0 0 0;">天 (0-30)</p>
              </div>
              <div>
                <label style="display: block; font-size: 15px; font-weight: 500; color: #595959; margin-bottom: 8px;">通知开关</label>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; gap: 12px;">
                    <span style="font-size: 15px; color: #595959; flex: 1;">到期提醒</span>
                    <ToggleSwitch 
                      v-model="prefs.notificationsEnabled" 
                      @change="showToggleTip('到期提醒', $event)"
                    />
                  </label>
                  <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; gap: 12px;">
                    <span style="font-size: 15px; color: #595959; flex: 1;">逾期提醒</span>
                    <ToggleSwitch 
                      v-model="prefs.overdueEnabled"
                      @change="showToggleTip('逾期提醒', $event)"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- 企业微信集成 -->
          <div style="margin-bottom: 32px;">
            <h4 style="font-size: 16px; font-weight: 600; color: #141414; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1677ff" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              企业微信集成
            </h4>
            <div style="padding: 20px; background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); border-radius: 10px;">
              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 15px; font-weight: 500; color: #595959; margin-bottom: 8px;">Webhook 地址</label>
                <div style="display: flex; gap: 12px;">
                  <input v-model="prefs.wechatWebhookUrl" type="text" placeholder="请输入企业微信群机器人 Webhook URL" style="flex: 1; padding: 12px 16px; border: 1px solid #d9d9d9; border-radius: 8px; font-size: 16px; outline: none; transition: all 0.2s;" @focus="$event.target.style.borderColor = '#1677ff'" @blur="$event.target.style.borderColor = '#d9d9d9'" />
                  <button @click="testWebhook" style="padding: 10px 20px; background: #f5f5f5; color: #595959; border: 1px solid #d9d9d9; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500; white-space: nowrap; transition: all 0.2s;" @mouseenter="$event.target.style.background = '#e8e8e8'" @mouseleave="$event.target.style.background = '#f5f5f5'">发送测试</button>
                </div>
              </div>
              <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                <ToggleSwitch 
                  v-model="prefs.wechatEnabled"
                  @change="showToggleTip('企业微信消息推送', $event)"
                />
                <div>
                  <span style="font-size: 15px; color: #595959; font-weight: 500;">启用企业微信消息推送</span>
                  <p style="font-size: 13px; color: #8c8c8c; margin: 4px 0 0 0;">开启后，系统将在触发提醒规则时自动推送到上述群组</p>
                </div>
              </label>
            </div>
          </div>

          <!-- 自动化操作 -->
          <div>
            <h4 style="font-size: 16px; font-weight: 600; color: #141414; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1677ff" stroke-width="2">
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
              </svg>
              自动化操作
            </h4>
            <div style="padding: 20px; background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); border-radius: 10px;">
              <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                <ToggleSwitch 
                  v-model="prefs.autoRepaymentOnMarkPaid"
                  @change="showToggleTip('还款记录自动生成', $event)"
                />
                <div>
                  <span style="font-size: 15px; color: #595959; font-weight: 500;">还款记录自动生成</span>
                  <p style="font-size: 13px; color: #8c8c8c; margin: 4px 0 0 0;">在账单列表标记为"已还"时，自动创建一条对应的还款流水记录</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue'
import { getPreferences, savePreferences, defaultPrefs } from '@/services/preferences'
import { settingsAPI } from '@/services/api'
import AppLayout from '@/components/Layout/AppLayout.vue'
import Dropdown from '@/components/ui/Dropdown.vue'

const prefs = reactive({ ...defaultPrefs })

// 从后端加载设置
const loadSettings = async () => {
  try {
    const serverPrefs = await settingsAPI.getAll()
    if (serverPrefs && Object.keys(serverPrefs).length > 0) {
      Object.assign(prefs, serverPrefs)
      savePreferences(prefs)
    }
  } catch (e) {
    console.log('从后端加载设置失败，使用本地设置')
  }
}

onMounted(() => {
  loadSettings()
})

const frequencyOptions = computed(() => [
  { value: 'daily', label: '每日首次' },
  { value: 'always', label: '每次进入' }
])

// 显示开关提示
const showToggleTip = (name, value) => {
  if (value) {
    window.$message?.success(`${name}已开启`)
  } else {
    window.$message?.info(`${name}已关闭`)
  }
}

const save = async () => {
  try {
    await settingsAPI.update(prefs)
    savePreferences(prefs)
    alert('设置已保存')
  } catch (e) {
    console.error('保存设置失败:', e)
    alert('保存设置失败')
  }
}

const reset = async () => {
  try {
    Object.assign(prefs, defaultPrefs)
    await settingsAPI.update(prefs)
    savePreferences(prefs)
    alert('已恢复默认设置')
  } catch (e) {
    console.error('重置设置失败:', e)
    alert('重置设置失败')
  }
}

const testWebhook = async () => {
  try {
    if (!prefs.wechatWebhookUrl) {
      alert('请先填写企业微信 Webhook URL')
      return
    }
    const content = [
      '> 【测试消息】借款还款管理平台',
      `- 时间：${new Date().toLocaleString('zh-CN')}`,
      '- 状态：正常',
      '',
      '如果您收到此消息，说明 Webhook 配置正确。'
    ].join('\n')
    await sendWeComMarkdown(prefs.wechatWebhookUrl, content)
    alert('测试消息已发送')
  } catch (e) {
    console.error(e)
    alert('发送测试消息失败')
  }
}

const sendWeComMarkdown = async (url, content) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ msgtype: 'markdown', markdown: { content } })
  })
  if (!response.ok) throw new Error('发送失败')
  return response.json()
}
</script>

<script>
// ToggleSwitch 组件
import { defineComponent, h } from 'vue'

const ToggleSwitch = defineComponent({
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const handleClick = () => {
      const newValue = !props.modelValue
      emit('update:modelValue', newValue)
      emit('change', newValue)
    }
    
    return () => h(
      'button',
      {
        type: 'button',
        role: 'switch',
        'aria-checked': props.modelValue,
        style: {
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          height: '24px',
          width: '44px',
          minWidth: '44px',
          maxWidth: '44px',
          flexShrink: '0',
          cursor: 'pointer',
          borderRadius: '12px',
          backgroundColor: props.modelValue ? '#1677ff' : '#d9d9d9',
          transition: 'background-color 0.2s',
          outline: 'none',
          border: 'none',
          padding: '2px'
        },
        onClick: handleClick
      },
      h('span', {
        style: {
          pointerEvents: 'none',
          display: 'block',
          height: '20px',
          width: '20px',
          transform: props.modelValue ? 'translateX(20px)' : 'translateX(0)',
          borderRadius: '50%',
          backgroundColor: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          transition: 'transform 0.2s'
        }
      })
    )
  }
})
</script>
