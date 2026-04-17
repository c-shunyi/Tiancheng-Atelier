import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: '仪表盘' },
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('@/views/users/index.vue'),
          meta: { title: '用户管理' },
        },
        {
          path: 'creations',
          name: 'Creations',
          component: () => import('@/views/creations/index.vue'),
          meta: { title: '创作管理' },
        },
        {
          path: 'presets',
          name: 'Presets',
          component: () => import('@/views/presets/index.vue'),
          meta: { title: '风格预设' },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('admin_token')
  if (!to.meta.public && !token) {
    return '/login'
  }
})

export default router
