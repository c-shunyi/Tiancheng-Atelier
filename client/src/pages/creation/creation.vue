<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useToast } from "@wot-ui/ui";
import { createCreation, getCreation, listCreations } from "@/api/creation";
import { listPromptPresets } from "@/api/prompt";
import { getProfile } from "@/api/user";
import { useUserStore } from "@/store/user";
import type { Creation, PromptPreset } from "@/types/api";

const POLL_INTERVAL_MS = 2500;

const toast = useToast();

const userStore = useUserStore();
const sourcePath = ref("");
const presets = ref<PromptPreset[]>([]);
const selectedPromptId = ref<number | null>(null);
const submitting = ref(false);
const tasks = ref<Creation[]>([]);
const pickerOpen = ref(false);

const canSubmit = computed(
  () => !submitting.value && !!sourcePath.value && selectedPromptId.value !== null,
);

const selectedPreset = computed(() =>
  presets.value.find((p) => p.id === selectedPromptId.value) ?? null,
);

/** 每个 pending 任务对应的轮询定时器，任务结束时清理。 */
const pollTimers = new Map<number, ReturnType<typeof setInterval>>();

function ensureLogin(): boolean {
  if (!userStore.isLoggedIn) {
    toast.show("请先登录");
    setTimeout(() => uni.navigateTo({ url: "/pages/login/login" }), 600);
    return false;
  }
  return true;
}

