<template>
  <div class="dashboard">
    <a-row :gutter="16">
      <a-col :span="6">
        <a-card title="总借款" :bordered="false">
          <div class="stat-card">
            <div class="stat-value">¥{{ Number(totalDebt).toFixed(2) }}</div>
            <div class="stat-label">当前总欠款</div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card title="已还款" :bordered="false">
          <div class="stat-card">
            <div class="stat-value">¥{{ Number(totalPaid).toFixed(2) }}</div>
            <div class="stat-label">累计已还款</div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card title="待还款" :bordered="false">
          <div class="stat-card">
            <div class="stat-value">¥{{ Number(totalUnpaid).toFixed(2) }}</div>
            <div class="stat-label">待还款金额</div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card title="总利息" :bordered="false">
          <div class="stat-card">
            <div class="stat-value">¥{{ Number(totalInterest).toFixed(2) }}</div>
            <div class="stat-label">累计总利息</div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-divider />

    <a-row :gutter="16">
      <a-col :span="12">
        <a-card title="即将到期账单" :bordered="false">
          <a-list
            :data-source="upcomingBills"
            :loading="loading"
            item-layout="horizontal"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta
                  :title="item.platform_name"
                  :description="`到期日: ${formatDate(item.due_date)} | 金额: ¥${Number(item.amount).toFixed(2)}`"
                />
                <template #actions>
                  <a-button type="primary" size="small" @click="markAsPaid(item)">
                    标记还款
                  </a-button>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
      
      <a-col :span="12">
        <a-card title="平台借款分布" :bordered="false">
          <div ref="platformPieRef" class="pie-container"></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { billAPI, debtPlatformAPI, repaymentAPI } from '@/services/api';
import dayjs from 'dayjs';
import { getPreferences } from '@/services/preferences';
import * as echarts from 'echarts';
import { formatDate } from '@/services/format';

const loading = ref(false);
const upcomingBills = ref([]);
const platformStats = ref([]);
const platformPieRef = ref(null);
let platformPieInstance = null;
const totalDebt = ref(0);
const totalPaid = ref(0);
const totalUnpaid = ref(0);
const totalInterest = ref(0);

const loadDashboardData = async () => {
  try {
    loading.value = true;
    
    // 获取即将到期账单
    const billsResponse = await billAPI.getUpcoming(7);
    upcomingBills.value = billsResponse;
    
    // 获取平台统计
    const statsResponse = await debtPlatformAPI.getStats();
    platformStats.value = statsResponse;
    
    // 计算总金额
    totalDebt.value = statsResponse.reduce((sum, item) => sum + parseFloat(item.total_unpaid) + parseFloat(item.total_paid), 0);
    totalPaid.value = statsResponse.reduce((sum, item) => sum + parseFloat(item.total_paid), 0);
    totalUnpaid.value = statsResponse.reduce((sum, item) => sum + parseFloat(item.total_unpaid), 0);
    totalInterest.value = statsResponse.reduce((sum, item) => sum + parseFloat(item.total_paid_interest || 0) + parseFloat(item.total_unpaid_interest || 0), 0);
    
  } catch (error) {
    console.error('加载仪表盘数据失败:', error);
    message.error('加载数据失败');
  } finally {
    loading.value = false;
  }
  renderPlatformPie();
};

const markAsPaid = async (bill) => {
  try {
    await billAPI.markAsPaid(bill.id);
    try {
      const prefs = getPreferences();
      if (prefs.autoRepaymentOnMarkPaid) {
        await repaymentAPI.create({
          bill_id: bill.id,
          amount: bill.amount,
          repayment_date: dayjs().format('YYYY-MM-DD'),
          notes: '自动记录：账单标记为已还'
        });
      }
    } catch (_) {}
    message.success('标记还款成功');
    loadDashboardData(); // 重新加载数据
  } catch (error) {
    console.error('标记还款失败:', error);
    message.error('标记还款失败');
  }
};

onMounted(() => {
  if (platformPieRef.value) {
    platformPieInstance = echarts.init(platformPieRef.value);
  }
  loadDashboardData();
});

const renderPlatformPie = () => {
  if (!platformPieInstance) return;
  const stats = platformStats.value || [];
  const unpaidSum = stats.reduce((s, it) => s + parseFloat(it.total_unpaid || 0), 0);
  const data = stats.map(item => ({
    name: item.name,
    value: unpaidSum <= 0
      ? (parseFloat(item.total_unpaid || 0) + parseFloat(item.total_paid || 0))
      : parseFloat(item.total_unpaid || 0)
  })).filter(d => d.value > 0);
  const option = {
    tooltip: { 
      trigger: 'item', 
      formatter: ({ name, value, percent }) => 
        `<div style="padding: 8px 12px; font-weight: 500;">${name}</div>
         <div style="padding: 4px 12px;">¥${Number(value).toFixed(2)}</div>
         <div style="padding: 4px 12px; color: #667eea;">${percent}%</div>`,
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: 'rgba(102, 126, 234, 0.15)',
      borderWidth: 1,
      textStyle: { color: '#2d3748' },
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;'
    },
    legend: { 
      type: 'scroll', 
      bottom: 0,
      textStyle: { color: '#5a6c7d' },
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 12
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '75%'],
        avoidLabelOverlap: true,
        itemStyle: { 
          borderRadius: 8, 
          borderColor: '#fff', 
          borderWidth: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.1)'
        },
        label: {
          show: true,
          formatter: (params) => 
            `{name|${params.name}}\n{value|¥${Number(params.value).toFixed(2)}}`,
          rich: {
            name: {
              fontSize: 13,
              color: '#5a6c7d',
              lineHeight: 18,
              fontWeight: 500
            },
            value: {
              fontSize: 14,
              color: '#667eea',
              lineHeight: 20,
              fontWeight: 600
            }
          }
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 15,
            fontWeight: 600
          },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.15)'
          }
        },
        data
      }
    ]
  };
  platformPieInstance.setOption(option);
};

</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  text-align: center;
  padding: 24px 0;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12px;
  text-shadow: none;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #8d96a0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pie-container {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.ant-card) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

:deep(.ant-card:hover) {
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.15);
  transform: translateY(-2px);
}

:deep(.ant-card-head) {
  font-weight: 600;
  font-size: 16px;
  border-bottom: 2px solid #f0f5ff;
}

:deep(.ant-list-item) {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.ant-list-item:last-child) {
  border-bottom: none;
}

:deep(.ant-list-item-meta-title) {
  font-weight: 600;
  color: #1890ff;
}

:deep(.ant-list-item-meta-description) {
  color: #666;
  font-size: 13px;
}
</style>
