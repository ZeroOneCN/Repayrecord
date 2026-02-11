import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('发起请求:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// 负债平台API
export const debtPlatformAPI = {
  getAll: () => api.get('/debt-platforms'),
  getById: (id) => api.get(`/debt-platforms/${id}`),
  create: (data) => api.post('/debt-platforms', data),
  update: (id, data) => api.put(`/debt-platforms/${id}`, data),
  delete: (id) => api.delete(`/debt-platforms/${id}`),
  getStats: () => api.get('/debt-platforms/stats/overview'),
  getPlatformStats: (id) => api.get(`/debt-platforms/${id}/stats`)
};

// 账单API
export const billAPI = {
  getAll: (filters = {}) => api.get('/bills', { params: filters }),
  getById: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  delete: (id) => api.delete(`/bills/${id}`),
  markAsPaid: (id, paid_date) => api.patch(`/bills/${id}/pay`, { paid_date }),
  getMonthlyStats: (month) => api.get(`/bills/stats/monthly/${month}`),
  getMonthlyPlatformSums: (month) => api.get(`/bills/stats/monthly/platform/${month}`),
  getUpcoming: (days = 7) => api.get(`/bills/upcoming/${days}`),
  getAlerts: (upcoming_days = 3) => api.get('/bills/alerts', { params: { upcoming_days } })
};

// 还款记录API
export const repaymentAPI = {
  getAllRecords: (params = {}) => api.get('/repayments/records', { params }),
  getByBillId: (bill_id) => api.get(`/repayments/bill/${bill_id}`),
  create: (data) => api.post('/repayments', data),
  delete: (id) => api.delete(`/repayments/${id}`),
  getMonthlyStats: (month) => api.get(`/repayments/stats/monthly/${month}`),
  getPlatformStats: (platform_id, start_date, end_date) => 
    api.get(`/repayments/stats/platform/${platform_id}`, { 
      params: { start_date, end_date } 
    }),
  getDailyTrend: (start_date, end_date, platform_id) =>
    api.get('/repayments/stats/daily', { params: { start_date, end_date, platform_id } }),
  getByDateRange: (start_date, end_date, platform_id) =>
    api.get('/repayments/records/by-date', { params: { start_date, end_date, platform_id } })
};

// 系统设置API
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
};

// 健康检查
export const healthCheck = () => api.get('/health');

export default api;
