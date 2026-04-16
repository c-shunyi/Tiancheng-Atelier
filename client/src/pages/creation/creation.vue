<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useToast } from "@wot-ui/ui";
import {
  createCreation,
  getCreation,
  listCreations,
  retryCreation,
} from "@/api/creation";
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
const createOpen = ref(false);

const canSubmit = computed(
  () => !submitting.value && !!sourcePath.value && selectedPromptId.value !== null,
);

const selectedPreset = computed(() =>
  presets.value.find((p) => p.id === selectedPromptId.value) ?? null,
);

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

function openCreate() {
  if (!ensureLogin()) return;
  createOpen.value = true;
}

function closeCreate() {
  if (submitting.value) return;
  createOpen.value = false;
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
    createOpen.value = false;

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

const retrying = ref(new Set<number>());

async function handleRetry(task: Creation) {
  if (retrying.value.has(task.id)) return;
  retrying.value.add(task.id);
  try {
    const updated = await retryCreation(task.id);
    const index = tasks.value.findIndex((t) => t.id === task.id);
    if (index !== -1) tasks.value[index] = updated;
    startPolling(updated.id);
    try {
      const profile = await getProfile();
      userStore.setUser(profile);
    } catch {
      /* 刷新失败不影响本次重试提示 */
    }
    toast.success("已重新提交");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "重试失败");
  } finally {
    retrying.value.delete(task.id);
  }
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
    tasks.value = [];
    for (const timer of pollTimers.values()) clearInterval(timer);
    pollTimers.clear();
  }
});

// 弹窗打开时锁定外层页面滚动，避免穿透
watch([createOpen, pickerOpen], ([c, p]) => {
  // #ifdef H5
  if (typeof document !== "undefined") {
    document.body.style.overflow = c || p ? "hidden" : "";
  }
  // #endif
});

