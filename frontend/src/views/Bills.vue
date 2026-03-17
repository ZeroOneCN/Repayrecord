<template>
  <div class="bills">
    <a-card title="账单管理">
      <template #extra>
        <a-space>
          <a-select 
            v-model:value="filters.platform_id" 
            placeholder="筛选平台" 
            style="width: 120px"
            :options="platformOptions"
            allow-clear
          />
          <a-select 
            v-model:value="filters.is_paid" 
            placeholder="还款状态" 
            style="width: 120px"
            :options="[
              { value: 'true', label: '已还款' },
              { value: 'false', label: '未还款' }
            ]"
            allow-clear
          />
          <a-date-picker 
            v-model:value="filters.billing_month" 
            placeholder="选择月份" 
            format="YYYY-MM"
            picker="month"
          />
          <a-button type="primary" @click="showModal">
            添加账单
          </a-button>
        </a-space>
      </template>
      
      <a-skeleton :loading="loading" active :paragraph="{ rows: 6 }">
        <a-table
          :columns="columns"
          :data-source="bills"
          :loading="loading"
          :pagination="tablePagination"
          :locale="tableLocale"
          row-key="id"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'amount'">
              ¥{{ parseFloat(record.amount || 0).toFixed(2) }}
            </template>
            <template v-if="column.key === 'interest'">
              ¥{{ parseFloat(record.interest || 0).toFixed(2) }}
            </template>
            <template v-if="column.key === 'due_date'">
              {{ formatDate(record.due_date) }}
            </template>
            
            <template v-if="column.key === 'is_paid'">
              <a-tag :color="record.is_paid ? 'green' : 'red'">
                {{ record.is_paid ? '已还款' : '未还款' }}
              </a-tag>
            </template>
            
            <template v-if="column.key === 'action'">
              <a-space>
                <a-button 
                  v-if="!record.is_paid" 
                  size="small" 
                  type="primary" 
                  @click="markAsPaid(record)"
                >
                  标记还款
                </a-button>
                <a-button size="small" @click="editBill(record)">编辑</a-button>
                <a-button size="small" danger @click="deleteBill(record)">删除</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-skeleton>
    </a-card>

    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
      >
        <a-form-item label="选择平台" name="platform_id">
          <a-select
            v-model:value="formState.platform_id"
            placeholder="请选择借款平台"
            :options="platformOptions"
          />
        </a-form-item>
        
        <a-form-item label="账单金额" name="amount">
          <a-input-number
            v-model:value="formState.amount"
            :min="0"
            :precision="2"
            placeholder="请输入金额"
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item label="利息" name="interest">
          <a-input-number
            v-model:value="formState.interest"
            :min="0"
            :precision="2"
            placeholder="请输入利息"
            style="width: 100%"
          />
          <template #extra>
            <span style="font-size: 12px; color: #999;">已计入账单（总金额 = 本金 + 利息）</span>
          </template>
        </a-form-item>
        
        <a-form-item label="账单月份" name="billing_month">
          <a-date-picker
            v-model:value="formState.billing_month"
            format="YYYY-MM"
            placeholder="选择月份"
            style="width: 100%"
            picker="month"
          />
        </a-form-item>
        
        <a-form-item label="还款截止日期" name="due_date">
          <a-date-picker
            v-model:value="formState.due_date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item label="备注" name="notes">
          <a-textarea
            v-model:value="formState.notes"
            placeholder="请输入备注信息"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { message, notification } from 'ant-design-vue';
import { billAPI, debtPlatformAPI, repaymentAPI } from '@/services/api';
import dayjs from 'dayjs';
import { getPreferences } from '@/services/preferences';
import { sendWeComMarkdown, formatBillMarkdownList } from '@/services/notify';
import { formatDate } from '@/services/format';
import { requiredRule, positiveNumberRule, validMonthRule, validDateRule } from '@/services/validators';
import { useRoute, useRouter } from 'vue-router';

