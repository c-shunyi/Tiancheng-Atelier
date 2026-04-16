<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { getProfile } from "@/api/wx";
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
      <text class="nickname">{{ userStore.user?.nickname || "微信用户" }}</text>
      <text class="meta">openid：{{ userStore.user?.openid }}</text>
      <button class="danger" @click="handleLogout">退出登录</button>
    </view>

    <view v-else class="card">
      <text class="empty">未登录</text>
      <button class="primary" @click="goLogin">去登录</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  padding: 32rpx;
}
.card {
  padding: 48rpx 40rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  text-align: center;
}
.avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  margin: 0 auto 24rpx;
  display: block;
  &.placeholder {
    background: #e5e7eb;
  }
}
.nickname {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #111;
}
.meta {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #999;
  word-break: break-all;
}
.empty {
  display: block;
  margin-bottom: 24rpx;
  font-size: 32rpx;
  color: #666;
}
.primary {
  margin-top: 32rpx;
  background: #3b82f6;
  color: #fff;
  border-radius: 12rpx;
}
.danger {
  margin-top: 48rpx;
  background: #ef4444;
  color: #fff;
  border-radius: 12rpx;
}
</style>
