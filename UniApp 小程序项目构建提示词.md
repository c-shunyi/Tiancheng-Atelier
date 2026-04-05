# Client 端 — UniApp 小程序项目构建提示词

> 本文档作为 AI 构建提示词，用于引导 AI 搭建 Client 端基础项目框架。AI 应根据本文档完成项目初始化、目录结构创建、基础代码编写，生成可直接运行的脚手架项目。

## 技术选型

- **框架**：UniApp（Vue3 组合式 API + Vite）
- **语言**：JavaScript
- **UI 库**：uni-ui
- **状态管理**：Pinia
- **网络请求**：封装 uni.request
- **目标平台**：微信小程序（优先）
- **创建方式**：`npx degit dcloudio/uni-preset-vue#vite client`

## uni-ui 组件库集成

1. 安装：`pnpm add @dcloudio/uni-ui`
2. 在 `pages.json` 顶层添加 easycom 配置，实现组件自动导入：

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^uni-(.*)": "@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue"
    }
  },
  "pages": [...]
}
```

3. 配置完成后，模板中直接使用 `<uni-xxx>` 组件，无需在 `<script>` 中 import

**常用组件速查**：

| 组件 | 标签 | 用途 |
|------|------|------|
| Badge | `<uni-badge>` | 数字角标 |
| Card | `<uni-card>` | 卡片容器 |
| Collapse | `<uni-collapse>` | 折叠面板 |
| CountDown | `<uni-countdown>` | 倒计时 |
| Drawer | `<uni-drawer>` | 抽屉 |
| Fab | `<uni-fab>` | 悬浮按钮 |
| Fav | `<uni-fav>` | 收藏按钮 |
| Forms | `<uni-forms>` + `<uni-forms-item>` | 表单验证 |
| GoodsNav | `<uni-goods-nav>` | 商品导航栏 |
| Grid | `<uni-grid>` + `<uni-grid-item>` | 宫格布局 |
| Icons | `<uni-icons>` | 图标 |
| IndexedList | `<uni-indexed-list>` | 索引列表 |
| List | `<uni-list>` + `<uni-list-item>` | 列表 |
| LoadMore | `<uni-load-more>` | 加载更多 |
| NavBar | `<uni-nav-bar>` | 自定义导航栏 |
| NoticeBar | `<uni-notice-bar>` | 通告栏 |
| NumberBox | `<uni-number-box>` | 数字输入框 |
| Pagination | `<uni-pagination>` | 分页 |
| Popup | `<uni-popup>` | 弹出层 |
| Rate | `<uni-rate>` | 评分 |
| SearchBar | `<uni-search-bar>` | 搜索栏 |
| Section | `<uni-section>` | 标题栏 |
| SegmentedControl | `<uni-segmented-control>` | 分段器 |
| Steps | `<uni-steps>` | 步骤条 |
| SwipeAction | `<uni-swipe-action>` | 滑动操作 |
| SwiperDot | `<uni-swiper-dot>` | 轮播图指示点 |
| Tag | `<uni-tag>` | 标签 |
| Tooltip | `<uni-tooltip>` | 提示 |
| Transition | `<uni-transition>` | 过渡动画 |

**使用示例**：

```vue
<template>
  <uni-card title="标题" sub-title="副标题">
    <text>卡片内容</text>
  </uni-card>

  <uni-list>
    <uni-list-item title="列表项" note="描述" showArrow />
  </uni-list>

  <uni-icons type="search" size="24" color="#007AFF" />

  <uni-search-bar placeholder="搜索" @confirm="onSearch" />
</template>
```

> **给 AI 的提示**：编写页面时优先使用 uni-ui 组件，不要重复造轮子。所有 `uni-` 前缀组件通过 easycom 自动注册，在 `<template>` 中直接使用即可，不需要在 `<script>` 中 import。

## 基础功能要求

1. **请求封装**（api/request.js）：
   - baseURL 从配置读取
   - 自动携带 token（从本地存储读取）
   - 401 状态码自动跳转登录
   - 统一错误提示（uni.showToast）
   - 支持 loading 状态控制
2. **Pinia 状态管理**：初始化配置，提供示例 store
3. **本地存储封装**：对 uni.setStorageSync / getStorageSync 的封装
4. **页面路由**：pages.json 配置首页和个人中心，TabBar 包含首页和个人中心
5. **示例页面**：首页展示基本布局，个人中心展示从 store 读取用户信息

## TabBar 配置

```
首页 (index) | 我的 (user/index)
```

## 构建步骤（AI 请按顺序执行）

1. 使用 `npx degit dcloudio/uni-preset-vue#vite client` 创建项目
2. 安装依赖：`pnpm install`，再安装 pinia、uni-ui
3. 配置 pages.json（页面路由、tabBar、全局样式）
4. 封装请求模块（api/request.js）
5. 封装工具函数（storage、format）
6. 配置 Pinia Store（示例）
7. 实现首页和个人中心页面
8. 确保 `pnpm dev:mp-weixin` 可以正常编译，用微信开发者工具打开 `dist/dev/mp-weixin`

## 开发环境要求

| 工具 | 版本 |
|------|------|
| Node.js | >= 18.0 |
| pnpm | 最新稳定版 |
| 微信开发者工具 | 最新稳定版 |

## 快速启动

```bash
cd client
pnpm install
pnpm dev:mp-weixin        # 编译微信小程序，用微信开发者工具打开 dist/dev/mp-weixin
```

---

> **给 AI 的提示**：本文档用于搭建 Client 端基础项目框架，不涉及具体业务逻辑。请生成可直接运行的脚手架代码，包含完整的示例链路，方便后续在此基础上扩展业务功能。所有函数和方法必须添加注释，说明其用途。
