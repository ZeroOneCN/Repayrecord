const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const isPositiveNumber = (value) => {
  const num = toNumber(value);
  return num !== null && num > 0;
};

const isPositiveInt = (value) => {
  const num = toNumber(value);
  return num !== null && Number.isInteger(num) && num > 0;
};

const isValidDayOfMonth = (value) => {
  const num = toNumber(value);
  return num !== null && Number.isInteger(num) && num >= 1 && num <= 31;
};

const isValidMonth = (value) => {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const [yearStr, monthStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  return Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12;
};

const isValidDate = (value) => {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const [y, m, d] = value.split('-').map(Number);
  return date.getUTCFullYear() === y && date.getUTCMonth() + 1 === m && date.getUTCDate() === d;
};

module.exports = {
  toNumber,
  isPositiveNumber,
  isPositiveInt,
  isValidDayOfMonth,
  isValidMonth,
  isValidDate
};
