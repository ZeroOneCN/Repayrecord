<template>
  <div class="platforms">
  <a-card title="借款平台管理">
      <template #extra>
        <a-button type="primary" @click="showModal">
          添加平台
        </a-button>
      </template>
      
      <a-table
        :columns="columns"
        :data-source="platforms"
        :loading="loading"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="editPlatform(record)">编辑</a-button>
              <a-button size="small" danger @click="deletePlatform(record)">删除</a-button>
            </a-space>
          </template>
          <template v-if="column.key === 'credit_limit'">
            ¥{{ parseFloat(record.credit_limit || 0).toFixed(2) }}
          </template>
        </template>
      </a-table>
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
        <a-form-item label="平台名称" name="name">
          <a-input v-model:value="formState.name" placeholder="请输入平台名称" />
        </a-form-item>
        
        <a-form-item label="账单出账日" name="billing_day">
          <a-input-number
            v-model:value="formState.billing_day"
            :min="1"
            :max="31"
            placeholder="1-31"
          />
        </a-form-item>
        
        <a-form-item label="还款日" name="repayment_day">
          <a-input-number
            v-model:value="formState.repayment_day"
            :min="1"
            :max="31"
            placeholder="1-31"
          />
        </a-form-item>
        
        <a-form-item label="额度" name="credit_limit">
          <a-input-number
            v-model:value="formState.credit_limit"
            :min="0"
            :precision="2"
            placeholder="请输入额度"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { debtPlatformAPI } from '@/services/api';
import { requiredRule, validDayOfMonthRule } from '@/services/validators';

const loading = ref(false);
const platforms = ref([]);
const modalVisible = ref(false);
const editingId = ref(null);
const formRef = ref();

const formState = reactive({
  name: '',
  billing_day: null,
  repayment_day: null,
  credit_limit: null
});

const rules = {
  name: [requiredRule('请输入平台名称')],
  billing_day: [requiredRule('请输入账单出账日'), validDayOfMonthRule('出账日需在 1-31 之间')],
  repayment_day: [requiredRule('请输入还款日'), validDayOfMonthRule('还款日需在 1-31 之间')]
};

const columns = [
  {
    title: '平台名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '账单出账日',
    dataIndex: 'billing_day',
    key: 'billing_day'
  },
  {
    title: '还款日',
    dataIndex: 'repayment_day',
    key: 'repayment_day'
  },
  {
    title: '额度',
    key: 'credit_limit',
    width: 120
  },
  {
    title: '操作',
    key: 'action',
    width: 200
  }
];

const modalTitle = computed(() => editingId.value ? '编辑平台' : '添加平台');

const loadPlatforms = async () => {
  try {
    loading.value = true;
    const response = await debtPlatformAPI.getAll();
    platforms.value = response;
  } catch (error) {
    console.error('加载平台数据失败:', error);
    message.error('加载数据失败');
  } finally {
    loading.value = false;
  }
};

const showModal = () => {
  editingId.value = null;
  Object.assign(formState, {
    name: '',
    billing_day: null,
    repayment_day: null,
    credit_limit: null
  });
  modalVisible.value = true;
};

const editPlatform = (record) => {
  editingId.value = record.id;
  Object.assign(formState, {
    name: record.name,
    billing_day: record.billing_day,
    repayment_day: record.repayment_day,
    credit_limit: record.credit_limit
  });
  modalVisible.value = true;
};

const handleOk = async () => {
  try {
    await formRef.value.validate();
    
    if (editingId.value) {
      await debtPlatformAPI.update(editingId.value, formState);
      message.success('平台更新成功');
    } else {
      await debtPlatformAPI.create(formState);
      message.success('平台创建成功');
    }
    
    modalVisible.value = false;
    loadPlatforms();
  } catch (error) {
    console.error('操作失败:', error);
    message.error('操作失败');
  }
};

const handleCancel = () => {
  modalVisible.value = false;
};

const deletePlatform = async (record) => {
  try {
    await debtPlatformAPI.delete(record.id);
    message.success('删除成功');
    loadPlatforms();
  } catch (error) {
    console.error('删除失败:', error);
    message.error('删除失败');
  }
};

onMounted(() => {
  loadPlatforms();
});
</script>

<style scoped>
.platforms {
  padding: 20px;
}
</style>
