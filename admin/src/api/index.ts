import request from './request'

// ---- Auth ----
export const login = (data: { username: string; password: string }) =>
  request.post('/admin/login', data)

export const getProfile = () => request.get('/admin/profile')

// ---- Dashboard ----
export const getStats = () => request.get('/admin/stats')

// ---- Users ----
export const getUsers = (params: { page?: number; pageSize?: number; keyword?: string }) =>
  request.get('/admin/users-manage', { params })

export const getUserDetail = (id: number) =>
  request.get(`/admin/users-manage/${id}`)

export const updateUserStatus = (id: number, status: 'active' | 'disabled') =>
  request.put(`/admin/users-manage/${id}/status`, { status })

// ---- Creations ----
export const getCreations = (params: { page?: number; pageSize?: number; status?: string; userId?: number }) =>
  request.get('/admin/creations', { params })

export const getCreationDetail = (id: number) =>
  request.get(`/admin/creations/${id}`)

export const deleteCreation = (id: number) =>
  request.delete(`/admin/creations/${id}`)

// ---- Prompt Presets ----
export const getPresets = () =>
  request.get('/admin/presets')

export const createPreset = (data: FormData) =>
  request.post('/admin/presets', data)

export const updatePreset = (id: number, data: FormData) =>
  request.put(`/admin/presets/${id}`, data)

export const deletePreset = (id: number) =>
  request.delete(`/admin/presets/${id}`)

export const togglePreset = (id: number, enabled: boolean) =>
  request.put(`/admin/presets/${id}/toggle`, { enabled })
