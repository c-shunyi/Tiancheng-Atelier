<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useToast } from "@wot-ui/ui";
import { pcaTextArr } from "element-china-area-data";
import { createAddress, getAddress, updateAddress } from "@/api/address";
import type { AddressInput } from "@/types/api";

const toast = useToast();

const editingId = ref<number | null>(null);
const name = ref("");
const phone = ref("");
const province = ref("");
const city = ref("");
const district = ref("");
const detail = ref("");
const isDefault = ref(false);
const saving = ref(false);
const pickerVisible = ref(false);
const pickerValue = ref<string[]>([]);

const isEdit = computed(() => editingId.value !== null);
const regionText = computed(() =>
  province.value ? `${province.value} ${city.value} ${district.value}` : "",
);

const regionColumns = pcaTextArr;

async function loadExisting(id: number) {
  try {
    const row = await getAddress(id);
    name.value = row.name;
    phone.value = row.phone;
    province.value = row.province;
    city.value = row.city;
    district.value = row.district;
    detail.value = row.detail;
    isDefault.value = row.isDefault;
    pickerValue.value = [row.province, row.city, row.district];
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "加载失败");
    setTimeout(() => uni.navigateBack(), 500);
  }
}

onLoad((query) => {
  const id = Number(query?.id);
  if (Number.isInteger(id) && id > 0) {
    editingId.value = id;
    loadExisting(id);
  }
});

function openPicker() {
  pickerVisible.value = true;
}

function onPickerConfirm(e: { value: string[] }) {
  const [p, c, d] = e.value ?? [];
  province.value = p ?? "";
  city.value = c ?? "";
  district.value = d ?? "";
}

async function handleSave() {
  if (saving.value) return;
  const trimmedName = name.value.trim();
  const trimmedPhone = phone.value.trim();
  const trimmedDetail = detail.value.trim();

  if (!trimmedName) return toast.show("请填写收件人");
  if (!/^1[3-9]\d{9}$/.test(trimmedPhone)) return toast.show("手机号格式不正确");
  if (!province.value || !city.value || !district.value) return toast.show("请选择所在地区");
  if (!trimmedDetail) return toast.show("请填写详细地址");

  const payload: AddressInput = {
    name: trimmedName,
    phone: trimmedPhone,
    province: province.value,
    city: city.value,
    district: district.value,
    detail: trimmedDetail,
    isDefault: isDefault.value,
  };

  saving.value = true;
  try {
    if (editingId.value !== null) {
      await updateAddress(editingId.value, payload);
    } else {
      await createAddress(payload);
    }
    toast.success("已保存");
    setTimeout(() => uni.navigateBack(), 400);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "保存失败");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <view class="page">
    <view class="card">
      <view class="field">
        <text class="label">收件人</text>
        <input
          v-model="name"
          class="input"
          placeholder="请输入姓名"
          :maxlength="32"
        />
      </view>

      <view class="field">
        <text class="label">手机号</text>
        <input
          v-model="phone"
          class="input"
          type="number"
          placeholder="请输入手机号"
          :maxlength="11"
        />
      </view>

      <view class="field" @click="openPicker">
        <text class="label">所在地区</text>
        <view class="input as-picker">
          <text v-if="regionText" class="region-text">{{ regionText }}</text>
          <text v-else class="placeholder">请选择省/市/区</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="field column">
        <text class="label">详细地址</text>
        <textarea
          v-model="detail"
          class="textarea"
          placeholder="街道、门牌号等"
          :maxlength="255"
          auto-height
        />
      </view>

      <view class="field row-between">
        <text class="label">设为默认</text>
        <wd-switch v-model="isDefault" />
      </view>
    </view>

    <wd-button
      type="primary"
      block
      size="large"
      :loading="saving"
      :disabled="saving"
      custom-class="save-btn"
      @click="handleSave"
    >
      {{ saving ? "保存中..." : isEdit ? "保存修改" : "保存地址" }}
    </wd-button>

    <wd-picker
      v-model="pickerValue"
      v-model:visible="pickerVisible"
      :columns="regionColumns"
      :cascade="true"
      title="选择地区"
      @confirm="onPickerConfirm"
    />

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

.card {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  padding: 8rpx 24rpx;
  margin-bottom: 24rpx;
  box-shadow: var(--shadow-card);
}

.field {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--separator);

  &:last-child {
    border-bottom: none;
  }

  &.column {
    flex-direction: column;
    align-items: stretch;
    gap: 12rpx;
  }

  &.row-between {
    justify-content: space-between;
  }

  .label {
    flex-shrink: 0;
    width: 160rpx;
    font-size: 28rpx;
    color: var(--text-primary);
  }

  .input {
    flex: 1;
    font-size: 28rpx;
    color: var(--text-primary);

    &.as-picker {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .placeholder {
      color: var(--text-tertiary);
    }

    .region-text {
      color: var(--text-primary);
    }

    .arrow {
      color: var(--text-tertiary);
      font-size: 32rpx;
    }
  }

  .textarea {
    width: 100%;
    min-height: 120rpx;
    font-size: 28rpx;
    color: var(--text-primary);
    line-height: 1.6;
  }
}

:deep(.save-btn) {
  margin-top: 16rpx;
}
</style>
