<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";
import { useUserStore } from "@/store/user";

// 应用启动时从本地缓存恢复登录态
onLaunch(() => {
  useUserStore().restore();
});
</script>

<style>
/* 全局 Apple / iOS 风格设计令牌 */
page {
  --bg-grouped: #f2f2f7;
  --bg-card: #ffffff;
  --bg-tint: rgba(120, 120, 128, 0.12);
  --text-primary: #1d1d1f;
  --text-secondary: #6e6e73;
  --text-tertiary: #a1a1a6;
  --separator: rgba(60, 60, 67, 0.12);
  --accent: #007aff;
  --accent-pressed: #0062cc;
  --danger: #ff3b30;
  --success: #34c759;
  --warning: #ff9500;
  --shadow-card: 0 2rpx 12rpx rgba(0, 0, 0, 0.04), 0 8rpx 32rpx rgba(0, 0, 0, 0.04);
  --radius-card: 20rpx;
  --radius-card-lg: 28rpx;
  --radius-button: 16rpx;
  --radius-pill: 999rpx;

  background-color: var(--bg-grouped);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display",
    "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  font-size: 30rpx;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: 0.1rpx;
}

/* H5 端底部 tabBar —— 更接近 iOS 的毛玻璃与细腻排版 */
/* #ifdef H5 */
uni-tabbar .uni-tabbar {
  height: 70px !important;
  background-color: rgba(255, 255, 255, 0.88) !important;
  backdrop-filter: saturate(180%) blur(20px) !important;
  -webkit-backdrop-filter: saturate(180%) blur(20px) !important;
  border-top: 0.5px solid rgba(60, 60, 67, 0.18) !important;
}
uni-tabbar .uni-tabbar ~ .uni-placeholder,
uni-tabbar .uni-placeholder {
  height: 70px !important;
}
uni-tabbar .uni-tabbar__item {
  padding: 6px 0 !important;
}
uni-tabbar .uni-tabbar__icon {
  width: 26px !important;
  height: 26px !important;
}
uni-tabbar .uni-tabbar__label {
  font-size: 11px !important;
  margin-top: 4px !important;
  letter-spacing: 0.2px !important;
}
/* #endif */
</style>
