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
      <view v-if="userStore.isLoggedIn" class="row">
        <uni-icons type="person-filled" size="24" color="#3b82f6" />
        <text class="welcome">欢迎，{{ userStore.user?.nickname || "微信用户" }}</text>
      </view>

      <template v-else>
        <view class="row">
          <uni-icons type="info" size="22" color="#888" />
          <text class="welcome">尚未登录</text>
        </view>
        <button class="primary" @click="goLogin">去登录</button>
      </template>
    </view>

    <wd-toast />
    <wd-dialog />
    <wd-notify />
  </view>
</template>

<style lang="scss" scoped src="./index.scss"></style>
