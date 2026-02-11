import axios from 'axios';

// 发送企业微信文本消息
export async function sendWeComText(webhookUrl, content) {
  if (!webhookUrl) throw new Error('Webhook 未配置');
  // 通过后端代理避免浏览器CORS限制
  const res = await axios.post('/api/notify/wecom/send', { webhookUrl, content });
  return res.data;
}

// 发送企业微信模板卡片消息（text_notice）
export async function sendWeComCard(webhookUrl, payload) {
  if (!webhookUrl) throw new Error('Webhook 未配置');
  const res = await axios.post('/api/notify/wecom/card', { webhookUrl, ...payload });
  return res.data;
}

// 发送企业微信 Markdown 消息
export async function sendWeComMarkdown(webhookUrl, content) {
  if (!webhookUrl) throw new Error('Webhook 未配置');
  const res = await axios.post('/api/notify/wecom/markdown', { webhookUrl, content });
  return res.data;
}

export function formatBillSummary(bills) {
  if (!bills || bills.length === 0) return '暂无账单提醒。';
  // 隐藏时间戳：仅展示平台与金额
  const lines = bills.slice(0, 5).map(b => `• ${b.platform_name} 金额¥${b.amount}`);
  const more = bills.length > 5 ? `... 另有 ${bills.length - 5} 条` : '';
  return `${lines.join('\n')}\n${more}`;
}

export function formatBillMarkdownList(bills) {
  if (!bills || bills.length === 0) return '暂无账单提醒。';
  const lines = bills.slice(0, 5).map(b => `- ${b.platform_name} 金额¥${b.amount} (截止 ${b.due_date ?? ''})`);
  const more = bills.length > 5 ? `\n... 另有 ${bills.length - 5} 条` : '';
  return `${lines.join('\n')}${more}`;
}