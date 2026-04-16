<script setup lang="ts">
import { useUserStore } from "@/store/user";

const userStore = useUserStore();

function goLogin() {
  uni.navigateTo({ url: "/pages/login/login" });
}
</script>

<template>
  <view class="page">
    <view class="hero">
      <text class="title">Tiancheng Atelier</text>
      <text class="subtitle">uni-app + Vue3 + Vite + TS</text>
    </view>

    <view class="card">
      <text v-if="userStore.isLoggedIn" class="welcome">
        欢迎，{{ userStore.user?.nickname || "微信用户" }}
      </text>
      <template v-else>
        <text class="welcome">尚未登录</text>
        <button class="primary" @click="goLogin">去登录</button>
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  padding: 32rpx;
}
.hero {
  padding: 64rpx 0;
  text-align: center;
}
.title {
  display: block;
  font-size: 48rpx;
  font-weight: 600;
  color: #111;
}
.subtitle {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #888;
}
.card {
  margin-top: 32rpx;
  padding: 40rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}
.welcome {
  display: block;
  font-size: 32rpx;
  color: #333;
  margin-bottom: 24rpx;
}
.primary {
  background: #3b82f6;
  color: #fff;
  border-radius: 12rpx;
}
</style>
