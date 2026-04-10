<template>
  <AppLayout>
    <div style="padding: 0;">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">
          <span style="font-size: 28px; margin-right: 12px;">📊</span>
          数据概览
        </h1>
        <p class="page-description">欢迎使用借款还款管理平台，实时掌握您的借款状况</p>
      </div>

      <!-- 统计卡片 -->
      <div class="stat-grid" style="margin-bottom: 24px;">
        <!-- 总借款 -->
        <div class="stat-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <span class="stat-label">总借款</span>
            <div class="stat-icon stat-icon-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
          </div>
          <div class="stat-value stat-value-primary">¥{{ Number(totalDebt).toFixed(2) }}</div>
          <div class="stat-desc">当前总欠款</div>
        </div>

        <!-- 已还款 -->
        <div class="stat-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <span class="stat-label">已还款</span>
            <div class="stat-icon stat-icon-success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
            </div>
          </div>
          <div class="stat-value stat-value-success">¥{{ Number(totalPaid).toFixed(2) }}</div>
          <div class="stat-desc">累计已还款</div>
        </div>

        <!-- 待还款 -->
        <div class="stat-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <span class="stat-label">待还款</span>
            <div class="stat-icon stat-icon-warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
            </div>
          </div>
          <div class="stat-value stat-value-warning">¥{{ Number(totalUnpaid).toFixed(2) }}</div>
          <div class="stat-desc">待还款金额</div>
        </div>

        <!-- 总利息 -->
        <div class="stat-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <span class="stat-label">总利息</span>
            <div class="stat-icon stat-icon-error">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
                <polyline points="17,6 23,6 23,12" />
              </svg>
            </div>
          </div>
          <div class="stat-value stat-value-error">¥{{ Number(totalInterest).toFixed(2) }}</div>
          <div class="stat-desc">累计总利息</div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="chart-grid" style="margin-bottom: 24px;">
        <!-- 即将到期账单 -->
        <div class="card">
          <h3 class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            即将到期账单
          </h3>
          <div v-if="upcomingBills.length > 0" class="bill-list">
            <div v-for="item in upcomingBills" :key="item.id" class="bill-item">
              <div class="bill-info">
                <div class="bill-platform">{{ item.platform_name }}</div>
                <div class="bill-detail">
                  <span class="bill-date">到期日：{{ formatDate(item.due_date) }}</span>
                  <span class="bill-amount">¥{{ Number(item.amount).toFixed(2) }}</span>
                </div>
              </div>
              <button class="btn btn-sm btn-success" @click="markAsPaid(item)">标记还款</button>
            </div>
          </div>
          <div v-else class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p class="empty-text">暂无即将到期账单</p>
          </div>
        </div>

        <!-- 平台借款分布 -->
        <div class="card card-large">
          <h3 class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
            平台借款分布
          </h3>
          <div ref="platformPieRef" class="chart-container chart-container-large"></div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { billAPI, debtPlatformAPI, repaymentAPI } from '@/services/api'
import dayjs from 'dayjs'
import { getPreferences } from '@/services/preferences'
import * as echarts from 'echarts'
import { formatDate } from '@/services/format'
import AppLayout from '@/components/Layout/AppLayout.vue'

const loading = ref(false)
const upcomingBills = ref([])
const platformStats = ref([])
const platformPieRef = ref(null)
let platformPieInstance = null
const totalDebt = ref(0)
const totalPaid = ref(0)
const totalUnpaid = ref(0)
const totalInterest = ref(0)

const loadDashboardData = async () => {
  try {
    loading.value = true

    const billsResponse = await billAPI.getUpcoming(7)
    upcomingBills.value = billsResponse

    const statsResponse = await debtPlatformAPI.getStats()
    platformStats.value = statsResponse

    totalDebt.value = statsResponse.reduce((sum, item) => sum + parseFloat(item.total_unpaid) + parseFloat(item.total_paid), 0)
    totalPaid.value = statsResponse.reduce((sum, item) => sum + parseFloat(item.total_paid), 0)
    totalUnpaid.value = statsResponse.reduce((sum, item) => sum + parseFloat(item.total_unpaid), 0)
    totalInterest.value = statsResponse.reduce((sum, item) => sum + parseFloat(item.total_paid_interest || 0) + parseFloat(item.total_unpaid_interest || 0), 0)

  } catch (error) {
    console.error('加载数据概览数据失败:', error)
    alert('加载数据失败')
  } finally {
    loading.value = false
  }
  renderPlatformPie()
}

