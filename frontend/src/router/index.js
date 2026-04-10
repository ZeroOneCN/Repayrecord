import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '数据概览' }
  },
  {
    path: '/platforms',
    name: 'Platforms',
    component: () => import('@/views/Platforms.vue'),
    meta: { title: '借款平台' }
  },
  {
    path: '/bills',
    name: 'Bills',
    component: () => import('@/views/Bills.vue'),
    meta: { title: '账单管理' }
  },
  {
    path: '/repayments',
    name: 'Repayments',
    component: () => import('@/views/Repayments.vue'),
    meta: { title: '还款记录' }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('@/views/Statistics.vue'),
    meta: { title: '还款统计' }
  }
  ,
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: { title: '平台设置' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 更新网页标签页标题
const appTitle = '借款还款平台';
router.afterEach((to) => {
  const pageTitle = to.meta?.title ? `${to.meta.title} - ${appTitle}` : appTitle;
  document.title = pageTitle;
});

export default router;