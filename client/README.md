# Tiancheng Atelier Client

基于 `uni-app x` 的微信小程序基础项目骨架，已包含：

- 首页、我的、登录三页结构
- `pages.json` tabBar 与 `uni-ui easycom`
- `api/request.uts` 请求封装
- `utils/storage.uts` 本地存储封装
- `store/user.uts` 轻量全局状态管理

## 安装依赖

```bash
cd client
pnpm install
```

## 运行到微信小程序

### 方式一：HBuilderX 图形界面

1. 用 HBuilderX 打开 `client`
2. 右键项目
3. 选择“运行到小程序模拟器 -> 微信开发者工具”

### 方式二：HBuilderX CLI

官方文档说明 `uni-app x` 需要通过 HBuilderX 创建和发行，但支持使用 CLI 执行微信小程序编译。

先确保本机存在 CLI：

- macOS 默认路径：`/Applications/HBuilderX.app/Contents/MacOS/cli`
- 或手动设置环境变量：`HBUILDERX_CLI=/your/path/to/cli`

仅编译：

```bash
pnpm dev:mp-weixin
```

如果 CLI 提示“需要先登录”，请先登录 HBuilderX 账号：

```bash
/Applications/HBuilderX.app/Contents/MacOS/cli user login --username 你的账号 --password 你的密码
```

编译并上传微信平台：

```bash
WX_UPLOAD=true \
WX_APPID=你的小程序appid \
WX_PRIVATEKEY=/abs/path/to/private.key \
WX_VERSION=0.1.0 \
WX_DESC='基础骨架上传' \
pnpm dev:mp-weixin
```

## 目录说明

```text
client
├─ api
├─ common
├─ config
├─ pages
├─ static
├─ store
├─ types
└─ utils
```

## 说明

- `BASE_URL` 当前是占位地址：`https://example.com/api`
- 接入真实后端时，请同步在微信公众平台配置合法请求域名
- 由于 `uni-app x` 与传统 `uni-app + Vite` 的工程模型不同，本项目优先保证 `uni-app x` 结构和微信小程序兼容性
