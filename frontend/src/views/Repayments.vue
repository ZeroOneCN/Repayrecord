<template>
  <div class="repayments">
    <a-card title="还款记录管理">
      <template #extra>
        <a-space wrap>
          <a-select 
            v-model:value="filters.platform_id" 
            placeholder="筛选平台" 
            style="width: 160px"
            :options="platformOptions"
            allow-clear
          />
          <a-range-picker
            v-model:value="filters.date_range"
            format="YYYY-MM-DD"
            style="min-width: 240px"
          />
          <a-button type="primary" @click="showModal">
            添加还款记录
          </a-button>
        </a-space>
      </template>
      
      <a-skeleton :loading="loading" active :paragraph="{ rows: 6 }">
        <a-table
          :columns="columns"
          :data-source="repayments"
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
            <template v-if="column.key === 'repayment_date'">
              {{ formatDate(record.repayment_date) }}
            </template>
            
            <template v-if="column.key === 'action'">
              <a-button size="small" danger @click="deleteRecord(record)">
                删除
              </a-button>
            </template>
          </template>
        </a-table>
      </a-skeleton>
    </a-card>

    <a-modal
      v-model:visible="modalVisible"
      title="添加还款记录"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
      >
        <a-form-item label="选择账单" name="bill_id">
          <a-select
            v-model:value="formState.bill_id"
            placeholder="请选择账单"
            :options="billOptions"
          />
        </a-form-item>
        
        <a-form-item label="还款金额" name="amount">
          <a-input-number
            v-model:value="formState.amount"
            :min="0"
            :precision="2"
            placeholder="请输入还款金额"
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item label="还款日期" name="repayment_date">
          <a-date-picker
            v-model:value="formState.repayment_date"
            placeholder="选择还款日期"
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
import { message } from 'ant-design-vue';
import { repaymentAPI, billAPI, debtPlatformAPI } from '@/services/api';
import dayjs from 'dayjs';
import { formatDate } from '@/services/format';
import { requiredRule, positiveNumberRule, validDateRule } from '@/services/validators';
import { useRoute, useRouter } from 'vue-router';

const loading = ref(false);
const route = useRoute();
const router = useRouter();
const repayments = ref([]);
const bills = ref([]);
const platforms = ref([]);
const modalVisible = ref(false);
const formRef = ref();
const stateKey = 'repay-record:repayments-state';
const isReady = ref(false);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});
const filters = reactive({
  platform_id: undefined,
  date_range: undefined
});

const formState = reactive({
  bill_id: undefined,
  amount: undefined,
  repayment_date: undefined,
  notes: ''
});

const rules = {
  bill_id: [requiredRule('请选择账单')],
  amount: [requiredRule('请输入还款金额'), positiveNumberRule('还款金额必须大于 0')],
  repayment_date: [requiredRule('请选择还款日期'), validDateRule('请选择有效日期')]
};

const columns = [
  {
    title: '账单平台',
    dataIndex: 'platform_name',
    key: 'platform_name'
  },
  {
    title: '还款金额',
    key: 'amount',
    width: 100
  },
  {
    title: '还款日期',
    dataIndex: 'repayment_date',
    key: 'repayment_date'
  },
  {
    title: '备注',
    dataIndex: 'notes',
    key: 'notes',
    ellipsis: true
  },
  {
    title: '操作',
    key: 'action',
    width: 100
  }
];

const billOptions = computed(() => 
  bills.value.map(bill => ({
    value: bill.id,
    label: `${bill.platform_name} - ¥${bill.amount} - ${bill.billing_month}`
  }))
);
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
  emptyText: loading.value ? '加载中...' : '暂无还款记录'
}));

