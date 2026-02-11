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

export function getPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultPrefs };
    const parsed = JSON.parse(raw);
    return { ...defaultPrefs, ...parsed };
  } catch (e) {
    return { ...defaultPrefs };
  }
}

export function savePreferences(prefs) {
  try {
    const merged = { ...defaultPrefs, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    return { ...defaultPrefs };
  }
}

export function updatePreferences(patch) {
  const current = getPreferences();
  return savePreferences({ ...current, ...patch });
}