const markAsPaid = async (bill) => {
  try {
    await billAPI.markAsPaid(bill.id)
    try {
      const prefs = getPreferences()
      if (prefs.autoRepaymentOnMarkPaid) {
        await repaymentAPI.create({
          bill_id: bill.id,
          amount: bill.amount,
          repayment_date: dayjs().format('YYYY-MM-DD'),
          notes: '自动记录：账单标记为已还'
        })
      }
    } catch (_) {}
    alert('标记还款成功')
    loadDashboardData()
  } catch (error) {
    console.error('标记还款失败:', error)
    alert('标记还款失败')
  }
}

onMounted(() => {
  if (platformPieRef.value) {
    platformPieInstance = echarts.init(platformPieRef.value)
  }
  loadDashboardData()
  
  window.addEventListener('resize', () => {
    platformPieInstance?.resize()
  })
})

const renderPlatformPie = () => {
  if (!platformPieInstance) return
  const stats = platformStats.value || []
  const unpaidSum = stats.reduce((s, it) => s + parseFloat(it.total_unpaid || 0), 0)
  const data = stats.map(item => ({
    name: item.name,
    value: unpaidSum <= 0
      ? (parseFloat(item.total_unpaid || 0) + parseFloat(item.total_paid || 0))
      : parseFloat(item.total_unpaid || 0)
  })).filter(d => d.value > 0)
  
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: { color: '#141414', fontSize: 13 },
      padding: [12, 16],
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;'
    },
    legend: {
      type: 'scroll',
      bottom: 10,
      left: 'center',
      textStyle: { color: '#595959', fontSize: 12 },
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10
    },
    color: ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#f5222d'],
    series: [{
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['50%', '55%'],
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        fontSize: 12,
        formatter: (params) => `{name|${params.name}}\n{value|¥${Number(params.value).toFixed(2)}}`,
        rich: {
          name: { fontSize: 12, color: '#595959', lineHeight: 18 },
          value: { fontSize: 13, color: '#1677ff', lineHeight: 20, fontWeight: 600 }
        }
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 13,
          fontWeight: 600
        },
        itemStyle: {
          shadowBlur: 20,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.15)'
        }
      },
      data
    }]
  }
  platformPieInstance.setOption(option)
}
</script>

<style scoped>
/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #141414;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
}

.page-description {
  font-size: 15px;
  color: #8c8c8c;
  margin: 0;
}

/* 统计卡片 */
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-primary { background: linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%); color: #1677ff; }
.stat-icon-success { background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%); color: #52c41a; }
.stat-icon-warning { background: linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%); color: #faad14; }
.stat-icon-error { background: linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%); color: #ff4d4f; }

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin: 12px 0;
  letter-spacing: -0.5px;
}

.stat-value-primary { color: #1677ff; }
.stat-value-success { color: #52c41a; }
.stat-value-warning { color: #faad14; }
.stat-value-error { color: #ff4d4f; }

.stat-desc {
  font-size: 13px;
  color: #8c8c8c;
}

/* 卡片 */
.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

.card-large {
  padding: 24px;
}

.card-title {
  font-size: 17px;
  font-weight: 600;
  color: #141414;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
}

/* 账单列表 */
.bill-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bill-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s;
  gap: 16px;
}

.bill-item:hover {
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.15);
}

.bill-info {
  flex: 1;
  min-width: 0;
}

.bill-platform {
  font-size: 15px;
  font-weight: 600;
  color: #141414;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bill-detail {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  font-size: 13px;
  color: #8c8c8c;
}

.bill-date {
  white-space: nowrap;
}

.bill-amount {
  font-size: 20px;
  font-weight: 700;
  color: #1677ff;
  white-space: nowrap;
  letter-spacing: -0.5px;
}

/* 按钮 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-sm {
  padding: 7px 14px;
  font-size: 13px;
}

.btn-success {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(82, 196, 26, 0.3);
}

.btn-success:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: #8c8c8c;
}

.empty-icon {
  opacity: 0.3;
  margin: 0 auto 16px;
}

.empty-text {
  font-size: 15px;
  margin: 0;
}

/* 图表容器 */
.chart-container {
  width: 100%;
  height: 300px;
}

.chart-container-large {
  height: 420px;
}

/* 网格布局 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 16px;
}

@media (max-width: 1200px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