const loadRepayments = async () => {
  try {
    loading.value = true;
    const params = { page: pagination.current, page_size: pagination.pageSize };
    if (filters.platform_id) params.platform_id = filters.platform_id;
    if (filters.date_range && filters.date_range.length === 2) {
      const start = dayjs(filters.date_range[0]);
      const end = dayjs(filters.date_range[1]);
      if (start.isValid() && end.isValid()) {
        params.start_date = start.format('YYYY-MM-DD');
        params.end_date = end.format('YYYY-MM-DD');
      }
    }
    const response = await repaymentAPI.getAllRecords(params);
    if (response?.items && Array.isArray(response.items)) {
      repayments.value = response.items.map(r => ({ ...r, amount: parseFloat(r.amount) }));
      pagination.total = response.total || 0;
      pagination.current = response.page || pagination.current;
      pagination.pageSize = response.pageSize || pagination.pageSize;
    } else {
      const rows = Array.isArray(response) ? response : [];
      const all = rows.map(r => ({ ...r, amount: parseFloat(r.amount) }))
        .sort((a, b) => dayjs(b.repayment_date).valueOf() - dayjs(a.repayment_date).valueOf());
      repayments.value = all;
      pagination.total = all.length;
    }
  } catch (error) {
    console.error('加载还款记录失败:', error);
    message.error('加载数据失败');
  } finally {
    loading.value = false;
  }
};

const loadBills = async () => {
  try {
    const response = await billAPI.getAll();
    bills.value = response;
  } catch (error) {
    console.error('加载账单数据失败:', error);
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

const showModal = () => {
  Object.assign(formState, {
    bill_id: undefined,
    amount: undefined,
    repayment_date: undefined,
    notes: ''
  });
  modalVisible.value = true;
};

const handleOk = async () => {
  try {
    await formRef.value.validate();
    
    const submitData = {
      bill_id: formState.bill_id,
      amount: formState.amount,
      repayment_date: dayjs(formState.repayment_date).format('YYYY-MM-DD'),
      notes: formState.notes
    };
    
    await repaymentAPI.create(submitData);
    message.success('还款记录添加成功');
    
    modalVisible.value = false;
    loadRepayments();
  } catch (error) {
    console.error('添加还款记录失败:', error);
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
  loadRepayments();
};

const syncQuery = () => {
  const query = {};
  if (pagination.current && pagination.current !== 1) query.page = String(pagination.current);
  if (pagination.pageSize && pagination.pageSize !== 10) query.page_size = String(pagination.pageSize);
  if (filters.platform_id) query.platform_id = String(filters.platform_id);
  if (filters.date_range && filters.date_range.length === 2) {
    query.start_date = dayjs(filters.date_range[0]).format('YYYY-MM-DD');
    query.end_date = dayjs(filters.date_range[1]).format('YYYY-MM-DD');
  }
  router.replace({ query });
  saveState();
};

const initFromQuery = () => {
  const { page, page_size, platform_id, start_date, end_date } = route.query;
  const hasQuery = [page, page_size, platform_id, start_date, end_date].some(v => v !== undefined);
  if (!hasQuery) {
    restoreState();
    return;
  }
  const parsedPage = parseInt(page, 10);
  const parsedSize = parseInt(page_size, 10);
  if (Number.isInteger(parsedPage) && parsedPage > 0) pagination.current = parsedPage;
  if (Number.isInteger(parsedSize) && parsedSize > 0) pagination.pageSize = parsedSize;
  if (platform_id) filters.platform_id = parseInt(platform_id, 10);
  if (start_date && end_date) {
    filters.date_range = [dayjs(start_date), dayjs(end_date)];
  }
};

const saveState = () => {
  const payload = {
    pagination: {
      current: pagination.current,
      pageSize: pagination.pageSize
    },
    filters: {
      platform_id: filters.platform_id ?? null,
      date_range: filters.date_range && filters.date_range.length === 2
        ? [
          dayjs(filters.date_range[0]).format('YYYY-MM-DD'),
          dayjs(filters.date_range[1]).format('YYYY-MM-DD')
        ]
        : null
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
    if (savedFilters.date_range && savedFilters.date_range.length === 2) {
      filters.date_range = [dayjs(savedFilters.date_range[0]), dayjs(savedFilters.date_range[1])];
    }
    return true;
  } catch (_) {
    return false;
  }
};

const deleteRecord = async (record) => {
  try {
    await repaymentAPI.delete(record.id);
    message.success('删除成功');
    loadRepayments();
  } catch (error) {
    console.error('删除失败:', error);
    message.error('删除失败');
  }
};

onMounted(() => {
  initFromQuery();
  loadBills();
  loadPlatforms();
  loadRepayments();
  isReady.value = true;
});

watch(filters, () => {
  if (!isReady.value) return;
  pagination.current = 1;
  syncQuery();
  loadRepayments();
}, { deep: true });
</script>

<style scoped>
.repayments {
  padding: 20px;
}
</style>
