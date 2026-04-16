<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { getProfile } from "@/api/user";
import { useUserStore } from "@/store/user";

const userStore = useUserStore();

onShow(async () => {
  if (!userStore.isLoggedIn) return;
  try {
    const profile = await getProfile();
    userStore.setUser(profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : "加载失败";
    uni.showToast({ title: message, icon: "none" });
  }
});

function goLogin() {
  uni.navigateTo({ url: "/pages/login/login" });
}

function handleLogout() {
  userStore.logout();
  uni.showToast({ title: "已退出登录", icon: "success" });
}
</script>

<template>
  <view class="page">
    <view v-if="userStore.isLoggedIn" class="card">
      <image
        v-if="userStore.user?.avatar"
        class="avatar"
        :src="userStore.user.avatar"
        mode="aspectFill"
      />
      <view v-else class="avatar placeholder" />
      <text class="nickname">
        {{ userStore.user?.nickname || userStore.user?.username || userStore.user?.phone || "用户" }}
      </text>
      <text v-if="userStore.user?.username" class="meta">用户名：{{ userStore.user.username }}</text>
      <text v-if="userStore.user?.phone" class="meta">手机号：{{ userStore.user.phone }}</text>
      <text v-if="userStore.user?.hasWx" class="meta">已绑定微信</text>
      <button class="danger" @click="handleLogout">退出登录</button>
    </view>

    <view v-else class="card">
      <text class="empty">未登录</text>
      <button class="primary" @click="goLogin">去登录</button>
    </view>
  </view>
</template>

<style lang="scss" scoped src="./user.scss"></style>
