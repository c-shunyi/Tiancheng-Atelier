<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useDialog, useToast } from "@wot-ui/ui";
import { deleteAddress, listAddresses, updateAddress } from "@/api/address";
import type { Address } from "@/types/api";

const toast = useToast();
const dialog = useDialog();

const list = ref<Address[]>([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    list.value = await listAddresses();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "加载失败");
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  load();
});

function goCreate() {
  uni.navigateTo({ url: "/pages/address-edit/address-edit" });
}

function goEdit(item: Address) {
  uni.navigateTo({ url: `/pages/address-edit/address-edit?id=${item.id}` });
}

async function setDefault(item: Address) {
  if (item.isDefault) return;
  try {
    await updateAddress(item.id, { isDefault: true });
    toast.success("已设为默认");
    load();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "设置失败");
  }
}

async function confirmDelete(item: Address) {
  try {
    await dialog.confirm({
      title: "删除地址",
      msg: "确定要删除这条地址吗？",
      confirmButtonText: "删除",
    });
  } catch {
    return;
  }
  try {
    await deleteAddress(item.id);
    list.value = list.value.filter((a) => a.id !== item.id);
    toast.success("已删除");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "删除失败");
  }
}
</script>

<template>
  <view class="page">
    <view v-if="list.length === 0 && !loading" class="empty">
      <text>还没有收货地址</text>
    </view>

    <view v-else class="list">
      <view v-for="item in list" :key="item.id" class="item">
        <view class="header" @click="goEdit(item)">
          <view class="name-row">
            <text class="name">{{ item.name }}</text>
            <text class="phone">{{ item.phone }}</text>
            <wd-tag v-if="item.isDefault" type="primary" plain custom-class="default-tag">默认</wd-tag>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="region" @click="goEdit(item)">
          <text>{{ item.province }} {{ item.city }} {{ item.district }}</text>
        </view>
        <view class="detail" @click="goEdit(item)">
          <text>{{ item.detail }}</text>
        </view>
        <view class="actions">
          <text
            class="action"
            :class="{ disabled: item.isDefault }"
            @click="setDefault(item)"
          >
            {{ item.isDefault ? "已是默认" : "设为默认" }}
          </text>
          <text class="action danger" @click="confirmDelete(item)">删除</text>
        </view>
      </view>
    </view>

    <view class="footer">
      <wd-button type="primary" block size="large" @click="goCreate">
        + 新增地址
      </wd-button>
    </view>

    <wd-toast />
    <wd-dialog />
    <wd-notify />
  </view>
</template>

<style lang="scss" scoped>
.page {
  padding: 24rpx 28rpx 180rpx;
  min-height: 100vh;
  box-sizing: border-box;
}

.empty {
  margin-top: 200rpx;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 28rpx;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.item {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  padding: 28rpx 24rpx;
  box-shadow: var(--shadow-card);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;

  .name-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    flex-wrap: wrap;
  }

  .name {
    font-size: 30rpx;
    font-weight: 600;
    color: var(--text-primary);
  }

  .phone {
    font-size: 26rpx;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }

  :deep(.default-tag) {
    margin-left: 4rpx;
  }

  .arrow {
    color: var(--text-tertiary);
    font-size: 32rpx;
  }
}

.region {
  font-size: 26rpx;
  color: var(--text-secondary);
  margin-bottom: 4rpx;
}

.detail {
  font-size: 26rpx;
  color: var(--text-primary);
  line-height: 1.5;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 40rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid var(--separator);

  .action {
    font-size: 26rpx;
    color: var(--accent);

    &.disabled {
      color: var(--text-tertiary);
    }

    &.danger {
      color: var(--danger);
    }
  }
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 28rpx calc(env(safe-area-inset-bottom) + 20rpx);
  background: var(--bg-card);
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
}
</style>
