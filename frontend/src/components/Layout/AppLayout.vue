<template>
  <div class="layout-shell">
    <button
      v-if="isMobile && mobileMenuOpen"
      class="sidebar-overlay"
      type="button"
      aria-label="关闭导航"
      @click="mobileMenuOpen = false"
    />

    <aside
      :class="[
        'sidebar',
        {
          'sidebar-collapsed': isCollapsed && !isMobile,
          'sidebar-open': mobileMenuOpen || !isMobile
        }
      ]"
    >
      <div class="sidebar-header">
        <div class="logo-wrap">
          <div class="logo-mark">
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5C5 8.35786 8.35786 5 12.5 5H19V11.5C19 15.6421 15.6421 19 11.5 19H5V12.5Z"
                stroke="currentColor"
                stroke-width="1.8"
              />
              <path d="M8.5 12H15.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <path d="M8.5 9H14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <path d="M8.5 15H12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </div>
          <div v-show="!isCollapsed || isMobile" class="logo-copy">
            <p class="logo-kicker">Repay Record</p>
            <p class="logo-text">借款与还款台账</p>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <p v-show="!isCollapsed || isMobile" class="nav-section-label">核心功能</p>
        <a
          v-for="item in navItems"
          :key="item.key"
          :href="item.path"
          @click.prevent="navigate(item.path)"
          :class="['nav-item', route.path === item.path ? 'nav-item-active' : '']"
          :title="isCollapsed && !isMobile ? item.label : ''"
        >
          <span class="nav-icon-shell">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
              <component
                :is="shape.tag"
                v-for="(shape, index) in item.icon"
                :key="`${item.key}-${index}`"
                v-bind="shape.attrs"
              />
            </svg>
          </span>
          <span v-show="!isCollapsed || isMobile" class="nav-copy">
            <span class="nav-label">{{ item.label }}</span>
            <span class="nav-desc">{{ item.description }}</span>
          </span>
        </a>
      </nav>

    </aside>

    <div class="main-area">
      <header class="header">
        <div class="header-left">
          <button
            v-if="!isMobile"
            class="header-menu-btn"
            type="button"
            :title="isCollapsed ? '展开侧边栏' : '折叠侧边栏'"
            @click="toggleCollapse"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline :points="isCollapsed ? '9,18 15,12 9,6' : '15,18 9,12 15,6'" />
            </svg>
          </button>
          <button v-if="isMobile" class="header-menu-btn" type="button" @click="mobileMenuOpen = !mobileMenuOpen">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
          <div class="breadcrumb">
            <span class="breadcrumb-kicker">今日视图</span>
            <span class="breadcrumb-current">{{ currentPageName }}</span>
          </div>
        </div>
        <div class="header-right">
          <div class="header-pill">
            <span class="header-pill-dot"></span>
            运行正常
          </div>
          <span class="current-date">{{ currentDate }}</span>
        </div>
      </header>

      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const router = useRouter()
const route = useRoute()
const isCollapsed = ref(localStorage.getItem('repay-record-sidebar') === 'collapsed')
const isMobile = ref(false)
const mobileMenuOpen = ref(false)

const navItems = [
  {
    key: 'dashboard',
    label: '数据概览',
    description: '近期还款与总体负债',
    path: '/dashboard',
    icon: [
      { tag: 'path', attrs: { d: 'M4 12L10 6L14 10L20 4' } },
      { tag: 'path', attrs: { d: 'M20 10V4H14' } },
      { tag: 'path', attrs: { d: 'M4 20H20' } }
    ]
  },
  {
    key: 'platforms',
    label: '借款平台',
    description: '平台账单日与额度',
    path: '/platforms',
    icon: [
      { tag: 'rect', attrs: { x: '4', y: '5', width: '16', height: '14', rx: '3' } },
      { tag: 'path', attrs: { d: 'M7 10H17' } },
      { tag: 'path', attrs: { d: 'M7 14H12' } }
    ]
  },
  {
    key: 'bills',
    label: '账单管理',
    description: '分月维护账单状态',
    path: '/bills',
    icon: [
      { tag: 'path', attrs: { d: 'M8 3H16L20 7V19A2 2 0 0 1 18 21H8A2 2 0 0 1 6 19V5A2 2 0 0 1 8 3Z' } },
      { tag: 'path', attrs: { d: 'M15 3V8H20' } },
      { tag: 'path', attrs: { d: 'M9 13H16' } },
      { tag: 'path', attrs: { d: 'M9 17H14' } }
    ]
  },
  {
    key: 'repayments',
    label: '还款记录',
    description: '流水与利息跟踪',
    path: '/repayments',
    icon: [
      { tag: 'path', attrs: { d: 'M12 3V21' } },
      { tag: 'path', attrs: { d: 'M17 7H10.5A3.5 3.5 0 0 0 10.5 14H13.5A3.5 3.5 0 0 1 13.5 21H7' } }
    ]
  },
  {
    key: 'statistics',
    label: '还款统计',
    description: '趋势与平台分布',
    path: '/statistics',
    icon: [
      { tag: 'path', attrs: { d: 'M5 19V10' } },
      { tag: 'path', attrs: { d: 'M12 19V5' } },
      { tag: 'path', attrs: { d: 'M19 19V13' } }
    ]
  },
  {
    key: 'settings',
    label: '平台设置',
    description: '通知与自动化开关',
    path: '/settings',
    icon: [
      { tag: 'path', attrs: { d: 'M12 8.75A3.25 3.25 0 1 0 12 15.25A3.25 3.25 0 1 0 12 8.75Z' } },
      {
        tag: 'path',
        attrs: {
          d: 'M19 12A7 7 0 0 0 18.88 10.7L21 9.12L19.5 6.52L16.96 7.3A7.02 7.02 0 0 0 14.8 6.08L14.42 3H9.58L9.2 6.08A7.02 7.02 0 0 0 7.04 7.3L4.5 6.52L3 9.12L5.12 10.7A7.27 7.27 0 0 0 5.12 13.3L3 14.88L4.5 17.48L7.04 16.7A7.02 7.02 0 0 0 9.2 17.92L9.58 21H14.42L14.8 17.92A7.02 7.02 0 0 0 16.96 16.7L19.5 17.48L21 14.88L18.88 13.3C18.96 12.87 19 12.44 19 12Z'
        }
      }
    ]
  }
]

