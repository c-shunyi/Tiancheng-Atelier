<template>
  <el-container style="height: 100%">
    <el-aside width="200px" style="background: #001529">
      <div class="logo">天成画坊</div>
      <el-menu
        :default-active="route.path"
        router
        background-color="#001529"
        text-color="#ffffffa6"
        active-text-color="#fff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/creations">
          <el-icon><Picture /></el-icon>
          <span>创作管理</span>
        </el-menu-item>
        <el-menu-item index="/presets">
          <el-icon><MagicStick /></el-icon>
          <span>风格预设</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header style="display: flex; align-items: center; justify-content: flex-end; border-bottom: 1px solid #eee">
        <span style="margin-right: 16px">{{ authStore.admin?.username }}</span>
        <el-button text @click="handleLogout">退出登录</el-button>
      </el-header>

      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { DataAnalysis, User, Picture, MagicStick } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  if (authStore.token && !authStore.admin) {
    authStore.fetchProfile().catch(() => {
      authStore.logout()
      router.push('/login')
    })
  }
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 2px;
}
</style>
