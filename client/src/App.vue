<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";
import { useUserStore } from "@/store/user";

// 应用启动时从本地缓存恢复登录态
onLaunch(() => {
  useUserStore().restore();
});
</script>

<style>
page {
  background-color: #f5f6f8;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", sans-serif;
}

/* H5 端底部 tabBar 加高并放大图标/文字 */
/* #ifdef H5 */
uni-tabbar .uni-tabbar {
  height: 70px !important;
}
uni-tabbar .uni-tabbar ~ .uni-placeholder,
uni-tabbar .uni-placeholder {
  height: 70px !important;
}
uni-tabbar .uni-tabbar__item {
  padding: 6px 0 !important;
}
uni-tabbar .uni-tabbar__icon {
  width: 28px !important;
  height: 28px !important;
}
uni-tabbar .uni-tabbar__label {
  font-size: 13px !important;
  margin-top: 4px !important;
}
/* #endif */
</style>
