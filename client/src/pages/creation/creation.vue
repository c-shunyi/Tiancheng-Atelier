<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { createCreation, getCreation, listCreations } from "@/api/creation";
import { useUserStore } from "@/store/user";
import type { Creation } from "@/types/api";

const PROMPT_MAX = 300;
const POLL_INTERVAL_MS = 2500;

const userStore = useUserStore();
const sourcePath = ref("");
const prompt = ref("");
const submitting = ref(false);
const tasks = ref<Creation[]>([]);

const promptLen = computed(() => prompt.value.length);
const canSubmit = computed(
  () => !submitting.value && !!sourcePath.value && prompt.value.trim().length > 0,
);

/** 每个 pending 任务对应的轮询定时器，任务结束时清理。 */
const pollTimers = new Map<number, ReturnType<typeof setInterval>>();

function ensureLogin(): boolean {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: "请先登录", icon: "none" });
    setTimeout(() => uni.navigateTo({ url: "/pages/login/login" }), 600);
    return false;
  }
  return true;
}

function chooseImage() {
  if (!ensureLogin()) return;
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      const filePath = res.tempFilePaths?.[0];
      if (filePath) sourcePath.value = filePath;
    },
  });
}

function clearSource() {
  sourcePath.value = "";
}

function stopPolling(id: number) {
  const timer = pollTimers.get(id);
  if (timer) {
    clearInterval(timer);
    pollTimers.delete(id);
  }
}

function startPolling(id: number) {
  if (pollTimers.has(id)) return;
  const timer = setInterval(async () => {
    try {
      const latest = await getCreation(id);
      const index = tasks.value.findIndex((t) => t.id === id);
      if (index !== -1) tasks.value[index] = latest;
      if (latest.status !== "pending") stopPolling(id);
    } catch {
      // 网络抖动不终止轮询，下个 tick 再试
    }
  }, POLL_INTERVAL_MS);
  pollTimers.set(id, timer);
}

async function loadHistory() {
  try {
    const data = await listCreations({ page: 1, pageSize: 20 });
    tasks.value = data.list;
    for (const task of data.list) {
      if (task.status === "pending") startPolling(task.id);
    }
  } catch {
    // 首次进入无历史不提示
  }
}

async function handleSubmit() {
  if (!ensureLogin()) return;
  if (!sourcePath.value) {
    uni.showToast({ title: "请先选择参考图", icon: "none" });
    return;
  }
  const trimmed = prompt.value.trim();
  if (!trimmed) {
    uni.showToast({ title: "请输入提示词", icon: "none" });
    return;
  }
  if (trimmed.length > PROMPT_MAX) {
    uni.showToast({ title: `提示词不能超过 ${PROMPT_MAX} 字`, icon: "none" });
    return;
  }

  submitting.value = true;
  try {
    const created = await createCreation({ filePath: sourcePath.value, prompt: trimmed });
    tasks.value.unshift(created);
    startPolling(created.id);
    sourcePath.value = "";
    prompt.value = "";
    uni.showToast({ title: "已提交，正在生成", icon: "none" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "提交失败";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    submitting.value = false;
  }
}

function previewResult(task: Creation) {
  if (!task.resultUrl) return;
  uni.previewImage({ urls: [task.resultUrl], current: task.resultUrl });
}

function saveResult(task: Creation) {
  if (!task.resultUrl) return;
  uni.downloadFile({
    url: task.resultUrl,
    success: (res) => {
      if (res.statusCode !== 200) {
        uni.showToast({ title: "下载失败", icon: "none" });
        return;
      }
      uni.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: () => uni.showToast({ title: "已保存到相册", icon: "success" }),
        fail: (err) => uni.showToast({ title: err.errMsg ?? "保存失败", icon: "none" }),
      });
    },
    fail: (err) => uni.showToast({ title: err.errMsg ?? "下载失败", icon: "none" }),
  });
}

function goHistory() {
  uni.navigateTo({ url: "/pages/creation-history/creation-history" });
}

onShow(() => {
  if (userStore.isLoggedIn) loadHistory();
});

onUnmounted(() => {
  for (const timer of pollTimers.values()) clearInterval(timer);
  pollTimers.clear();
});
</script>

