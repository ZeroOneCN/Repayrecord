<template>
  <AppLayout>
    <div class="page-shell">
      <section class="page-header">
        <div class="page-header-main">
          <span class="page-icon-badge">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="4" y="5" width="16" height="14" rx="3" />
              <path d="M7 10H17" />
              <path d="M7 14H12" />
            </svg>
          </span>
          <div>
            <p class="page-kicker">Platforms</p>
            <h1 class="page-title">借款平台</h1>
            <p class="page-description">
              维护平台的账单出账日、还款日和额度。后续账单自动推导截止日会依赖这里的基础配置。
            </p>
          </div>
        </div>
      </section>

      <section class="surface-card">
        <div class="toolbar">
          <div class="toolbar-group">
            <input
              v-model="searchQuery"
              class="theme-input search-input"
              type="text"
              placeholder="搜索平台名称..."
            />
          </div>
          <div class="toolbar-actions">
            <button class="theme-btn theme-btn-primary" @click="showModal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加平台
            </button>
          </div>
        </div>

        <div class="data-table-shell">
          <table class="data-table platforms-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>平台名称</th>
                <th>账单出账日</th>
                <th>还款日</th>
                <th>额度</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody v-if="sortedPlatforms.length">
              <tr v-for="item in sortedPlatforms" :key="item.id">
                <td class="table-cell-muted">#{{ item.id }}</td>
                <td>
                  <div class="table-platform">
                    <span class="table-avatar">{{ item.name.charAt(0).toUpperCase() }}</span>
                    <span class="table-platform-name">{{ item.name }}</span>
                  </div>
                </td>
                <td>{{ item.billing_day }} 日</td>
                <td>{{ item.repayment_day }} 日</td>
                <td class="table-cell-accent">¥{{ Number(item.credit_limit || 0).toFixed(2) }}</td>
                <td>
                  <div class="table-actions">
                    <button class="theme-btn theme-btn-outline" @click="editPlatform(item)">编辑</button>
                    <button class="theme-btn theme-btn-danger" @click="deletePlatform(item)">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="6">
                  <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="4" y="5" width="16" height="14" rx="3" />
                      <path d="M7 10H17" />
                    </svg>
                    <p class="empty-title">还没有平台配置</p>
                    <p class="empty-description">先创建借款平台，账单和提醒功能才能完整联动。</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div v-if="modalVisible" class="modal-overlay" @click="modalVisible = false">
        <div class="theme-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ modalTitle }}</h3>
            <button class="modal-close" title="关闭" @click="modalVisible = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="form-item">
                <label class="form-label">平台名称</label>
                <input v-model="formState.name" class="theme-input" type="text" placeholder="请输入平台名称" />
              </div>

              <div class="form-row">
                <div class="form-item">
                  <label class="form-label">账单出账日</label>
                  <input v-model.number="formState.billing_day" class="theme-input" type="number" min="1" max="31" placeholder="1-31" />
                </div>
                <div class="form-item">
                  <label class="form-label">还款日</label>
                  <input v-model.number="formState.repayment_day" class="theme-input" type="number" min="1" max="31" placeholder="1-31" />
                </div>
              </div>

              <div class="form-item">
                <label class="form-label">额度</label>
                <input v-model.number="formState.credit_limit" class="theme-input" type="number" min="0" placeholder="请输入额度" />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="theme-btn theme-btn-secondary" @click="modalVisible = false">取消</button>
            <button class="theme-btn theme-btn-primary" @click="handleOk">确定</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { debtPlatformAPI } from '@/services/api'
import AppLayout from '@/components/Layout/AppLayout.vue'

const loading = ref(false)
const platforms = ref([])
const modalVisible = ref(false)
const editingId = ref(null)
const searchQuery = ref('')

const formState = reactive({
  name: '',
  billing_day: null,
  repayment_day: null,
  credit_limit: null
})

const sortedPlatforms = computed(() => {
  let result = [...platforms.value].sort((a, b) => a.id - b.id)

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()
    result = result.filter((item) => item.name.toLowerCase().includes(query))
  }

  return result
})

const modalTitle = computed(() => (editingId.value ? '编辑平台' : '添加平台'))

const loadPlatforms = async () => {
  try {
    loading.value = true
    platforms.value = await debtPlatformAPI.getAll()
  } catch (error) {
    console.error('加载平台数据失败:', error)
    window.$message?.error('加载平台数据失败')
  } finally {
    loading.value = false
  }
}

const showModal = () => {
  editingId.value = null
  Object.assign(formState, {
    name: '',
    billing_day: null,
    repayment_day: null,
    credit_limit: null
  })
  modalVisible.value = true
}

const editPlatform = (record) => {
  editingId.value = record.id
  Object.assign(formState, {
    name: record.name,
    billing_day: Number(record.billing_day),
    repayment_day: Number(record.repayment_day),
    credit_limit: Number(record.credit_limit || 0)
  })
  modalVisible.value = true
}

const handleOk = async () => {
  try {
    if (!formState.name?.trim()) {
      window.$message?.error('请输入平台名称')
      return
    }
    if (!formState.billing_day || formState.billing_day < 1 || formState.billing_day > 31) {
      window.$message?.error('账单出账日需在 1-31 之间')
      return
    }
    if (!formState.repayment_day || formState.repayment_day < 1 || formState.repayment_day > 31) {
      window.$message?.error('还款日需在 1-31 之间')
      return
    }

    const payload = {
      name: formState.name.trim(),
      billing_day: Number(formState.billing_day),
      repayment_day: Number(formState.repayment_day),
      credit_limit: Number(formState.credit_limit || 0)
    }

    if (editingId.value) {
      await debtPlatformAPI.update(editingId.value, payload)
      window.$message?.success('平台更新成功')
    } else {
      await debtPlatformAPI.create(payload)
      window.$message?.success('平台创建成功')
    }

    modalVisible.value = false
    await loadPlatforms()
  } catch (error) {
    console.error('保存平台失败:', error)
    window.$message?.error('保存平台失败')
  }
}

const deletePlatform = async (record) => {
  if (!confirm('确定要删除这个平台吗？')) return

  try {
    await debtPlatformAPI.delete(record.id)
    window.$message?.success('删除成功')
    await loadPlatforms()
  } catch (error) {
    console.error('删除平台失败:', error)
    window.$message?.error('删除平台失败')
  }
}

onMounted(() => {
  loadPlatforms()
})
</script>

<style scoped>
.platforms-table {
  min-width: 980px;
}

.search-input {
  min-width: min(320px, 100%);
}
</style>
