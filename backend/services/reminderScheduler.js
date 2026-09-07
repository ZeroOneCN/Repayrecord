const axios = require('axios');
const Setting = require('../models/Setting');
const Bill = require('../models/Bill');

const CHECK_INTERVAL = 10 * 60 * 1000;

let reminderInterval = null;
let lastNotificationDate = null;
let serverPort = process.env.SERVER_PORT || 9502;

function normalizePrefs(raw = {}) {
  const upcomingDays = Number(raw.upcomingDays);

  return {
    notificationsEnabled: raw.notificationsEnabled !== false,
    notificationFrequency: raw.notificationFrequency === 'always' ? 'always' : 'daily',
    upcomingDays: Number.isFinite(upcomingDays)
      ? Math.min(30, Math.max(0, Math.round(upcomingDays)))
      : 3,
    overdueEnabled: raw.overdueEnabled !== false,
    wechatEnabled: raw.wechatEnabled === true,
    wechatWebhookUrl: String(raw.wechatWebhookUrl || '').trim()
  };
}

async function getReminderPrefs() {
  const prefs = await Setting.getAll();
  return normalizePrefs(prefs);
}

function stopReminderScheduler() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
}

async function checkReminders() {
  try {
    const prefs = await getReminderPrefs();
    if (!prefs.notificationsEnabled) {
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (prefs.notificationFrequency === 'daily' && lastNotificationDate === today) {
      return;
    }

    const summary = await Bill.getAlertSummary(prefs.upcomingDays);
    const overdue = summary?.overdue || { count: 0, items: [], total_amount: 0 };
    const upcoming = summary?.upcoming || { count: 0, items: [], total_amount: 0 };

    if (overdue.count === 0 && upcoming.count === 0) {
      return;
    }

    if (!prefs.wechatEnabled || !prefs.wechatWebhookUrl) {
      return;
    }

    const messageParts = [];

    if (prefs.overdueEnabled && overdue.count > 0) {
      messageParts.push(formatOverdueMessage(overdue));
    }

    if (upcoming.count > 0) {
      messageParts.push(formatUpcomingMessage(upcoming, prefs.upcomingDays));
    }

    if (messageParts.length === 0) {
      return;
    }

    await axios.post(`http://127.0.0.1:${serverPort}/api/notify/wecom/markdown`, {
      webhookUrl: prefs.wechatWebhookUrl,
      content: messageParts.join('\n\n')
    });

    if (prefs.notificationFrequency === 'daily') {
      lastNotificationDate = today;
    }
  } catch (error) {
    console.error('[提醒任务] 执行失败:', error.message);
  }
}

function formatOverdueMessage(overdue) {
  const lines = overdue.items
    .slice(0, 5)
    .map(
      (item) =>
        `- ${item.platform_name} 金额¥${Number(item.amount).toFixed(2)} (截止 ${item.due_date})`
    );
  const more = overdue.items.length > 5 ? `\n... 还有 ${overdue.items.length - 5} 条` : '';

  return [
    `> <font color="warning">【逾期提醒】共 ${overdue.count} 条账单逾期，合计 ¥${Number(
      overdue.total_amount || 0
    ).toFixed(2)}</font>`,
    ...lines,
    more
  ].join('\n');
}

function formatUpcomingMessage(upcoming, days) {
  const lines = upcoming.items
    .slice(0, 5)
    .map(
      (item) =>
        `- ${item.platform_name} 金额¥${Number(item.amount).toFixed(2)} (截止 ${item.due_date})`
    );
  const more = upcoming.items.length > 5 ? `\n... 还有 ${upcoming.items.length - 5} 条` : '';

  return [
    `> <font color="comment">【到期提醒】${days} 天内到期账单 ${upcoming.count} 条，合计 ¥${Number(
      upcoming.total_amount || 0
    ).toFixed(2)}</font>`,
    ...lines,
    more
  ].join('\n');
}

async function startReminderScheduler(options = {}) {
  serverPort = options.port || serverPort;
  stopReminderScheduler();

  await checkReminders();
  reminderInterval = setInterval(() => {
    void checkReminders();
  }, CHECK_INTERVAL);
}

async function restartReminderScheduler(options = {}) {
  await startReminderScheduler(options);
}

module.exports = {
  startReminderScheduler,
  restartReminderScheduler,
  stopReminderScheduler
};
