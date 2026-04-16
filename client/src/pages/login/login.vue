<script setup lang="ts">
import { ref } from "vue";
import { login, wxLogin } from "@/api/user";
import { useUserStore } from "@/store/user";

type Mode = "password" | "wx";

const userStore = useUserStore();
const mode = ref<Mode>("password");
const account = ref("");
const password = ref("");
const loading = ref(false);

// 登录成功后回到首页
function backToHome() {
  setTimeout(() => uni.switchTab({ url: "/pages/index/index" }), 600);
}

async function handlePasswordLogin() {
  if (loading.value) return;

  if (!account.value.trim() || !password.value.trim()) {
    uni.showToast({ title: "请输入账号和密码", icon: "none" });
    return;
  }

  loading.value = true;
  try {
    const result = await login({
      account: account.value.trim(),
      password: password.value.trim(),
    });
    userStore.setSession(result.token, result.userInfo);
    uni.showToast({ title: "登录成功", icon: "success" });
    backToHome();
  } catch (err) {
    const message = err instanceof Error ? err.message : "登录失败";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function handleWxLogin() {
  if (loading.value) return;
  loading.value = true;
  try {
    const { code } = await uni.login({ provider: "weixin" });
    if (!code) throw new Error("未获取到微信 code");
    const result = await wxLogin(code);
    userStore.setSession(result.token, result.userInfo);
    uni.showToast({ title: "登录成功", icon: "success" });
    backToHome();
  } catch (err) {
    const message = err instanceof Error ? err.message : "微信登录失败";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goRegister() {
  uni.navigateTo({ url: "/pages/register/register" });
}
</script>

<template>
  <view class="page">
    <view class="tabs">
      <view
        class="tab"
        :class="{ active: mode === 'password' }"
        @click="mode = 'password'"
      >
        账号密码
      </view>
      <view
        class="tab"
        :class="{ active: mode === 'wx' }"
        @click="mode = 'wx'"
      >
        微信登录
      </view>
    </view>

    <view v-if="mode === 'password'" class="card">
      <text class="title">欢迎回来</text>
      <text class="desc">使用用户名或手机号登录</text>

      <input
        v-model="account"
        class="input"
        placeholder="用户名 / 手机号"
        :maxlength="32"
      />
      <input
        v-model="password"
        class="input"
        type="password"
        placeholder="密码"
        :maxlength="64"
      />

      <button
        class="primary"
        :loading="loading"
        :disabled="loading"
        @click="handlePasswordLogin"
      >
        {{ loading ? "登录中..." : "登录" }}
      </button>

      <view class="footer">
        还没有账号？
        <text class="link" @click="goRegister">立即注册</text>
      </view>
    </view>

    <view v-else class="card">
      <text class="title">微信登录</text>
      <text class="desc">使用微信账号一键登录 Tiancheng Atelier</text>
      <button
        class="wx-btn"
        :loading="loading"
        :disabled="loading"
        @click="handleWxLogin"
      >
        {{ loading ? "登录中..." : "微信一键登录" }}
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped src="./login.scss"></style>
