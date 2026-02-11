<template>
  <div class="settings page">
    <a-card title="系统设置" :bordered="false">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="save">保存设置</a-button>
          <a-button @click="reset">恢复默认</a-button>
        </a-space>
      </template>
      <a-form
        :model="prefs"
        layout="vertical"
        class="settings-form"
      >
        <div class="section-block">
          <div class="section-title">通知规则</div>
          <a-row :gutter="24">
            <a-col :span="8">
              <a-form-item label="提醒频次" help="控制通知推送的频率策略">
                <a-select
                  v-model:value="prefs.notificationFrequency"
                  :options="[
                    { value: 'daily', label: '每日首次 (推荐)' },
                    { value: 'always', label: '每次进入' }
                  ]"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="提前提醒天数">
                <a-input-number 
                  v-model:value="prefs.upcomingDays" 
                  :min="0" 
                  :max="30" 
                  addon-after="天"
                  style="width: 100%" 
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="通知开关">
                <a-space direction="vertical" style="width: 100%">
                  <a-row type="flex" justify="space-between" align="middle" style="width: 100%">
                    <span>到期提醒</span>
                    <a-switch v-model:checked="prefs.notificationsEnabled" checked-children="开" un-checked-children="关" />
                  </a-row>
                  <a-row type="flex" justify="space-between" align="middle" style="width: 100%; margin-top: 8px">
                    <span>逾期提醒</span>
                    <a-switch v-model:checked="prefs.overdueEnabled" checked-children="开" un-checked-children="关" />
                  </a-row>
                </a-space>
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <a-divider />

        <div class="section-block">
          <div class="section-title">企业微信集成</div>
          <a-row :gutter="24">
            <a-col :span="24">
              <a-form-item label="Webhook 地址">
                <a-input-group compact>
                  <a-input 
                    v-model:value="prefs.wechatWebhookUrl" 
                    placeholder="请输入企业微信群机器人 Webhook URL" 
                    style="width: calc(100% - 120px)"
                  />
                  <a-button @click="testWebhook">发送测试</a-button>
                </a-input-group>
              </a-form-item>
            </a-col>
            <a-col :span="24">
              <a-form-item>
                <a-checkbox v-model:checked="prefs.wechatEnabled">
                  启用企业微信消息推送
                </a-checkbox>
                <span class="tip-text">开启后，系统将在触发提醒规则时自动推送到上述群组</span>
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <a-divider />

        <div class="section-block">
          <div class="section-title">自动化操作</div>
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item label="还款记录自动生成" help="在账单列表标记为“已还”时，自动创建一条对应的还款流水记录">
                <a-switch 
                  v-model:checked="prefs.autoRepaymentOnMarkPaid" 
                  checked-children="开启" 
                  un-checked-children="关闭" 
                />
              </a-form-item>
            </a-col>
          </a-row>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { message } from 'ant-design-vue';
import { getPreferences, savePreferences, defaultPrefs } from '@/services/preferences';
import { settingsAPI } from '@/services/api';
import { sendWeComMarkdown } from '@/services/notify';

const prefs = reactive(getPreferences());

const save = async () => {
  try {
    // 先写入后端数据库
    await settingsAPI.update(prefs);
    // 同步更新本地缓存，供其他模块同步读取
    savePreferences(prefs);
    message.success('设置已保存');
  } catch (e) {
    console.error('保存设置失败:', e);
    message.error('保存设置失败');
  }
};

const reset = async () => {
  try {
    Object.assign(prefs, defaultPrefs);
    await settingsAPI.update(prefs);
    savePreferences(prefs);
    message.success('已恢复默认设置');
  } catch (e) {
    console.error('重置设置失败:', e);
    message.error('重置设置失败');
  }
};

const testWebhook = async () => {
  try {
    if (!prefs.wechatWebhookUrl) {
      message.warning('请先填写企业微信 Webhook URL');
      return;
    }
    // Markdown 模板（企业微信机器人支持的格式）
    const content = [
      '> <font color="warning">【逾期提醒】共有 2 条账单逾期，合计 ¥1,234.56</font>',
      '- 平台A 金额¥500.00 (截止 2024-01-05)',
      '- 平台B 金额¥734.56 (截止 2024-01-08)',
      '',
      '> <font color="comment">【到期提醒】3 天内到期账单 3 条，合计 ¥2,000.00</font>',
      '- 平台C 金额¥600.00 (截止 2024-01-10)',
      '- 平台D 金额¥900.00 (截止 2024-01-11)',
      '- 平台E 金额¥500.00 (截止 2024-01-12)',
      ''
    ].join('\n');
    await sendWeComMarkdown(prefs.wechatWebhookUrl, content);
    message.success('测试消息已发送');
  } catch (e) {
    console.error(e);
    message.error('发送测试消息失败');
  }
};

</script>

<style scoped>
.settings {
  padding: 16px;
}

.section-block {
  padding: 0 4px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f1f1f;
  margin: 4px 0 12px;
}

.tip-text {
  color: #8c8c8c;
  font-size: 13px;
  margin-left: 8px;
}

.settings-form :deep(.ant-form-item) {
  margin-bottom: 16px;
}

</style>
