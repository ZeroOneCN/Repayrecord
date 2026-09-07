<template>
  <AppLayout>
    <div class="page-shell">
      <section class="page-header">
        <div class="page-header-main">
          <span class="page-icon-badge">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M4 12L10 6L14 10L20 4" />
              <path d="M20 10V4H14" />
              <path d="M4 20H20" />
            </svg>
          </span>
          <div>
            <p class="page-kicker">Overview</p>
            <h1 class="page-title">数据概览</h1>
            <p class="page-description">
              快速查看总体负债、已还与待还规模，以及最近即将到期的账单。图表改为按需加载，首屏启动更轻更快。
            </p>
          </div>
        </div>
      </section>

      <section class="metric-grid dashboard-metric-grid">
        <article class="metric-card dashboard-metric-card dashboard-metric-card-debt">
          <div class="metric-card-head">
            <span class="metric-card-label">总借款</span>
            <span class="metric-icon metric-icon-info">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </span>
          </div>
          <p class="metric-card-value dashboard-metric-value">¥{{ Number(totalDebt).toFixed(2) }}</p>
          <span class="metric-card-note">当前所有平台账单合计</span>
        </article>

        <article class="metric-card dashboard-metric-card dashboard-metric-card-paid">
          <div class="metric-card-head">
            <span class="metric-card-label">已还款</span>
            <span class="metric-icon metric-icon-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
            </span>
          </div>
          <p class="metric-card-value dashboard-metric-value">¥{{ Number(totalPaid).toFixed(2) }}</p>
          <span class="metric-card-note">历史已完成还款总额</span>
        </article>

        <article class="metric-card dashboard-metric-card dashboard-metric-card-unpaid">
          <div class="metric-card-head">
            <span class="metric-card-label">待还款</span>
            <span class="metric-icon metric-icon-warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
            </span>
          </div>
          <p class="metric-card-value dashboard-metric-value">¥{{ Number(totalUnpaid).toFixed(2) }}</p>
          <span class="metric-card-note">仍需关注的未结清账单</span>
        </article>

        <article class="metric-card dashboard-metric-card dashboard-metric-card-interest">
          <div class="metric-card-head">
            <span class="metric-card-label">总利息</span>
            <span class="metric-icon metric-icon-danger">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
                <polyline points="17,6 23,6 23,12" />
              </svg>
            </span>
          </div>
          <p class="metric-card-value dashboard-metric-value">¥{{ Number(totalInterest).toFixed(2) }}</p>
          <span class="metric-card-note">累计利息支出总额</span>
        </article>
      </section>

      <section class="dashboard-grid">
        <article class="surface-card panel-card">
          <div class="panel-head">
            <div>
              <h2>即将到期账单</h2>
              <p>默认展示未来 7 天内仍未结清的账单，方便优先处理。</p>
            </div>
          </div>

          <div v-if="upcomingBills.length" class="bill-list">
            <div v-for="item in upcomingBills" :key="item.id" class="bill-item">
              <div class="bill-item-copy">
                <div class="bill-item-title">{{ item.platform_name }}</div>
                <div class="bill-item-meta">
                  <span>到期日 {{ formatDate(item.due_date) }}</span>
                  <strong>¥{{ Number(item.amount || 0).toFixed(2) }}</strong>
                </div>
              </div>
              <button class="theme-btn theme-btn-success" @click="markAsPaid(item)">标记还款</button>
            </div>
          </div>

          <div v-else class="empty-state">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p class="empty-title">暂无即将到期账单</p>
            <p class="empty-description">当前 7 天内没有待处理的账单，继续保持。</p>
          </div>
        </article>

        <article class="surface-card panel-card">
          <div class="panel-head">
            <div>
              <h2>平台借款分布</h2>
              <p>默认优先展示未还部分，若都已结清则退回展示历史总额。</p>
            </div>
          </div>
          <div ref="platformPieRef" class="chart-container dashboard-chart"></div>
        </article>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { debtPlatformAPI, billAPI } from '@/services/api'
import { platformPieColors } from '@/services/chartPalette'
import { settleBillWithAutoRepayment } from '@/services/repaymentFlow'
import { formatDate } from '@/services/format'
import AppLayout from '@/components/Layout/AppLayout.vue'

const loading = ref(false)
const upcomingBills = ref([])
const platformStats = ref([])
const platformPieRef = ref(null)
const totalDebt = ref(0)
const totalPaid = ref(0)
const totalUnpaid = ref(0)
const totalInterest = ref(0)

let echartsLib = null
let platformPieInstance = null

const ensureChartLibrary = async () => {
  if (!echartsLib) {
    const module = await import('@/services/echarts-pie')
    echartsLib = module.default || module.echarts
  }
  return echartsLib
}

