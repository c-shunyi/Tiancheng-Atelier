<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { deleteCreation, listCreations } from "@/api/creation";
import { useUserStore } from "@/store/user";
import type { Creation } from "@/types/api";

const PAGE_SIZE = 20;

const userStore = useUserStore();
const list = ref<Creation[]>([]);
const page = ref(1);
const total = ref(0);
const loading = ref(false);
const finished = ref(false);

function resetAndLoad() {
  list.value = [];
  page.value = 1;
  total.value = 0;
  finished.value = false;
  loadMore();
}

async function loadMore() {
  if (loading.value || finished.value) return;
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: "请先登录", icon: "none" });
    return;
  }
  loading.value = true;
  try {
    const data = await listCreations({ page: page.value, pageSize: PAGE_SIZE });
    list.value = page.value === 1 ? data.list : [...list.value, ...data.list];
    total.value = data.total;
    finished.value = list.value.length >= data.total;
    if (!finished.value) page.value += 1;
  } catch (err) {
    const message = err instanceof Error ? err.message : "加载失败";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  resetAndLoad();
});

function previewResult(item: Creation) {
  if (!item.resultUrl) return;
  uni.previewImage({ urls: [item.resultUrl], current: item.resultUrl });
}

function confirmDelete(item: Creation) {
  uni.showModal({
    title: "删除创作",
    content: "确定要删除这条记录吗？",
    confirmColor: "#ef4444",
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await deleteCreation(item.id);
        list.value = list.value.filter((c) => c.id !== item.id);
        total.value = Math.max(0, total.value - 1);
        uni.showToast({ title: "已删除", icon: "success" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "删除失败";
        uni.showToast({ title: message, icon: "none" });
      }
    },
  });
}
</script>

<template>
  <view class="page">
    <view v-if="list.length === 0 && !loading" class="empty">
      <text>暂无创作记录</text>
    </view>

    <view v-else class="list">
      <view
        v-for="item in list"
        :key="item.id"
        class="item"
        @click="previewResult(item)"
        @longpress="confirmDelete(item)"
      >
        <image
          v-if="item.resultUrl"
          class="thumb"
          :src="item.resultUrl"
          mode="aspectFill"
        />
        <view v-else class="thumb placeholder">
          <text>{{ item.status === "failed" ? "失败" : "处理中" }}</text>
        </view>
        <view class="info">
          <text class="prompt">{{ item.prompt }}</text>
          <text class="meta">{{ item.createdAt.slice(0, 19).replace("T", " ") }}</text>
        </view>
      </view>
    </view>

    <view v-if="loading" class="hint">加载中…</view>
    <view v-else-if="finished && list.length > 0" class="hint">已经到底啦</view>
    <view
      v-else-if="!finished && list.length > 0"
      class="hint link"
      @click="loadMore"
    >
      点击加载更多
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

.empty {
  margin-top: 200rpx;
  text-align: center;
  color: #94a3b8;
  font-size: 28rpx;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.item {
  display: flex;
  gap: 20rpx;
  padding: 20rpx;
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);

  .thumb {
    width: 180rpx;
    height: 180rpx;
    border-radius: 12rpx;
    background: #f1f5f9;
    flex-shrink: 0;

    &.placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      font-size: 24rpx;
    }
  }

  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;

    .prompt {
      font-size: 28rpx;
      color: #1f2937;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .meta {
      font-size: 22rpx;
      color: #94a3b8;
      margin-top: 8rpx;
    }
  }
}

.hint {
  margin-top: 32rpx;
  text-align: center;
  color: #94a3b8;
  font-size: 24rpx;

  &.link {
    color: #3b82f6;
  }
}
</style>
