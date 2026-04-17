<script setup lang="ts">
function copyEmail() {
  uni.setClipboardData({
    data: "yade4054@gmail.com",
    success: () => uni.showToast({ title: "已复制", icon: "success" }),
  });
}
</script>

<template>
  <view class="page">
    <view class="section">
      <text class="section-title">关于我们</text>
      <view class="card">
        <text class="app-name">Tiancheng Atelier</text>
        <text class="app-desc">
          Tiancheng Atelier 是一款 AI 驱动的图像创作平台，只需上传一张参考图并选择风格，即可快速生成独特的艺术作品。
        </text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">联系我们</text>
      <view class="card">
        <view class="contact-row" @click="copyEmail">
          <text class="contact-label">邮箱</text>
          <view class="contact-value-wrap">
            <text class="contact-value">yade4054@gmail.com</text>
            <text class="copy-hint">点击复制</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  padding: 32rpx 28rpx 48rpx;
  min-height: 100vh;
  box-sizing: border-box;
}

.section {
  margin-bottom: 40rpx;

  .section-title {
    display: block;
    font-size: 26rpx;
    color: var(--text-secondary);
    margin-bottom: 16rpx;
    padding-left: 8rpx;
    letter-spacing: 0.3rpx;
  }
}

.card {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 32rpx 28rpx;
}

.app-name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16rpx;
  letter-spacing: 0.3rpx;
}

.app-desc {
  display: block;
  font-size: 28rpx;
  color: var(--text-secondary);
  line-height: 1.7;
}

.contact-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 0;

  .contact-label {
    font-size: 30rpx;
    color: var(--text-primary);
  }

  .contact-value-wrap {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .contact-value {
    font-size: 28rpx;
    color: var(--text-secondary);
  }

  .copy-hint {
    font-size: 22rpx;
    color: var(--accent);
  }
}
</style>
