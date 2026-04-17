<template>
  <div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 16px">
      <h3>风格预设</h3>
      <el-button type="primary" @click="openDialog()">新增预设</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="封面" width="100">
        <template #default="{ row }">
          <el-image
            v-if="row.coverUrl"
            :src="row.coverUrl"
            fit="cover"
            style="width: 60px; height: 60px; border-radius: 4px"
          />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="description" label="描述" show-overflow-tooltip />
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            :model-value="row.enabled"
            @change="(val: boolean) => handleToggle(row.id, val)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" text @click="openDialog(row)">编辑</el-button>
          <el-popconfirm title="确定删除？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button type="danger" size="small" text>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑预设' : '新增预设'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="提示词" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="实际发送给 AI 的提示词" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="封面">
          <el-upload
            :auto-upload="false"
            :limit="1"
            accept="image/*"
            :on-change="handleFileChange"
            list-type="picture"
          >
            <el-button size="small">选择图片</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { getPresets, createPreset, updatePreset, deletePreset, togglePreset } from '@/api'
import { ElMessage } from 'element-plus'
import type { FormInstance, UploadFile } from 'element-plus'

const list = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const coverFile = ref<File | null>(null)

const form = reactive({
  title: '',
  description: '',
  content: '',
  sortOrder: 0,
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  content: [{ required: true, message: '请输入提示词', trigger: 'blur' }],
}

async function fetchData() {
  loading.value = true
  try {
    const res: any = await getPresets()
    list.value = res.data
  } finally {
    loading.value = false
  }
}

function openDialog(row?: any) {
  editingId.value = row?.id || null
  form.title = row?.title || ''
  form.description = row?.description || ''
  form.content = row?.content || ''
  form.sortOrder = row?.sortOrder ?? 0
  coverFile.value = null
  dialogVisible.value = true
}

function handleFileChange(file: UploadFile) {
  coverFile.value = file.raw || null
}

async function handleSubmit() {
  await formRef.value?.validate()
  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('description', form.description)
    fd.append('content', form.content)
    fd.append('sortOrder', String(form.sortOrder))
    if (coverFile.value) {
      fd.append('cover', coverFile.value)
    }

    if (editingId.value) {
      await updatePreset(editingId.value, fd)
    } else {
      await createPreset(fd)
    }
    ElMessage.success(editingId.value ? '更新成功' : '创建成功')
    dialogVisible.value = false
    fetchData()
  } finally {
    submitting.value = false
  }
}

async function handleToggle(id: number, enabled: boolean) {
  await togglePreset(id, enabled)
  fetchData()
}

async function handleDelete(id: number) {
  await deletePreset(id)
  ElMessage.success('删除成功')
  fetchData()
}

onMounted(fetchData)
</script>
