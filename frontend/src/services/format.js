import dayjs from 'dayjs';

export const formatDate = (value) => {
  try {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return dayjs(value).format('YYYY-MM-DD');
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      const num = Number(value);
      const ts = num < 1e12 ? num * 1000 : num;
      return dayjs(ts).format('YYYY-MM-DD');
    }
    return dayjs(value).format('YYYY-MM-DD');
  } catch (e) {
    return String(value);
  }
};

export const formatDateTime = (value) => {
  try {
    if (value === null || value === undefined) return '';
    return dayjs(value).format('YYYY-MM-DD HH:mm');
  } catch (e) {
    return String(value);
  }
};