<template>
  <view class="page">
    <view class="card">
      <view class="card-title">参考图</view>
      <view class="picker" @click="chooseImage">
        <image
          v-if="sourcePath"
          class="preview"
          :src="sourcePath"
          mode="aspectFill"
        />
        <view v-else class="placeholder">
          <text class="plus">+</text>
          <text class="hint">点击选择图片</text>
        </view>
      </view>
      <view v-if="sourcePath" class="clear" @click="clearSource">
        <text>重新选择</text>
      </view>
    </view>

    <view class="card">
      <view class="card-title">提示词</view>
      <textarea
        v-model="prompt"
        class="textarea"
        placeholder="用一句话描述你想生成的画面，例如：生成狗狗趴在草地上的近景画面"
        :maxlength="PROMPT_MAX"
      />
      <view class="counter">{{ promptLen }} / {{ PROMPT_MAX }}</view>
    </view>

    <button
      class="primary"
      :loading="submitting"
      :disabled="!canSubmit"
      @click="handleSubmit"
    >
      {{ submitting ? "提交中..." : "开始生成" }}
    </button>

    <view v-if="tasks.length" class="tasks">
      <view class="tasks-title">最近任务</view>
      <view
        v-for="task in tasks"
        :key="task.id"
        class="task"
        :class="`task--${task.status}`"
      >
        <image
          v-if="task.status === 'success' && task.resultUrl"
          class="task-image"
          :src="task.resultUrl"
          mode="aspectFill"
          @click="previewResult(task)"
        />
        <view v-else class="task-image task-image--placeholder">
          <text v-if="task.status === 'pending'" class="task-hint">生成中…</text>
          <text v-else class="task-hint task-hint--error">生成失败</text>
        </view>
        <view class="task-body">
          <view class="task-prompt">{{ task.prompt }}</view>
          <view class="task-meta">
            <text class="task-time">{{ task.createdAt.slice(0, 16).replace("T", " ") }}</text>
            <button
              v-if="task.status === 'success'"
              class="task-save"
              size="mini"
              @click.stop="saveResult(task)"
            >
              保存
            </button>
          </view>
        </view>
      </view>
    </view>

    <view class="history-entry" @click="goHistory">
      <text>查看全部历史 ›</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  padding: 24rpx 32rpx 64rpx;
  background: #f5f6f8;
  min-height: 100vh;
  box-sizing: border-box;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);

  .card-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 16rpx;
  }
}

.picker {
  width: 100%;
  height: 400rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;

  .preview {
    width: 100%;
    height: 100%;
  }

  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #94a3b8;

    .plus {
      font-size: 80rpx;
      line-height: 1;
      margin-bottom: 12rpx;
    }

    .hint {
      font-size: 26rpx;
    }
  }
}

.clear {
  margin-top: 16rpx;
  text-align: center;
  color: #3b82f6;
  font-size: 26rpx;
}

.textarea {
  width: 100%;
  min-height: 220rpx;
  padding: 16rpx;
  box-sizing: border-box;
  border-radius: 12rpx;
  background: #f8fafc;
  font-size: 28rpx;
  color: #1f2937;
}

.counter {
  margin-top: 8rpx;
  text-align: right;
  font-size: 22rpx;
  color: #94a3b8;
}

.primary {
  background: #3b82f6;
  color: #ffffff;
  font-size: 30rpx;
  border-radius: 12rpx;
  height: 88rpx;
  line-height: 88rpx;
  margin-top: 16rpx;

  &[disabled] {
    background: #cbd5e1;
    color: #ffffff;
  }
}

.tasks {
  margin-top: 32rpx;

  .tasks-title {
    font-size: 26rpx;
    color: #64748b;
    padding: 0 8rpx 16rpx;
  }
}

.task {
  display: flex;
  gap: 20rpx;
  padding: 20rpx;
  background: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);

  &--pending {
    border: 1rpx dashed #93c5fd;
  }

  &--failed {
    border: 1rpx solid #fecaca;
  }
}

.task-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background: #f1f5f9;
  flex-shrink: 0;

  &--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.task-hint {
  font-size: 24rpx;
  color: #3b82f6;

  &--error {
    color: #ef4444;
  }
}

.task-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.task-prompt {
  font-size: 26rpx;
  color: #1f2937;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;

  .task-time {
    font-size: 22rpx;
    color: #94a3b8;
  }

  .task-save {
    background: #ffffff;
    color: #3b82f6;
    border: 1rpx solid #3b82f6;
    font-size: 22rpx;
    padding: 0 20rpx;
    line-height: 50rpx;
  }
}

.history-entry {
  margin-top: 24rpx;
  padding: 24rpx;
  background: #ffffff;
  border-radius: 16rpx;
  text-align: center;
  color: #3b82f6;
  font-size: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);
}
</style>