const loading = ref(false);
const route = useRoute();
const router = useRouter();
const bills = ref([]);
const platforms = ref([]);
const modalVisible = ref(false);
const editingId = ref(null);
const formRef = ref();
const noticeDateKey = 'repay-record:bills-notice-date';
const stateKey = 'repay-record:bills-state';
const isReady = ref(false);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

const filters = reactive({
  platform_id: undefined,
  billing_month: undefined,
  is_paid: undefined
});

const formState = reactive({
  platform_id: undefined,
  amount: undefined,
  interest: undefined,
  billing_month: undefined,
  due_date: undefined,
  notes: ''
});

const rules = {
  platform_id: [requiredRule('请选择平台')],
  amount: [requiredRule('请输入金额'), positiveNumberRule('金额必须大于 0')],
  billing_month: [requiredRule('请选择月份'), validMonthRule('请选择有效月份')],
  due_date: [requiredRule('请选择还款日期'), validDateRule('请选择有效日期')]
};

const columns = [
  {
    title: '平台',
    dataIndex: 'platform_name',
    key: 'platform_name'
  },
  {
    title: '金额',
    key: 'amount',
    width: 100
  },
  {
    title: '利息',
    key: 'interest',
    width: 100
  },
  {
    title: '账单月份',
    dataIndex: 'billing_month',
    key: 'billing_month'
  },
  {
    title: '还款截止日',
    dataIndex: 'due_date',
    key: 'due_date'
  },
  {
    title: '状态',
    key: 'is_paid',
    width: 100
  },
  {
    title: '操作',
    key: 'action',
    width: 200
  }
];

const platformOptions = computed(() => 
  platforms.value.map(p => ({ value: p.id, label: p.name }))
);

const tablePagination = computed(() => ({
  current: pagination.current,
  pageSize: pagination.pageSize,
  total: pagination.total,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showTotal: (total) => `共 ${total} 条`
}));
const tableLocale = computed(() => ({
  emptyText: loading.value ? '加载中...' : '暂无账单'
}));

const modalTitle = computed(() => editingId.value ? '编辑账单' : '添加账单');

const loadBills = async () => {
  try {
    loading.value = true;
    const params = {
      page: pagination.current,
      page_size: pagination.pageSize
    };
    
    if (filters.platform_id) params.platform_id = filters.platform_id;
    if (filters.billing_month) params.billing_month = dayjs(filters.billing_month).format('YYYY-MM');
    if (filters.is_paid !== undefined) params.is_paid = filters.is_paid;
    
    const response = await billAPI.getAll(params);
    if (response?.items && Array.isArray(response.items)) {
      bills.value = response.items;
      pagination.total = response.total || 0;
      pagination.current = response.page || pagination.current;
      pagination.pageSize = response.pageSize || pagination.pageSize;
    } else {
      bills.value = response;
      pagination.total = Array.isArray(response) ? response.length : 0;
    }
    checkUpcomingDueDates();
  } catch (error) {
    console.error('加载账单数据失败:', error);
    message.error('加载数据失败');
  } finally {
    loading.value = false;
  }
};

const loadPlatforms = async () => {
  try {
    const response = await debtPlatformAPI.getAll();
    platforms.value = response;
  } catch (error) {
    console.error('加载平台数据失败:', error);
  }
};

// 根据所选平台与月份自动设置还款截止日
const autoSetDueDate = () => {
  try {
    const pid = formState.platform_id;
    const monthVal = formState.billing_month;
    if (!pid || !monthVal) return;
    const platform = platforms.value.find(p => p.id === pid);
    if (!platform || !platform.repayment_day) return;
    const yymm = dayjs(monthVal);
    const daysInMonth = yymm.daysInMonth();
    const day = Math.min(parseInt(platform.repayment_day, 10), daysInMonth);
    formState.due_date = yymm.date(day);
  } catch (_) {}
};

watch(() => formState.platform_id, () => autoSetDueDate());
watch(() => formState.billing_month, () => autoSetDueDate());

