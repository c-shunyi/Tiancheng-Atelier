<script setup lang="ts">
import { ref } from "vue";
import { register } from "@/api/user";
import { useUserStore } from "@/store/user";

const userStore = useUserStore();
const account = ref("");
const password = ref("");
const passwordConfirm = ref("");
const loading = ref(false);

async function handleRegister() {
  if (loading.value) return;

  const accountTrimmed = account.value.trim();
  const passwordTrimmed = password.value.trim();
  const confirmTrimmed = passwordConfirm.value.trim();

  if (!accountTrimmed || !passwordTrimmed) {
    uni.showToast({ title: "请输入账号和密码", icon: "none" });
    return;
  }

  if (passwordTrimmed.length < 6) {
    uni.showToast({ title: "密码至少 6 位", icon: "none" });
    return;
  }

  if (passwordTrimmed !== confirmTrimmed) {
    uni.showToast({ title: "两次密码不一致", icon: "none" });
    return;
  }

  loading.value = true;
  try {
    const result = await register({
      account: accountTrimmed,
      password: passwordTrimmed,
    });
    userStore.setSession(result.token, result.userInfo);
    uni.showToast({ title: "注册成功", icon: "success" });
    setTimeout(() => uni.switchTab({ url: "/pages/index/index" }), 600);
  } catch (err) {
    const message = err instanceof Error ? err.message : "注册失败";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goLogin() {
  uni.navigateBack({
    fail: () => uni.redirectTo({ url: "/pages/login/login" }),
  });
}
</script>

<template>
  <view class="page">
    <view class="card">
      <text class="title">创建账号</text>
      <text class="desc">使用用户名或手机号注册</text>

      <input
        v-model="account"
        class="input"
        placeholder="用户名 / 手机号"
        :maxlength="32"
      />
      <text class="tip">用户名 4~32 位字母数字下划线；或填 11 位手机号</text>

      <input
        v-model="password"
        class="input"
        type="password"
        placeholder="密码（6~64 位）"
        :maxlength="64"
      />
      <input
        v-model="passwordConfirm"
        class="input"
        type="password"
        placeholder="确认密码"
        :maxlength="64"
      />

      <button
        class="primary"
        :loading="loading"
        :disabled="loading"
        @click="handleRegister"
      >
        {{ loading ? "注册中..." : "注册" }}
      </button>

      <view class="footer">
        已有账号？
        <text class="link" @click="goLogin">去登录</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped src="./register.scss"></style>
