<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getProfile, updateProfile } from "@/api/user";
import { useUserStore } from "@/store/user";
import { API_BASE_URL, TOKEN_STORAGE_KEY } from "@/config";
import type { ApiResponse } from "@/types/api";

const userStore = useUserStore();
const nickname = ref("");
const phone = ref("");
const avatar = ref("");
const saving = ref(false);
const uploading = ref(false);

function syncFromStore() {
  const u = userStore.user;
  nickname.value = u?.nickname ?? "";
  phone.value = u?.phone ?? "";
  avatar.value = u?.avatar ?? "";
}

onShow(async () => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: "请先登录", icon: "none" });
    setTimeout(() => uni.navigateBack(), 600);
    return;
  }
  syncFromStore();
  try {
    const profile = await getProfile();
    userStore.setUser(profile);
    syncFromStore();
  } catch (err) {
    const message = err instanceof Error ? err.message : "加载失败";
    uni.showToast({ title: message, icon: "none" });
  }
});

function chooseAvatar() {
  if (uploading.value) return;
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      const filePath = res.tempFilePaths?.[0];
      if (filePath) uploadAvatar(filePath);
    },
  });
}

function uploadAvatar(filePath: string) {
  uploading.value = true;
  const token = uni.getStorageSync(TOKEN_STORAGE_KEY);
  uni.uploadFile({
    url: `${API_BASE_URL}/users/upload`,
    filePath,
    name: "file",
    formData: { category: "avatar" },
    header: token ? { Authorization: `Bearer ${token}` } : {},
    success: async (res) => {
      try {
        const body = JSON.parse(res.data as string) as ApiResponse<{ url: string }>;
        if (body?.code === 0 && body.data?.url) {
          avatar.value = body.data.url;
          // 后端上传时已直接把 avatar key 写入 DB，这里同步一次最新 profile
          try {
            const profile = await getProfile();
            userStore.setUser(profile);
          } catch {
            /* 忽略：不影响上传成功提示 */
          }
          uni.showToast({ title: "头像已上传", icon: "success" });
        } else {
          uni.showToast({ title: body?.message ?? "上传失败", icon: "none" });
        }
      } catch {
        uni.showToast({ title: "上传响应异常", icon: "none" });
      }
    },
    fail: (err) => {
      uni.showToast({ title: err.errMsg ?? "上传失败", icon: "none" });
    },
    complete: () => {
      uploading.value = false;
    },
  });
}

async function handleSave() {
  if (saving.value) return;
  const nick = nickname.value.trim();
  const ph = phone.value.trim();

  if (ph && !/^1\d{10}$/.test(ph)) {
    uni.showToast({ title: "手机号格式不正确", icon: "none" });
    return;
  }

  saving.value = true;
  try {
    // avatar 由上传接口直接落库，这里不再回传，避免把完整 URL 覆盖存储 key
    const updated = await updateProfile({
      nickname: nick,
      phone: ph || undefined,
    });
    userStore.setUser(updated);
    uni.showToast({ title: "已保存", icon: "success" });
    setTimeout(() => uni.navigateBack(), 600);
  } catch (err) {
    const message = err instanceof Error ? err.message : "保存失败";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <view class="page">
    <view class="avatar-row" @click="chooseAvatar">
      <text class="label">头像</text>
      <view class="avatar-wrap">
        <image
          v-if="avatar"
          class="avatar"
          :src="avatar"
          mode="aspectFill"
        />
        <view v-else class="avatar placeholder" />
        <text class="arrow">›</text>
      </view>
    </view>

    <view class="field">
      <text class="label">昵称</text>
      <input
        v-model="nickname"
        class="input"
        placeholder="请输入昵称"
        :maxlength="32"
      />
    </view>

    <view class="field">
      <text class="label">手机号</text>
      <input
        v-model="phone"
        class="input"
        type="number"
        placeholder="请输入手机号"
        :maxlength="11"
      />
    </view>

    <button
      class="primary"
      :loading="saving || uploading"
      :disabled="saving || uploading"
      @click="handleSave"
    >
      {{ saving ? "保存中..." : "保存" }}
    </button>
  </view>
</template>

<style lang="scss" scoped src="./profile-edit.scss"></style>
