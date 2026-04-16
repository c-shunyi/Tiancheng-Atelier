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

function goProfileEdit() {
  uni.navigateTo({ url: "/pages/profile-edit/profile-edit" });
}

function goCreationHistory() {
  uni.navigateTo({ url: "/pages/creation-history/creation-history" });
}

function handleLogout() {
  userStore.logout();
  uni.showToast({ title: "已退出登录", icon: "success" });
}
</script>

<template>
  <view class="page">
    <view
      v-if="userStore.isLoggedIn"
      class="profile-card"
      hover-class="profile-card--hover"
      @click="goProfileEdit"
    >
      <image
        v-if="userStore.user?.avatar"
        class="avatar"
        :src="userStore.user.avatar"
        mode="aspectFill"
      />
      <view v-else class="avatar placeholder" />
      <view class="info">
        <text class="nickname">
          {{ userStore.user?.nickname || userStore.user?.username || userStore.user?.phone || "未设置昵称" }}
        </text>
        <text class="meta">
          {{ userStore.user?.phone || userStore.user?.username || "点击完善个人信息" }}
        </text>
      </view>
      <text class="arrow">›</text>
    </view>

    <view v-if="userStore.isLoggedIn" class="menu">
      <view
        class="menu-item"
        hover-class="menu-item--hover"
        @click="goCreationHistory"
      >
        <text class="menu-label">我的创作</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <view v-if="userStore.isLoggedIn" class="card">
      <button class="danger" @click="handleLogout">退出登录</button>
    </view>

    <view v-else class="card">
      <text class="empty">未登录</text>
      <button class="primary" @click="goLogin">去登录</button>
    </view>

    <wd-toast />
    <wd-dialog />
    <wd-notify />
  </view>
</template>

<style lang="scss" scoped src="./user.scss"></style>
