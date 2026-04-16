<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";
import { useUserStore } from "@/store/user";

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
