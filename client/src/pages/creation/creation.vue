<script setup lang="ts">
import { computed, ref } from "vue";
import { createCreation } from "@/api/creation";
import { useUserStore } from "@/store/user";
import type { Creation } from "@/types/api";

const PROMPT_MAX = 300;

const userStore = useUserStore();
const sourcePath = ref("");
const prompt = ref("");
const generating = ref(false);
const result = ref<Creation | null>(null);

const promptLen = computed(() => prompt.value.length);
const canGenerate = computed(
  () => !generating.value && !!sourcePath.value && prompt.value.trim().length > 0,
);

function ensureLogin(): boolean {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: "请先登录", icon: "none" });
    setTimeout(() => uni.navigateTo({ url: "/pages/login/login" }), 600);
    return false;
  }
  return true;
}

function chooseImage() {
  if (generating.value) return;
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
  if (generating.value) return;
  sourcePath.value = "";
}

async function handleGenerate() {
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

  generating.value = true;
  uni.showLoading({ title: "生成中…", mask: true });
  try {
    const data = await createCreation({ filePath: sourcePath.value, prompt: trimmed });
    result.value = data;
    uni.showToast({ title: "生成成功", icon: "success" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "生成失败";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    uni.hideLoading();
    generating.value = false;
  }
}

function saveResult() {
  if (!result.value?.resultUrl) return;
  uni.downloadFile({
    url: result.value.resultUrl,
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

function previewResult() {
  if (!result.value?.resultUrl) return;
  uni.previewImage({ urls: [result.value.resultUrl], current: result.value.resultUrl });
}

function goHistory() {
  uni.navigateTo({ url: "/pages/creation-history/creation-history" });
}
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
        :disabled="generating"
      />
      <view class="counter">{{ promptLen }} / {{ PROMPT_MAX }}</view>
    </view>

    <button
      class="primary"
      :loading="generating"
      :disabled="!canGenerate"
      @click="handleGenerate"
    >
      {{ generating ? "生成中..." : "开始生成" }}
    </button>

    <view v-if="result" class="card result">
      <view class="card-title">生成结果</view>
      <image
        class="result-image"
        :src="result.resultUrl"
        mode="widthFix"
        @click="previewResult"
      />
      <button class="ghost" @click="saveResult">保存到相册</button>
    </view>

    <view class="history-entry" @click="goHistory">
      <text>我的创作 ›</text>
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

.ghost {
  margin-top: 16rpx;
  background: #ffffff;
  color: #3b82f6;
  border: 1rpx solid #3b82f6;
  border-radius: 12rpx;
  font-size: 28rpx;
  height: 80rpx;
  line-height: 80rpx;
}

.result {
  .result-image {
    width: 100%;
    border-radius: 12rpx;
    margin-top: 8rpx;
    background: #f1f5f9;
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