const showModal = () => {
  editingId.value = null;
  Object.assign(formState, {
    platform_id: undefined,
    amount: undefined,
    interest: undefined,
    billing_month: undefined,
    due_date: undefined,
    notes: ''
  });
  modalVisible.value = true;
};

const editBill = (record) => {
  editingId.value = record.id;
  Object.assign(formState, {
    platform_id: record.platform_id,
    amount: record.amount,
    interest: record.interest,
    billing_month: dayjs(record.billing_month + '-01'),
    due_date: dayjs(record.due_date),
    notes: record.notes || ''
  });
  modalVisible.value = true;
  // 确保切换平台或月份时自动更新截止日
};

const handleOk = async () => {
  try {
    await formRef.value.validate();
    
    const submitData = {
      platform_id: formState.platform_id,
      amount: formState.amount,
      interest: formState.interest,
      billing_month: dayjs(formState.billing_month).format('YYYY-MM'),
      due_date: dayjs(formState.due_date).format('YYYY-MM-DD'),
      notes: formState.notes
    };
    
    if (editingId.value) {
      await billAPI.update(editingId.value, submitData);
      message.success('账单更新成功');
    } else {
      await billAPI.create(submitData);
      message.success('账单创建成功');
    }
    
    modalVisible.value = false;
    loadBills();
  } catch (error) {
    console.error('操作失败:', error);
    message.error('操作失败');
  }
};

const handleCancel = () => {
  modalVisible.value = false;
};

const handleTableChange = (pag) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || pagination.pageSize;
  syncQuery();
  loadBills();
};

const syncQuery = () => {
  const query = {};
  if (pagination.current && pagination.current !== 1) query.page = String(pagination.current);
  if (pagination.pageSize && pagination.pageSize !== 10) query.page_size = String(pagination.pageSize);
  if (filters.platform_id) query.platform_id = String(filters.platform_id);
  if (filters.is_paid !== undefined) query.is_paid = String(filters.is_paid);
  if (filters.billing_month) query.billing_month = dayjs(filters.billing_month).format('YYYY-MM');
  router.replace({ query });
  saveState();
};

const initFromQuery = () => {
  const { page, page_size, platform_id, billing_month, is_paid } = route.query;
  const hasQuery = [page, page_size, platform_id, billing_month, is_paid].some(v => v !== undefined);
  if (!hasQuery) {
    restoreState();
    return;
  }
  const parsedPage = parseInt(page, 10);
  const parsedSize = parseInt(page_size, 10);
  if (Number.isInteger(parsedPage) && parsedPage > 0) pagination.current = parsedPage;
  if (Number.isInteger(parsedSize) && parsedSize > 0) pagination.pageSize = parsedSize;
  if (platform_id) filters.platform_id = parseInt(platform_id, 10);
  if (billing_month) filters.billing_month = dayjs(billing_month);
  if (is_paid === 'true' || is_paid === 'false') filters.is_paid = is_paid;
};

const saveState = () => {
  const payload = {
    pagination: {
      current: pagination.current,
      pageSize: pagination.pageSize
    },
    filters: {
      platform_id: filters.platform_id ?? null,
      billing_month: filters.billing_month ? dayjs(filters.billing_month).format('YYYY-MM') : null,
      is_paid: filters.is_paid ?? null
    }
  };
  try {
    localStorage.setItem(stateKey, JSON.stringify(payload));
  } catch (_) {}
};

const restoreState = () => {
  try {
    const raw = localStorage.getItem(stateKey);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const savedPagination = parsed?.pagination || {};
    const savedFilters = parsed?.filters || {};
    if (Number.isInteger(savedPagination.current) && savedPagination.current > 0) {
      pagination.current = savedPagination.current;
    }
    if (Number.isInteger(savedPagination.pageSize) && savedPagination.pageSize > 0) {
      pagination.pageSize = savedPagination.pageSize;
    }
    if (savedFilters.platform_id) filters.platform_id = parseInt(savedFilters.platform_id, 10);
    if (savedFilters.billing_month) filters.billing_month = dayjs(savedFilters.billing_month);
    if (savedFilters.is_paid === 'true' || savedFilters.is_paid === 'false') filters.is_paid = savedFilters.is_paid;
    return true;
  } catch (_) {
    return false;
  }
};

