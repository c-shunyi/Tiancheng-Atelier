import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi, getProfile } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const admin = ref<any>(null)

  async function login(username: string, password: string) {
    const res: any = await loginApi({ username, password })
    token.value = res.data.token
    admin.value = res.data.adminUser
    localStorage.setItem('admin_token', res.data.token)
  }

  async function fetchProfile() {
    const res: any = await getProfile()
    admin.value = res.data
  }

  function logout() {
    token.value = ''
    admin.value = null
    localStorage.removeItem('admin_token')
  }

  return { token, admin, login, fetchProfile, logout }
})