onUnmounted(() => {
  for (const timer of pollTimers.values()) clearInterval(timer);
  pollTimers.clear();
  // #ifdef H5
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
  }
  // #endif
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
        <view class="quota-main">
          <text class="quota-label">今日免费次数</text>
          <text class="quota-value">
            <text class="quota-remaining">{{ userStore.user.freeQuotaRemaining }}</text>
            <text class="quota-total"> / {{ userStore.user.freeQuotaLimit }}</text>
          </text>
        </view>
      </view>

      <view v-if="tasks.length === 0" class="empty">
        <text class="empty-title">还没有创作</text>
        <text class="empty-desc">点击右下角按钮开始你的第一次创作</text>
      </view>

      <view v-else class="grid">
        <view
          v-for="task in tasks"
          :key="task.id"
          class="cell"
          :class="`cell--${task.status}`"
          @click="goDetail(task)"
        >
          <image
            v-if="task.status === 'success' && task.resultUrl"
            class="cell-image"
            :src="task.resultUrl"
            mode="aspectFill"
          />
          <view v-else class="cell-image cell-image--placeholder">
            <wd-tag
              v-if="task.status === 'pending'"
              type="primary"
              plain
              custom-class="cell-tag"
            >
              生成中
            </wd-tag>
            <wd-tag v-else type="danger" plain custom-class="cell-tag">失败</wd-tag>
          </view>
          <view class="cell-overlay">
            <text class="cell-time">{{ task.createdAt.slice(5, 16).replace("T", " ") }}</text>
            <view
              v-if="task.status === 'success'"
              class="cell-save"
              @click.stop="saveResult(task)"
            >
              <text>保存</text>
            </view>
            <view
              v-else-if="task.status === 'failed'"
              class="cell-retry"
              :class="{ 'cell-retry--loading': retrying.has(task.id) }"
              @click.stop="handleRetry(task)"
            >
              <text>{{ retrying.has(task.id) ? "重试中…" : "重试" }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!createOpen" class="fab" @click="openCreate">
        <text class="fab-plus">+</text>
      </view>

      <wd-popup
        v-model="createOpen"
        position="bottom"
        :safe-area-inset-bottom="true"
        :close-on-click-modal="!submitting"
        custom-style="border-radius: 28rpx 28rpx 0 0; background: var(--bg-grouped);"
        @close="closeCreate"
      >
        <view class="sheet">
          <view class="sheet-header">
            <text class="sheet-title">新建创作</text>
            <wd-icon name="close" size="20px" custom-class="sheet-close" @click="closeCreate" />
          </view>

          <scroll-view scroll-y class="sheet-body">
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
                :label="selectedPreset?.description"
                is-link
                clickable
                @click="openPicker"
              />
            </view>
          </scroll-view>

          <view class="sheet-footer">
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
          </view>
        </view>
      </wd-popup>

      <wd-popup
        v-model="pickerOpen"
        position="bottom"
        :safe-area-inset-bottom="true"
        custom-style="border-radius: 28rpx 28rpx 0 0;"
        @close="closePicker"
      >
        <view class="picker-panel">
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
                <view v-if="preset.description" class="preset-desc">
                  {{ preset.description }}
                </view>
              </view>
            </view>
          </scroll-view>
        </view>
      </wd-popup>
    </template>

    <wd-toast />
    <wd-dialog />
    <wd-notify />
  </view>
</template>

<style lang="scss" scoped>
.page {
  padding: 24rpx 28rpx 200rpx;
  min-height: 100vh;
  box-sizing: border-box;
}

.quota {
  padding: 24rpx 28rpx;
  margin-bottom: 32rpx;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.08), rgba(88, 86, 214, 0.08));
  border-radius: var(--radius-card);
  border: 0.5rpx solid rgba(0, 122, 255, 0.15);

  .quota-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .quota-label {
    font-size: 26rpx;
    color: var(--text-secondary);
    letter-spacing: 0.2rpx;
  }

  .quota-value {
    font-variant-numeric: tabular-nums;

    .quota-remaining {
      font-size: 44rpx;
      font-weight: 700;
      color: var(--accent);
      letter-spacing: -0.5rpx;
    }

    .quota-total {
      font-size: 26rpx;
      color: var(--text-tertiary);
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

.empty {
  margin-top: 160rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 0 48rpx;

  .empty-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-primary);
  }

  .empty-desc {
    font-size: 26rpx;
    color: var(--text-tertiary);
    text-align: center;
    line-height: 1.5;
  }
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.cell {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-card);
  background: var(--bg-card);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: transform 0.15s ease;

  &:active {
    transform: scale(0.98);
  }

  &--pending .cell-image,
  &--failed .cell-image {
    opacity: 0.9;
  }

  .cell-image {
    width: 100%;
    height: 100%;
    background: var(--bg-tint);

    &--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .cell-overlay {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 16rpx 20rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0));
    color: #fff;
  }

  .cell-time {
    font-size: 22rpx;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.2rpx;
  }

  .cell-save,
  .cell-retry {
    padding: 6rpx 16rpx;
    font-size: 22rpx;
    font-weight: 500;
    border-radius: var(--radius-pill);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .cell-save {
    background: rgba(255, 255, 255, 0.28);
  }

  .cell-retry {
    background: rgba(255, 255, 255, 0.28);
    color: #fff;

    &--loading {
      opacity: 0.6;
    }
  }
}

:deep(.cell-tag) {
  font-size: 22rpx !important;
}

.fab {
  position: fixed;
  right: 40rpx;
  bottom: calc(env(safe-area-inset-bottom, 0) + 48rpx);
  /* #ifdef H5 */
  bottom: calc(env(safe-area-inset-bottom, 0) + 70px + 32rpx);
  /* #endif */
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 32rpx rgba(0, 122, 255, 0.35),
    0 4rpx 12rpx rgba(0, 0, 0, 0.12);
  z-index: 50;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:active {
    transform: scale(0.94);
    box-shadow: 0 6rpx 16rpx rgba(0, 122, 255, 0.35);
  }

  .fab-plus {
    font-size: 64rpx;
    line-height: 1;
    font-weight: 300;
    margin-top: -6rpx;
  }
}

.sheet {
  width: 100vw;
  height: 85vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: var(--bg-grouped);
  overflow: hidden;
  /* #ifdef H5 */
  padding-bottom: 70px; /* 让位 H5 自定义 tabBar */
  /* #endif */
}

.sheet-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 28rpx 16rpx;
  background: var(--bg-grouped);
  box-sizing: border-box;

  .sheet-title {
    font-size: 34rpx;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: 0.2rpx;
  }
}

.sheet-close {
  color: var(--text-tertiary);
  padding: 8rpx 16rpx;
}

.sheet-body {
  flex: 1;
  min-height: 0;
  padding: 8rpx 28rpx 24rpx;
  box-sizing: border-box;
}

.sheet-footer {
  flex-shrink: 0;
  padding: 16rpx 28rpx 24rpx;
  background: var(--bg-grouped);
  border-top: 0.5rpx solid var(--separator);
  box-sizing: border-box;
}

.card {
  width: 100%;
  background: var(--bg-card);
  border-radius: var(--radius-card);
  padding: 28rpx 24rpx 24rpx;
  margin-bottom: 20rpx;
  box-shadow: var(--shadow-card);
  box-sizing: border-box;

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

.picker-panel {
  width: 100vw;
  height: 75vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: var(--bg-card);
  overflow: hidden;
}

.picker-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 28rpx 20rpx;
  border-bottom: 0.5rpx solid var(--separator);
  background: var(--bg-card);
  box-sizing: border-box;

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
  min-height: 0;
  padding: 20rpx 28rpx 32rpx;
  box-sizing: border-box;
  /* #ifdef H5 */
  padding-bottom: calc(32rpx + 70px);
  /* #endif */
}

.preset {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  gap: 20rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  background: #fafafa;
  border: 2rpx solid transparent;
  border-radius: 20rpx;
  transition: all 0.2s ease;

  &:last-child {
    margin-bottom: 0;
  }

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

.preset-desc {
  font-size: 24rpx;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.submit-btn) {
  border-radius: var(--radius-button) !important;
  height: 96rpx !important;
  font-size: 32rpx !important;
  font-weight: 600 !important;
  letter-spacing: 0.5rpx !important;
}
</style>