const renderPlatformPie = async () => {
  if (!platformPieRef.value) return

  const echarts = await ensureChartLibrary()
  if (!platformPieInstance) {
    platformPieInstance = echarts.init(platformPieRef.value)
  }

  const stats = platformStats.value || []
  const unpaidSum = stats.reduce((sum, item) => sum + Number(item.total_unpaid || 0), 0)
  const data = stats
    .map((item) => ({
      name: item.name,
      value: unpaidSum <= 0
        ? Number(item.total_unpaid || 0) + Number(item.total_paid || 0)
        : Number(item.total_unpaid || 0)
    }))
    .filter((item) => item.value > 0)

  platformPieInstance.setOption(
    {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderColor: '#dfe9e2',
        borderWidth: 1,
        textStyle: { color: '#173025', fontSize: 13 },
        padding: [12, 16],
        extraCssText: 'box-shadow: 0 12px 26px rgba(21,45,33,0.10); border-radius: 16px;'
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        left: 'center',
        textStyle: { color: '#6c8578', fontSize: 12 },
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 12,
        padding: [18, 0, 0, 0]
      },
      color: platformPieColors,
      series: [
        {
          type: 'pie',
          radius: ['34%', '62%'],
          center: ['50%', '44%'],
          itemStyle: {
            borderRadius: 10,
            borderColor: '#ffffff',
            borderWidth: 3
          },
          label: {
            show: true,
            fontSize: 12,
            formatter: (params) => `${params.name}\n¥${Number(params.value).toFixed(2)}`
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 22,
              shadowOffsetX: 0,
              shadowColor: 'rgba(21,45,33,0.18)'
            }
          },
          data
        }
      ]
    },
    true
  )
}

const loadDashboardData = async () => {
  try {
    loading.value = true
    const [billsResponse, statsResponse] = await Promise.all([
      billAPI.getUpcoming(7),
      debtPlatformAPI.getStats()
    ])

    upcomingBills.value = billsResponse || []
    platformStats.value = statsResponse || []

    totalDebt.value = platformStats.value.reduce(
      (sum, item) => sum + Number(item.total_unpaid || 0) + Number(item.total_paid || 0),
      0
    )
    totalPaid.value = platformStats.value.reduce((sum, item) => sum + Number(item.total_paid || 0), 0)
    totalUnpaid.value = platformStats.value.reduce((sum, item) => sum + Number(item.total_unpaid || 0), 0)
    totalInterest.value = platformStats.value.reduce(
      (sum, item) => sum + Number(item.total_paid_interest || 0) + Number(item.total_unpaid_interest || 0),
      0
    )

    await renderPlatformPie()
  } catch (error) {
    console.error('加载数据概览失败:', error)
    window.$message?.error('加载数据概览失败')
  } finally {
    loading.value = false
  }
}

const markAsPaid = async (bill) => {
  try {
    const result = await settleBillWithAutoRepayment(bill)
    if (result.autoRepaymentError) {
      window.$message?.warning('账单已标记为已还，但自动还款流水创建失败，请到还款记录页补录')
    } else {
      window.$message?.success('账单已标记为已还')
    }
    await loadDashboardData()
  } catch (error) {
    console.error('标记还款失败:', error)
    window.$message?.error('标记还款失败')
  }
}

const handleResize = () => {
  platformPieInstance?.resize()
}

onMounted(async () => {
  await loadDashboardData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  platformPieInstance?.dispose()
  platformPieInstance = null
})
</script>

<style scoped>
.dashboard-metric-grid {
  gap: 18px;
}

.dashboard-metric-card {
  position: relative;
  overflow: hidden;
  border-width: 0;
  box-shadow: 0 24px 46px rgba(21, 45, 33, 0.08);
}

.dashboard-metric-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.72), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.3), transparent 78%);
  pointer-events: none;
}

.dashboard-metric-card .metric-card-head,
.dashboard-metric-card .metric-card-value,
.dashboard-metric-card .metric-card-note {
  position: relative;
  z-index: 1;
}

.dashboard-metric-card .metric-card-label {
  color: rgba(23, 48, 37, 0.78);
}

.dashboard-metric-card .metric-card-note {
  color: rgba(23, 48, 37, 0.68);
}

.dashboard-metric-value {
  text-shadow: 0 10px 22px rgba(255, 255, 255, 0.28);
}

.dashboard-metric-card-debt {
  background: linear-gradient(135deg, #d8faf0 0%, #bdf3ea 52%, #8de2d6 100%);
}

.dashboard-metric-card-debt .dashboard-metric-value {
  color: #0f766e;
}

.dashboard-metric-card-paid {
  background: linear-gradient(135deg, #e5fdd7 0%, #c9f6b0 48%, #95e17f 100%);
}

.dashboard-metric-card-paid .dashboard-metric-value {
  color: #2f7a16;
}

.dashboard-metric-card-unpaid {
  background: linear-gradient(135deg, #fff3cf 0%, #ffe1a5 50%, #f8bb6e 100%);
}

.dashboard-metric-card-unpaid .dashboard-metric-value {
  color: #b45309;
}

.dashboard-metric-card-interest {
  background: linear-gradient(135deg, #ffe1d9 0%, #ffc0ae 48%, #ff8a72 100%);
}

.dashboard-metric-card-interest .dashboard-metric-value {
  color: #c2410c;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 0.95fr 1.15fr;
  gap: 18px;
}

.panel-card {
  padding: 22px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.panel-head h2 {
  margin: 0;
  color: var(--text-strong);
  font-size: 1.15rem;
  font-weight: 800;
}

.panel-head p {
  margin: 8px 0 0;
  color: var(--text-muted);
  line-height: 1.6;
}

.bill-list {
  display: grid;
  gap: 12px;
}

.bill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid var(--border-soft);
  background: rgba(247, 251, 248, 0.84);
}

.bill-item-title {
  color: var(--text-strong);
  font-size: 1rem;
  font-weight: 800;
}

.bill-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 8px;
  color: var(--text-muted);
}

.bill-item-meta strong {
  color: var(--accent-strong);
  font-size: 1rem;
}

.dashboard-chart {
  min-height: 468px;
}

@media (max-width: 1080px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .bill-item {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
