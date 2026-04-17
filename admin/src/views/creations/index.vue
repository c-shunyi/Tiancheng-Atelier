<template>
  <div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 16px">
      <h3>创作管理</h3>
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 140px" @change="handleFilter">
        <el-option label="全部" value="" />
        <el-option label="待处理" value="pending" />
        <el-option label="成功" value="success" />
        <el-option label="失败" value="failed" />
      </el-select>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="userId" label="用户ID" width="80" />
      <el-table-column label="原图" width="100">
        <template #default="{ row }">
          <el-image
            v-if="row.sourceUrl"
            :src="row.sourceUrl"
            :preview-src-list="[row.sourceUrl]"
            fit="cover"
            style="width: 60px; height: 60px; border-radius: 4px"
          />
        </template>
      </el-table-column>
      <el-table-column label="生成图" width="100">
        <template #default="{ row }">
          <el-image
            v-if="row.resultUrl"
            :src="row.resultUrl"
            :preview-src-list="[row.resultUrl]"
            fit="cover"
            style="width: 60px; height: 60px; border-radius: 4px"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="prompt" label="风格" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.type">{{ statusMap[row.status]?.label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString('zh-CN') }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-popconfirm title="确定删除？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button type="danger" size="small" text>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="total > pageSize"
      style="margin-top: 16px; justify-content: flex-end"
      layout="total, prev, pager, next"
      :total="total"
      :page-size="pageSize"
      v-model:current-page="page"
      @current-change="fetchData"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getCreations, deleteCreation } from '@/api'
import { ElMessage } from 'element-plus'

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待处理', type: 'warning' },
  success: { label: '成功', type: 'success' },
  failed: { label: '失败', type: 'danger' },
}

const list = ref<any[]>([])
const loading = ref(false)
const statusFilter = ref('')
const page = ref(1)
const pageSize = 20
const total = ref(0)

async function fetchData() {
  loading.value = true
  try {
    const res: any = await getCreations({
      page: page.value,
      pageSize,
      status: statusFilter.value || undefined,
    })
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function handleFilter() {
  page.value = 1
  fetchData()
}

async function handleDelete(id: number) {
  await deleteCreation(id)
  ElMessage.success('删除成功')
  fetchData()
}

onMounted(fetchData)
</script>
