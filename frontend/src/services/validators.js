import dayjs from 'dayjs';

export const isPositiveNumber = (value) => {
  if (value === null || value === undefined || value === '') return false;
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
};

export const isValidMonth = (value) => {
  if (!value) return false;
  if (typeof value === 'string') {
    if (!/^\d{4}-\d{2}$/.test(value)) return false;
    const [yearStr, monthStr] = value.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    return Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12;
  }
  const month = dayjs(value);
  return month.isValid();
};

export const isValidDate = (value) => {
  if (!value) return false;
  if (typeof value === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const [y, m, d] = value.split('-').map(Number);
    return date.getUTCFullYear() === y && date.getUTCMonth() + 1 === m && date.getUTCDate() === d;
  }
  const date = dayjs(value);
  return date.isValid();
};

export const isValidDayOfMonth = (value) => {
  if (value === null || value === undefined || value === '') return false;
  const num = Number(value);
  return Number.isInteger(num) && num >= 1 && num <= 31;
};

export const requiredRule = (message) => ({ required: true, message });

export const positiveNumberRule = (message) => ({
  validator: (_, value) => (isPositiveNumber(value) ? Promise.resolve() : Promise.reject(new Error(message)))
});

export const validMonthRule = (message) => ({
  validator: (_, value) => (isValidMonth(value) ? Promise.resolve() : Promise.reject(new Error(message)))
});

export const validDateRule = (message) => ({
  validator: (_, value) => (isValidDate(value) ? Promise.resolve() : Promise.reject(new Error(message)))
});

export const validDayOfMonthRule = (message) => ({
  validator: (_, value) => (isValidDayOfMonth(value) ? Promise.resolve() : Promise.reject(new Error(message)))
});
