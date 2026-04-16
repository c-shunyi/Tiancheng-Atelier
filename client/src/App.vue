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
</style>
