const STORAGE_KEY = 'repayRecordPrefs';

export const defaultPrefs = {
  notificationsEnabled: true,
  notificationFrequency: 'daily',
  upcomingDays: 3,
  overdueEnabled: true,
  wechatEnabled: false,
  wechatWebhookUrl: '',
  autoRepaymentOnMarkPaid: true
};

export function normalizePreferences(prefs = {}) {
  const upcomingDays = Number(prefs.upcomingDays);

  return {
    notificationsEnabled: prefs.notificationsEnabled ?? defaultPrefs.notificationsEnabled,
    notificationFrequency: prefs.notificationFrequency === 'always' ? 'always' : 'daily',
    upcomingDays: Number.isFinite(upcomingDays)
      ? Math.min(30, Math.max(0, Math.round(upcomingDays)))
      : defaultPrefs.upcomingDays,
    overdueEnabled: prefs.overdueEnabled ?? defaultPrefs.overdueEnabled,
    wechatEnabled: prefs.wechatEnabled ?? defaultPrefs.wechatEnabled,
    wechatWebhookUrl: String(prefs.wechatWebhookUrl ?? defaultPrefs.wechatWebhookUrl).trim(),
    autoRepaymentOnMarkPaid:
      prefs.autoRepaymentOnMarkPaid ?? defaultPrefs.autoRepaymentOnMarkPaid
  };
}

export function getPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultPrefs };
    const parsed = JSON.parse(raw);
    return normalizePreferences({ ...defaultPrefs, ...parsed });
  } catch (e) {
    return { ...defaultPrefs };
  }
}

export function savePreferences(prefs) {
  try {
    const merged = normalizePreferences({ ...defaultPrefs, ...prefs });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    return { ...defaultPrefs };
  }
}

export function applyPreferences(prefs) {
  return savePreferences(prefs);
}

export function updatePreferences(patch) {
  const current = getPreferences();
  return savePreferences({ ...current, ...patch });
}