function goLogin() {
  uni.navigateTo({ url: "/pages/login/login" });
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
  if (!userStore.isLoggedIn) return;
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

async function loadPresets() {
  if (!userStore.isLoggedIn) return;
  try {
    presets.value = await listPromptPresets();
  } catch (err) {
    const message = err instanceof Error ? err.message : "加载提示词失败";
    toast.error(message);
  }
}

function openPicker() {
  if (presets.value.length === 0) {
    toast.show("暂无可用风格");
    return;
  }
  pickerOpen.value = true;
}

function closePicker() {
  pickerOpen.value = false;
}

function selectPreset(id: number) {
  selectedPromptId.value = id;
  pickerOpen.value = false;
}

async function handleSubmit() {
  if (!ensureLogin()) return;
  if (!sourcePath.value) {
    toast.show("请先选择参考图");
    return;
  }
  if (selectedPromptId.value === null) {
    toast.show("请选择一个提示词");
    return;
  }

  submitting.value = true;
  try {
    const created = await createCreation({
      filePath: sourcePath.value,
      promptId: selectedPromptId.value,
    });
    tasks.value.unshift(created);
    startPolling(created.id);
    sourcePath.value = "";
    selectedPromptId.value = null;

    // 刷新 profile 以同步最新的 freeQuotaRemaining
    try {
      const profile = await getProfile();
      userStore.setUser(profile);
    } catch {
      /* 刷新失败不影响本次提交提示 */
    }
    toast.success("已提交，正在生成");
  } catch (err) {
    const message = err instanceof Error ? err.message : "提交失败";
    toast.error(message);
  } finally {
    submitting.value = false;
  }
}

function goDetail(task: Creation) {
  uni.navigateTo({ url: `/pages/creation-detail/creation-detail?id=${task.id}` });
}

function saveResult(task: Creation) {
  if (!task.resultUrl) return;
  // #ifdef H5
  // H5 浏览器不支持 saveImageToPhotosAlbum，直接新标签打开让用户右键保存
  window.open(task.resultUrl, "_blank");
  return;
  // #endif
  // #ifndef H5
  uni.downloadFile({
    url: task.resultUrl,
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

function goHistory() {
  uni.navigateTo({ url: "/pages/creation-history/creation-history" });
}

async function refreshProfile() {
  if (!userStore.isLoggedIn) return;
  try {
    const profile = await getProfile();
    userStore.setUser(profile);
  } catch {
    /* 静默：profile 刷新失败不影响主流程 */
  }
}

onShow(() => {
  loadPresets();
  if (userStore.isLoggedIn) {
    refreshProfile();
    loadHistory();
  } else {
    // 未登录清空残留，避免从登录态切回显示旧数据
    tasks.value = [];
    for (const timer of pollTimers.values()) clearInterval(timer);
    pollTimers.clear();
  }
});

onUnmounted(() => {
  for (const timer of pollTimers.values()) clearInterval(timer);
  pollTimers.clear();
});
</script>

<template>
  <view class="page">
    <view v-if="!userStore.isLoggedIn" class="login-tip">
      <text class="tip-title">登录后才能进行创作</text>
      <text class="tip-desc">登录账号后可上传参考图并提交生成任务</text>
      <wd-button type="primary" block size="large" @click="goLogin">去登录</wd-button>
    </view>

    <template v-else>
    <view v-if="userStore.user" class="quota">
      <text class="quota-label">今日免费次数</text>
      <text class="quota-value">
        <text class="quota-remaining">{{ userStore.user.freeQuotaRemaining }}</text>
        / {{ userStore.user.freeQuotaLimit }}
      </text>
    </view>

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
      <view class="card-title">风格</view>
      <wd-cell
        :title="selectedPreset ? selectedPreset.title : '请选择风格'"
        :label="selectedPreset?.content"
        is-link
        clickable
        @click="openPicker"
      />
    </view>

    <wd-button
      type="primary"
      block
      size="large"
      :loading="submitting"
      :disabled="!canSubmit"
      custom-class="submit-btn"
      @click="handleSubmit"
    >
      {{ submitting ? "提交中..." : "开始生成" }}
    </wd-button>

    <view v-if="tasks.length" class="tasks">
      <view class="tasks-title">最近任务</view>
      <view
        v-for="task in tasks"
        :key="task.id"
        class="task"
        :class="`task--${task.status}`"
        @click="goDetail(task)"
      >
        <image
          v-if="task.status === 'success' && task.resultUrl"
          class="task-image"
          :src="task.resultUrl"
          mode="aspectFill"
        />
        <view v-else class="task-image task-image--placeholder">
          <wd-tag v-if="task.status === 'pending'" type="primary" plain>生成中</wd-tag>
          <wd-tag v-else type="danger" plain>生成失败</wd-tag>
        </view>
        <view class="task-body">
          <view class="task-prompt">{{ task.prompt }}</view>
          <view class="task-meta">
            <text class="task-time">{{ task.createdAt.slice(0, 16).replace("T", " ") }}</text>
            <wd-button
              v-if="task.status === 'success'"
              size="small"
              plain
              type="primary"
              @click.stop="saveResult(task)"
            >
              保存
            </wd-button>
          </view>
        </view>
      </view>
    </view>

    <view class="history-entry" @click="goHistory">
      <text>查看全部历史 ›</text>
    </view>

    <wd-popup
      v-model="pickerOpen"
      position="bottom"
      :safe-area-inset-bottom="true"
      custom-style="border-radius: 24rpx 24rpx 0 0; max-height: 80vh; display: flex; flex-direction: column;"
      @close="closePicker"
    >
      <view class="picker-header">
        <text class="picker-title">选择风格</text>
        <wd-icon name="close" size="18px" custom-class="picker-close" @click="closePicker" />
      </view>
      <scroll-view scroll-y class="picker-list">
        <view
          v-for="preset in presets"
          :key="preset.id"
          class="preset"
          :class="{ 'preset--active': preset.id === selectedPromptId }"
          @click="selectPreset(preset.id)"
        >
          <image
            v-if="preset.cover"
            class="preset-cover"
            :src="preset.cover"
            mode="aspectFill"
          />
          <view class="preset-body">
            <view class="preset-title">{{ preset.title }}</view>
            <view class="preset-content">{{ preset.content }}</view>
          </view>
        </view>
      </scroll-view>
    </wd-popup>
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

.quota {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  margin-bottom: 24rpx;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.08), rgba(88, 86, 214, 0.08));
  border-radius: var(--radius-card);
  border: 0.5rpx solid rgba(0, 122, 255, 0.15);

  .quota-label {
    font-size: 26rpx;
    color: var(--text-secondary);
    letter-spacing: 0.2rpx;
  }

  .quota-value {
    font-size: 26rpx;
    color: var(--text-tertiary);
    font-variant-numeric: tabular-nums;

    .quota-remaining {
      font-size: 40rpx;
      font-weight: 700;
      color: var(--accent);
      margin-right: 4rpx;
      letter-spacing: -0.5rpx;
    }
  }
}

.login-tip {
  margin-top: 180rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  padding: 56rpx 40rpx;
  background: var(--bg-card);
  border-radius: var(--radius-card-lg);
  box-shadow: var(--shadow-card);

  .tip-title {
    font-size: 36rpx;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 0.3rpx;
  }

  .tip-desc {
    font-size: 26rpx;
    color: var(--text-secondary);
    text-align: center;
    margin-bottom: 16rpx;
    line-height: 1.5;
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

.picker {
  width: 100%;
  height: 400rpx;
  border-radius: var(--radius-card);
  overflow: hidden;
  background: var(--bg-tint);
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
    color: var(--text-tertiary);

    .plus {
      font-size: 72rpx;
      line-height: 1;
      margin-bottom: 16rpx;
      font-weight: 300;
      color: var(--accent);
    }

    .hint {
      font-size: 26rpx;
    }
  }
}

.clear {
  margin-top: 16rpx;
  text-align: center;
  color: var(--accent);
  font-size: 26rpx;
  font-weight: 500;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx 20rpx;
  border-bottom: 0.5rpx solid var(--separator);

  .picker-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 0.2rpx;
  }
}

.picker-close {
  color: var(--text-tertiary);
  padding: 8rpx 16rpx;
}

.picker-list {
  flex: 1;
  padding: 20rpx 28rpx 32rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.preset {
  display: flex;
  gap: 20rpx;
  padding: 20rpx;
  background: #fafafa;
  border: 2rpx solid transparent;
  border-radius: 20rpx;
  transition: all 0.2s ease;

  &--active {
    background: rgba(0, 122, 255, 0.06);
    border-color: var(--accent);
  }
}

.preset-cover {
  width: 140rpx;
  height: 140rpx;
  border-radius: 16rpx;
  background: var(--bg-tint);
  flex-shrink: 0;
}

.preset-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.preset-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8rpx;
  letter-spacing: 0.2rpx;
}

.preset-content {
  font-size: 24rpx;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.submit-btn) {
  margin-top: 24rpx;
  border-radius: var(--radius-button) !important;
  height: 96rpx !important;
  font-size: 32rpx !important;
  font-weight: 600 !important;
  letter-spacing: 0.5rpx !important;
}

.tasks {
  margin-top: 40rpx;

  .tasks-title {
    font-size: 24rpx;
    color: var(--text-secondary);
    padding: 0 12rpx 16rpx;
    text-transform: uppercase;
    letter-spacing: 1rpx;
    font-weight: 500;
  }
}

.task {
  display: flex;
  gap: 20rpx;
  padding: 20rpx;
  background: var(--bg-card);
  border-radius: var(--radius-card);
  margin-bottom: 16rpx;
  box-shadow: var(--shadow-card);
  transition: transform 0.15s ease;

  &:active {
    transform: scale(0.99);
  }

  &--pending {
    border: 0.5rpx solid rgba(0, 122, 255, 0.3);
  }

  &--failed {
    border: 0.5rpx solid rgba(255, 59, 48, 0.3);
  }
}

.task-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  background: var(--bg-tint);
  flex-shrink: 0;

  &--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
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
  color: var(--text-primary);
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
    color: var(--text-tertiary);
    font-variant-numeric: tabular-nums;
  }
}

.history-entry {
  margin-top: 24rpx;
  padding: 28rpx;
  background: var(--bg-card);
  border-radius: var(--radius-card);
  text-align: center;
  color: var(--accent);
  font-size: 28rpx;
  font-weight: 500;
  box-shadow: var(--shadow-card);
  transition: opacity 0.15s ease;

  &:active {
    opacity: 0.6;
  }
}
</style>
