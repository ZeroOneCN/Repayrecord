<template>
  <div class="app-layout">
    <!-- 侧边栏 -->
    <aside :class="['sidebar', { 'sidebar-collapsed': isCollapsed }]">
      <!-- Logo -->
      <div class="sidebar-header">
        <div class="logo">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none" />
            <path d="M8 7L12 12L16 7M12 12V17M9 16H15M9 17H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span v-show="!isCollapsed" class="logo-text">借款还款管理</span>
        </div>
      </div>

      <!-- 导航菜单 -->
      <nav class="sidebar-nav">
        <a
          v-for="item in navItems"
          :key="item.key"
          :href="item.path"
          @click.prevent="navigate(item.path)"
          :class="['nav-item', currentPath === item.path ? 'nav-item-active' : '']"
          :title="isCollapsed ? item.label : ''"
        >
          <component :is="item.icon" class="nav-icon" />
          <span v-show="!isCollapsed" class="nav-label">{{ item.label }}</span>
        </a>
      </nav>

      <!-- 折叠按钮 -->
      <div class="sidebar-footer">
        <button class="collapse-btn" @click="toggleCollapse" :title="isCollapsed ? '展开侧边栏' : '折叠侧边栏'">
          <svg v-if="isCollapsed" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6" />
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="main-area">
      <!-- 顶栏 -->
      <header class="header">
        <div class="header-left">
          <div class="breadcrumb">
            <span>首页</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">{{ currentPageName }}</span>
          </div>
        </div>
        <div class="header-right">
          <span class="current-date">{{ currentDate }}</span>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  HomeOutlined,
  BankOutlined,
  FileTextOutlined,
  DollarOutlined,
  BarChartOutlined,
  SettingOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const router = useRouter()
const route = useRoute()
const isCollapsed = ref(false)

const currentPath = ref(route.path)

const navItems = [
  { key: '1', icon: HomeOutlined, label: '数据概览', path: '/dashboard' },
  { key: '2', icon: BankOutlined, label: '借款平台', path: '/platforms' },
  { key: '3', icon: FileTextOutlined, label: '账单管理', path: '/bills' },
  { key: '4', icon: DollarOutlined, label: '还款记录', path: '/repayments' },
  { key: '5', icon: BarChartOutlined, label: '还款统计', path: '/statistics' },
  { key: '6', icon: SettingOutlined, label: '平台设置', path: '/settings' }
]

const currentPageName = computed(() => {
  const item = navItems.find(item => item.path === route.path)
  return item ? item.label : '未知页面'
})

const currentDate = computed(() => {
  return dayjs().format('YYYY 年 MM 月 DD 日')
})

const navigate = (path) => {
  currentPath.value = path
  router.push(path)
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 256px;
  background: white;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: width 0.3s ease;
  position: relative;
  z-index: 100;
}

.sidebar-collapsed {
  width: 64px;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.sidebar-collapsed .sidebar-header {
  padding: 0 12px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.sidebar-collapsed .logo {
  justify-content: center;
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: #1677ff;
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #141414;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  color: #595959;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  white-space: nowrap;
}

.nav-item:hover {
  background: #f5f5f5;
}

.nav-item-active {
  background: #e6f4ff;
  color: #1677ff;
  font-weight: 500;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-label {
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.collapse-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #595959;
  transition: all 0.2s;
}

.collapse-btn:hover {
  background: #e6f4ff;
  color: #1677ff;
}

/* 主内容区 */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f7fa;
  min-width: 0;
}

.header {
  height: 64px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #8c8c8c;
}

.breadcrumb-separator {
  color: #d9d9d9;
}

.breadcrumb-current {
  color: #141414;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
}

.current-date {
  font-size: 14px;
  color: #595959;
}

.main-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

/* 滚动条优化 */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 2px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

.main-content::-webkit-scrollbar {
  width: 6px;
}

.main-content::-webkit-scrollbar-track {
  background: #f5f7fa;
}

.main-content::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}
</style>
