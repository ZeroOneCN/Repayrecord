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
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 1000;
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
  color: #1677ff;
}

.logo-icon {
  width: 24px;
  height: 24px;
}

.logo-text {
  color: #1677ff;
  margin: 0 0 0 8px;
  font-size: 18px;
}

:deep(.ant-menu-horizontal) {
  border-bottom: none;
}

.header {
  padding: 0 16px;
}

.main-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-scroll {
  flex: 1;
  overflow: auto;
  padding: 0 16px 16px;
}

.breadcrumb {
  margin: 12px 0;
}

.content {
  background: #fff;
  padding: 16px;
  margin: 0;
  min-height: 280px;
  border-radius: 6px;
}
</style>
