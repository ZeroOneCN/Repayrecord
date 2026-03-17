<template>
  <a-config-provider :locale="zhCN" :component-size="'middle'">
    <a-layout class="app-layout">
      <a-layout-header class="header">
        <div class="header-inner">
          <div class="logo">
            <svg class="logo-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="#1677ff" stroke-width="2" fill="none" />
              <path d="M8 7l4 5 4-5M12 12v5M9 15h6M9 18h6" stroke="#1677ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            </svg>
            <h1 class="logo-text">借款还款管理平台</h1>
          </div>
          <a-menu
            v-model:selectedKeys="selectedKeys"
            mode="horizontal"
            :items="sidebarItems"
            @click="handleTopNavClick"
          />
        </div>
      </a-layout-header>

      <a-layout class="main-layout">
        <div class="main-scroll">
          <a-breadcrumb class="breadcrumb">
            <a-breadcrumb-item>首页</a-breadcrumb-item>
            <a-breadcrumb-item>{{ currentPageName }}</a-breadcrumb-item>
          </a-breadcrumb>

          <a-layout-content class="content">
            <router-view />
          </a-layout-content>
        </div>
      </a-layout>
    </a-layout>
  </a-config-provider>
</template>

<script setup>
import { ref, computed, h, watch } from 'vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import { 
  HomeOutlined, 
  BankOutlined, 
  FileTextOutlined, 
  DollarOutlined, 
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons-vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const selectedKeys = ref(['1']);

const sidebarItems = [
  { key: '1', icon: () => h(HomeOutlined), label: '仪表盘', path: '/dashboard' },
  { key: '2', icon: () => h(BankOutlined), label: '借款平台', path: '/platforms' },
  { key: '3', icon: () => h(FileTextOutlined), label: '账单管理', path: '/bills' },
  { key: '4', icon: () => h(DollarOutlined), label: '还款记录', path: '/repayments' },
  { key: '5', icon: () => h(BarChartOutlined), label: '数据统计', path: '/statistics' },
  { key: '6', icon: () => h(SettingOutlined), label: '设置', path: '/settings' }
];

const currentPageName = computed(() => {
  const item = sidebarItems.find(item => item.path === route.path);
  return item ? item.label : '未知页面';
});

const handleTopNavClick = ({ key }) => {
  const item = sidebarItems.find(item => item.key === key);
  if (item && item.path) {
    router.push(item.path);
  }
};

const updateSelectedByRoute = () => {
  const item = sidebarItems.find(i => i.path === route.path);
  selectedKeys.value = item ? [item.key] : [];
};

updateSelectedByRoute();
watch(() => route.path, () => updateSelectedByRoute());
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: none;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.35);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.logo-icon {
  width: 32px;
  height: 32px;
  filter: brightness(0) invert(1);
  drop-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logo-text {
  color: #fff;
  margin: 0 0 0 10px;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

:deep(.ant-menu-horizontal) {
  border-bottom: none;
  background: transparent;
}

:deep(.ant-menu-horizontal > .ant-menu-item-selected) {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-weight: 600;
  border-radius: 6px;
  margin: 0 4px;
}

:deep(.ant-menu-horizontal > .ant-menu-item-selected::after) {
  border-bottom-color: transparent;
}

:deep(.ant-menu-horizontal > .ant-menu-item:hover) {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

:deep(.ant-menu-horizontal > .ant-menu-item) {
  color: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  margin: 0 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.ant-menu-horizontal > .ant-menu-item:hover) {
  color: #fff;
  transform: translateY(-1px);
}

:deep(.ant-menu-item-icon) {
  font-size: 18px;
}

:deep(.ant-menu-title-content) {
  font-size: 14px;
}

.header {
  padding: 0 16px;
}

.main-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%);
}

.main-scroll {
  flex: 1;
  overflow: auto;
  padding: 16px;
  background: linear-gradient(180deg, #f8f9fa 0%, #f0f2f5 100%);
}

.breadcrumb {
  margin: 8px 0 16px;
  font-weight: 500;
}

:deep(.ant-breadcrumb-link) {
  color: #1890ff;
}

.content {
  background: transparent;
  padding: 24px;
  margin: 0;
  min-height: calc(100vh - 130px);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>
