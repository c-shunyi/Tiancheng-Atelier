<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useDialog, useToast } from "@wot-ui/ui";
import { deleteCreation, getCreation } from "@/api/creation";
import type { Creation } from "@/types/api";

const POLL_INTERVAL_MS = 2500;

const toast = useToast();
const dialog = useDialog();

const detail = ref<Creation | null>(null);
const loading = ref(true);
const errorMsg = ref("");
let pollTimer: ReturnType<typeof setInterval> | null = null;

const statusLabel = computed(() => {
  switch (detail.value?.status) {
    case "pending":
      return "生成中";
    case "success":
      return "已完成";
    case "failed":
      return "失败";
    default:
      return "";
  }
});

const createdAtText = computed(() =>
  detail.value ? detail.value.createdAt.slice(0, 19).replace("T", " ") : "",
);

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startPollingIfNeeded() {
  if (!detail.value || detail.value.status !== "pending" || pollTimer) return;
  pollTimer = setInterval(async () => {
    if (!detail.value) return;
    try {
      const latest = await getCreation(detail.value.id);
      detail.value = latest;
      if (latest.status !== "pending") stopPolling();
    } catch {
      // 网络抖动不终止轮询
    }
  }, POLL_INTERVAL_MS);
}

async function load(id: number) {
  loading.value = true;
  try {
    detail.value = await getCreation(id);
    startPollingIfNeeded();
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : "加载失败";
  } finally {
    loading.value = false;
  }
}

function previewImage(url: string) {
  if (!url) return;
  uni.previewImage({ urls: [url], current: url });
}

function saveResult() {
  const url = detail.value?.resultUrl;
  if (!url) return;
  // #ifdef H5
  window.open(url, "_blank");
  // #endif
  // #ifndef H5
  uni.downloadFile({
    url,
    success: (res) => {
      if (res.statusCode !== 200) {
        toast.error("下载失败");
        return;
      }
      uni.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: () => toast.success("已保存到相册"),
        fail: (err) => toast.error(err.errMsg ?? "保存失败"),
      });
    },
    fail: (err) => toast.error(err.errMsg ?? "下载失败"),
  });
  // #endif
}

async function confirmDelete() {
  if (!detail.value) return;
  const id = detail.value.id;
  try {
    await dialog.confirm({
      title: "删除创作",
      msg: "确定要删除这条记录吗？",
      confirmButtonText: "删除",
    });
  } catch {
    return; // 用户取消
  }
  try {
    await deleteCreation(id);
    toast.success("已删除");
    setTimeout(() => uni.navigateBack(), 400);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "删除失败");
  }
}

onLoad((query) => {
  const id = Number(query?.id);
  if (!Number.isInteger(id) || id <= 0) {
    errorMsg.value = "参数错误";
    loading.value = false;
    return;
  }
  load(id);
});

onUnmounted(() => {
  stopPolling();
});
</script>

<template>
  <view class="page">
    <view v-if="loading" class="hint">加载中…</view>
    <view v-else-if="errorMsg" class="hint error">{{ errorMsg }}</view>

    <template v-else-if="detail">
      <view class="card result-card">
        <view class="status-row">
          <wd-tag
            :type="detail.status === 'success' ? 'success' : detail.status === 'failed' ? 'danger' : 'primary'"
            plain
          >
            {{ statusLabel }}
          </wd-tag>
          <text class="time">{{ createdAtText }}</text>
        </view>
        <image
          v-if="detail.status === 'success' && detail.resultUrl"
          class="result-image"
          :src="detail.resultUrl"
          mode="widthFix"
          @click="previewImage(detail.resultUrl)"
        />
        <view v-else class="result-placeholder" :class="`result-placeholder--${detail.status}`">
          <text v-if="detail.status === 'pending'">生成中，请稍候…</text>
          <text v-else>生成失败</text>
        </view>
      </view>

      <view class="card">
        <view class="card-title">提示词</view>
        <text class="prompt">{{ detail.prompt }}</text>
      </view>

      <view class="card">
        <view class="card-title">参考图</view>
        <image
          v-if="detail.sourceUrl"
          class="source-image"
          :src="detail.sourceUrl"
          mode="aspectFill"
          @click="previewImage(detail.sourceUrl)"
        />
      </view>

      <view class="actions">
        <wd-button
          v-if="detail.status === 'success'"
          type="primary"
          block
          size="large"
          @click="saveResult"
        >
          保存到相册
        </wd-button>
        <wd-button type="error" plain block size="large" @click="confirmDelete">
          删除
        </wd-button>
      </view>
    </template>

    <wd-toast />
    <wd-dialog />
    <wd-notify />
  </view>
</template>

<style lang="scss" scoped>
.page {
  padding: 24rpx 28rpx 64rpx;
  min-height: 100vh;
  box-sizing: border-box;
}

.hint {
  margin-top: 120rpx;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 28rpx;

  &.error {
    color: var(--danger);
  }
}

.card {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  padding: 28rpx 24rpx 24rpx;
  margin-bottom: 24rpx;
  box-shadow: var(--shadow-card);

  .card-title {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 20rpx;
    padding-left: 4rpx;
    letter-spacing: 0.2rpx;
  }
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;

  .time {
    font-size: 24rpx;
    color: var(--text-tertiary);
    font-variant-numeric: tabular-nums;
  }
}

.result-image {
  width: 100%;
  border-radius: 20rpx;
  background: var(--bg-tint);
}

.result-placeholder {
  width: 100%;
  height: 400rpx;
  border-radius: 20rpx;
  background: var(--bg-tint);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: var(--accent);

  &--failed {
    color: var(--danger);
  }
}

.prompt {
  display: block;
  font-size: 28rpx;
  color: var(--text-primary);
  line-height: 1.6;
  white-space: pre-wrap;
  padding: 0 4rpx;
}

.source-image {
  width: 240rpx;
  height: 240rpx;
  border-radius: 20rpx;
  background: var(--bg-tint);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 8rpx;
}
</style>
