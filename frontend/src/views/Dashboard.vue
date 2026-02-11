<template>
  <div class="dashboard">
    <a-row :gutter="16">
      <a-col :span="8">
        <a-card title="总借款" :bordered="false">
          <div class="stat-card">
            <div class="stat-value">¥{{ Number(totalDebt).toFixed(2) }}</div>
            <div class="stat-label">当前总欠款</div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="已还款" :bordered="false">
          <div class="stat-card">
            <div class="stat-value">¥{{ Number(totalPaid).toFixed(2) }}</div>
            <div class="stat-label">累计已还款</div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="待还款" :bordered="false">
          <div class="stat-card">
            <div class="stat-value">¥{{ Number(totalUnpaid).toFixed(2) }}</div>
            <div class="stat-label">待还款金额</div>
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
    tooltip: { trigger: 'item', formatter: ({ name, value, percent }) => `${name}: ¥${Number(value).toFixed(2)} (${percent}%)` },
    legend: { type: 'scroll', bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: {
          show: true,
          formatter: (params) => `${params.name}\n¥${Number(params.value).toFixed(2)}`
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
  padding: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px 0;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.pie-container {
  height: 320px;
}
</style>