const markAsPaid = async (record) => {
  try {
    await billAPI.markAsPaid(record.id);
    try {
      const prefs = getPreferences();
      if (prefs.autoRepaymentOnMarkPaid) {
        await repaymentAPI.create({
          bill_id: record.id,
          amount: record.amount,
          repayment_date: dayjs().format('YYYY-MM-DD'),
          notes: '自动记录：账单标记为已还'
        });
      }
    } catch (_) {}
    message.success('标记还款成功');
    loadBills();
  } catch (error) {
    console.error('标记还款失败:', error);
    message.error('标记还款失败');
  }
};

const deleteBill = async (record) => {
  try {
    await billAPI.delete(record.id);
    message.success('删除成功');
    loadBills();
  } catch (error) {
    console.error('删除失败:', error);
    message.error('删除失败');
  }
};

onMounted(() => {
  initFromQuery();
  loadPlatforms();
  loadBills();
  isReady.value = true;
});

// 监听筛选条件变化
watch(filters, () => {
  if (!isReady.value) return;
  pagination.current = 1;
  syncQuery();
  loadBills();
}, { deep: true });

// 到期提醒通知（根据设置：提前天数与开关）
const checkUpcomingDueDates = () => {
  try {
    const prefs = getPreferences();
    if (!prefs.notificationsEnabled) return;
    const frequency = prefs.notificationFrequency || 'daily';
    const today = dayjs().format('YYYY-MM-DD');
    const lastNotifiedDate = localStorage.getItem(noticeDateKey);
    if (frequency === 'daily' && lastNotifiedDate === today) return;
    const upcomingDays = prefs.upcomingDays ?? 3;
    const summaryPromise = billAPI.getAlerts(upcomingDays);

    summaryPromise.then((data) => {
      const overdue = data?.overdue || { count: 0, total_amount: 0, items: [] };
      const upcoming = data?.upcoming || { count: 0, total_amount: 0, items: [] };

      let notified = false;

      if (prefs.overdueEnabled && overdue.count > 0) {
        notification.error({
          message: '逾期提醒',
          description: `有 ${overdue.count} 条账单已逾期，请尽快处理。`
        });
        notified = true;
        const sumOver = parseFloat(overdue.total_amount || 0);
        if (prefs.wechatEnabled && prefs.wechatWebhookUrl) {
          const md = [
            `> <font color="warning">【逾期提醒】共有 ${overdue.count} 条账单逾期，合计 ¥${sumOver.toFixed(2)}</font>`,
            formatBillMarkdownList(overdue.items.map(b => ({ ...b, due_date: formatDate(b.due_date) })))
          ].join('\n');
          sendWeComMarkdown(prefs.wechatWebhookUrl, md).catch(() => {});
        }
      }

      if (upcoming.count > 0) {
        notification.warning({
          message: '到期提醒',
          description: `有 ${upcoming.count} 条账单将在 ${upcomingDays} 天内到期。`
        });
        notified = true;
        const sumUp = parseFloat(upcoming.total_amount || 0);
        if (prefs.wechatEnabled && prefs.wechatWebhookUrl) {
          const md = [
            `> <font color="comment">【到期提醒】${upcomingDays} 天内到期账单 ${upcoming.count} 条，合计 ¥${sumUp.toFixed(2)}</font>`,
            formatBillMarkdownList(upcoming.items.map(b => ({ ...b, due_date: formatDate(b.due_date) })))
          ].join('\n');
          sendWeComMarkdown(prefs.wechatWebhookUrl, md).catch(() => {});
        }
      }

      if (notified && frequency === 'daily') {
        localStorage.setItem(noticeDateKey, today);
      }
    }).catch(() => {});
  } catch (e) {
    // 静默失败，避免影响主流程
  }
};

</script>

<style scoped>
.bills {
  padding: 20px;
}
</style>
