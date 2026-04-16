<script setup lang="ts">
import { ref } from "vue";
import { wxLogin } from "@/api/wx";
import { useUserStore } from "@/store/user";

const userStore = useUserStore();
const loading = ref(false);

async function handleLogin() {
  if (loading.value) return;
  loading.value = true;
  try {
    const { code } = await uni.login({ provider: "weixin" });
    if (!code) throw new Error("未获取到微信 code");
    const result = await wxLogin(code);
    userStore.setSession(result.token, result.user);
    uni.showToast({ title: "登录成功", icon: "success" });
    setTimeout(() => uni.switchTab({ url: "/pages/index/index" }), 600);
  } catch (err) {
    const message = err instanceof Error ? err.message : "登录失败";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <view class="page">
    <view class="card">
      <text class="title">微信登录</text>
      <text class="desc">使用微信账号快速登录 Tiancheng Atelier</text>
      <button class="primary" :loading="loading" :disabled="loading" @click="handleLogin">
        {{ loading ? "登录中..." : "微信一键登录" }}
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped src="./login.scss"></style>
