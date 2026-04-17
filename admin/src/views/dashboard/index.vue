<template>
  <div>
    <h3 style="margin-bottom: 20px">数据概览</h3>
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="用户总数" :value="stats.userCount" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="创作总数" :value="stats.creationCount" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="今日创作" :value="stats.todayCreationCount" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="风格预设" :value="stats.presetCount" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { getStats } from '@/api'

const stats = reactive({
  userCount: 0,
  creationCount: 0,
  todayCreationCount: 0,
  presetCount: 0,
})

onMounted(async () => {
  const res: any = await getStats()
  Object.assign(stats, res.data)
})
</script>