const currentPageName = computed(() => {
  const item = navItems.find(item => item.path === route.path)
  return item ? item.label : '未知页面'
})

const currentDate = computed(() => dayjs().format('YYYY 年 MM 月 DD 日 dddd'))

const navigate = (path) => {
  router.push(path)
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const updateViewport = () => {
  isMobile.value = window.innerWidth <= 960
  if (!isMobile.value) {
    mobileMenuOpen.value = false
  }
}

watch(isCollapsed, (value) => {
  localStorage.setItem('repay-record-sidebar', value ? 'collapsed' : 'expanded')
})

watch(() => route.path, () => {
  mobileMenuOpen.value = false
})

onMounted(() => {
  updateViewport()
  window.addEventListener('resize', updateViewport)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewport)
})
</script>

<style scoped>
.layout-shell {
  display: flex;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(187, 247, 208, 0.6), transparent 32%),
    linear-gradient(180deg, #f7fbf8 0%, #eef6f0 100%);
}

.sidebar {
  width: 302px;
  background: rgba(11, 31, 20, 0.94);
  color: rgba(240, 253, 244, 0.88);
  display: flex;
  flex-direction: column;
  box-shadow: 24px 0 54px rgba(9, 19, 13, 0.12);
  transition: width 0.25s ease, transform 0.25s ease;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 40;
}

.sidebar-collapsed {
  width: 92px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 28px 24px 18px;
  flex-shrink: 0;
}

.logo-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.logo-mark {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.26), rgba(187, 247, 208, 0.16));
  color: #bbf7d0;
  flex-shrink: 0;
}

.logo-copy {
  min-width: 0;
}

.logo-icon {
  width: 32px;
  height: 32px;
}

.logo-kicker,
.logo-text {
  margin: 0;
  white-space: nowrap;
}

.logo-kicker {
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(187, 247, 208, 0.74);
}

.logo-text {
  margin-top: 6px;
  font-size: 1rem;
  font-weight: 800;
  color: #f0fdf4;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 18px 20px;
  overflow-y: auto;
}

.nav-section-label {
  margin: 0 10px 14px;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(187, 247, 208, 0.58);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  margin-bottom: 8px;
  border-radius: 18px;
  color: rgba(240, 253, 244, 0.72);
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f0fdf4;
  transform: translateX(2px);
}

.nav-item-active {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.24), rgba(21, 128, 61, 0.22));
  color: #f0fdf4;
  box-shadow: inset 0 0 0 1px rgba(187, 247, 208, 0.12);
}

.nav-icon-shell {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.nav-item-active .nav-icon-shell {
  background: rgba(187, 247, 208, 0.14);
}

.nav-icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.nav-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-label {
  font-size: 0.98rem;
  font-weight: 700;
  color: inherit;
}

.nav-desc {
  font-size: 0.82rem;
  color: rgba(240, 253, 244, 0.56);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: transparent;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  border: none;
  background: rgba(10, 18, 12, 0.36);
  z-index: 30;
}

.header {
  min-height: 84px;
  padding: 22px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(247, 251, 248, 0.78);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(21, 45, 33, 0.06);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-menu-btn {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(21, 45, 33, 0.08);
  background: #fff;
  color: var(--text-strong);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(21, 45, 33, 0.06);
}

.breadcrumb {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.breadcrumb-kicker {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent-strong);
}

.breadcrumb-current {
  color: var(--text-strong);
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.header-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(22, 163, 74, 0.1);
  color: var(--accent-strong);
  font-size: 0.9rem;
  font-weight: 700;
}

.header-pill-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 5px rgba(22, 163, 74, 0.12);
}

.current-date {
  font-size: 0.94rem;
  font-weight: 700;
  color: var(--text-muted);
  white-space: nowrap;
}

.main-content {
  flex: 1;
  overflow: auto;
  padding: 28px 30px 34px;
}

@media (max-width: 960px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    transform: translateX(-102%);
    width: min(302px, calc(100vw - 40px));
  }

  .sidebar-open {
    transform: translateX(0);
  }

  .header {
    padding: 18px 18px;
  }

  .header-right {
    margin-left: auto;
  }

  .main-content {
    padding: 20px 18px 26px;
  }

  .header-pill {
    display: none;
  }
}

@media (max-width: 640px) {
  .breadcrumb-current {
    font-size: 1.15rem;
  }

  .current-date {
    font-size: 0.84rem;
  }
}
</style>
