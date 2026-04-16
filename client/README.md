# Tiancheng Atelier · Client

uni-app + Vue3 + Vite + TypeScript 客户端，支持 H5 / 微信小程序 / App。

## 环境

- Node.js >= 18
- pnpm >= 8

## 快速开始

```bash
pnpm install
cp .env.example .env        # 配置 VITE_API_BASE_URL
pnpm dev:h5                 # 开发：H5
pnpm dev:mp-weixin          # 开发：微信小程序（产物输出到 dist/dev/mp-weixin，用微信开发者工具打开）
pnpm build:mp-weixin        # 构建：微信小程序
```

## 目录结构

```
src/
├── api/          请求封装 + 业务接口
├── config/       常量与运行时配置
├── pages/        页面（index / login / user）
├── store/        Pinia store
├── static/       静态资源
├── types/        类型声明
├── App.vue
├── main.ts
├── manifest.json
└── pages.json
```

## 后端联调

后端基础地址配置在 `.env` 的 `VITE_API_BASE_URL`，默认 `http://localhost:3000/api`。已对接接口：

- `POST /wx/login` 微信小程序登录
- `GET  /wx/profile` 获取当前用户资料
- `PUT  /wx/profile` 更新当前用户资料
