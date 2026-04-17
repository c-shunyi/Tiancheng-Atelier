<template>
  <div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 16px">
      <h3>用户管理</h3>
      <el-input v-model="keyword" placeholder="搜索用户名/手机号" style="width: 240px" clearable @clear="fetchData" @keyup.enter="fetchData" />
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="头像" width="80">
        <template #default="{ row }">
          <el-avatar :size="36" :src="row.avatar || undefined" />
        </template>
      </el-table-column>
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="nickname" label="昵称" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column label="微信" width="80">
        <template #default="{ row }">
          {{ row.openid ? '已绑定' : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="注册时间" width="180">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString('zh-CN') }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            :type="row.status === 'active' ? 'danger' : 'success'"
            size="small"
            text
            @click="handleToggleStatus(row)"
          >
            {{ row.status === 'active' ? '禁用' : '启用' }}
          </el-button>
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
import { getUsers, updateUserStatus } from '@/api'
import { ElMessageBox, ElMessage } from 'element-plus'

const list = ref<any[]>([])
const loading = ref(false)
const keyword = ref('')
const page = ref(1)
const pageSize = 20
const total = ref(0)

async function fetchData() {
  loading.value = true
  try {
    const res: any = await getUsers({ page: page.value, pageSize, keyword: keyword.value || undefined })
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

async function handleToggleStatus(row: any) {
  const next = row.status === 'active' ? 'disabled' : 'active'
  await ElMessageBox.confirm(
    `确定要${next === 'disabled' ? '禁用' : '启用'}该用户吗？`,
    '提示',
    { type: 'warning' },
  )
  await updateUserStatus(row.id, next)
  ElMessage.success('操作成功')
  fetchData()
}

onMounted(fetchData)
</script>
