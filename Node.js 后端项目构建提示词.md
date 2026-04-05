# Server 端 — Node.js 后端项目构建提示词（含管理台）

> 本文档作为 AI 构建提示词，用于引导 AI 搭建 Server 端基础项目框架。本项目同时服务于 **客户端 API** 和 **管理台 API**，两套接口共享同一服务层和数据库，但路由前缀、鉴权策略、权限控制各自独立。AI 应根据本文档完成项目初始化、目录结构创建、基础代码编写，生成可直接运行的脚手架项目。

## 技术选型

- **运行时**：Node.js 24
- **框架**：Express.js
- **语言**：TypeScript
- **ORM**：Prisma
- **数据库**：MySQL 8.0

## 路由与接口设计原则

- **客户端 API**：前缀 `/api`，面向终端用户，使用 JWT Bearer Token 鉴权
- **管理台 API**：前缀 `/api/admin`，面向后台管理员，使用 JWT Bearer Token 鉴权 + 角色权限校验
- 所有接口统一在 `/api` 下，Nginx 只需配置一条 `location /api` 代理规则
- 两套路由共享底层 Service 和 Prisma 数据层，不重复实现业务逻辑
- 管理台接口需在中间件层校验管理员角色（如 `admin`、`super_admin`）

## 目录结构

```
server/
├── src/
│   ├── app.ts                  # Express 应用入口
│   ├── server.ts               # 服务启动文件
│   ├── config/
│   │   └── index.ts            # 配置汇总（端口、环境变量、JWT 密钥等）
│   ├── prisma/
│   │   └── schema.prisma       # Prisma 数据模型定义
│   ├── routes/
│   │   ├── index.ts            # 路由汇总，挂载 /api 和 /api/admin
│   │   ├── api/                # 客户端 API 路由
│   │   │   └── example.route.ts
│   │   └── admin/              # 管理台路由
│   │       ├── example.route.ts
│   │       └── admin-user.route.ts  # 管理员用户管理
│   ├── controllers/
│   │   ├── api/                # 客户端控制器
│   │   │   └── example.controller.ts
│   │   └── admin/              # 管理台控制器
│   │       ├── example.controller.ts
│   │       └── admin-user.controller.ts
│   ├── services/
│   │   ├── example.service.ts      # 共享业务服务
│   │   └── admin-user.service.ts   # 管理员用户服务
│   ├── middlewares/
│   │   ├── error.middleware.ts     # 全局错误处理
│   │   ├── auth.middleware.ts      # JWT 鉴权中间件
│   │   └── role.middleware.ts      # 角色权限校验中间件
│   ├── utils/
│   │   ├── response.ts         # 统一响应格式
│   │   ├── logger.ts           # 日志工具
│   │   └── jwt.ts              # JWT 签发与验证工具
│   └── types/
│       └── index.ts            # 全局类型定义（含角色枚举等）
├── package.json
├── tsconfig.json
└── .env.example
```

## 基础功能要求

1. **Express 应用**：配置 cors、body-parser、morgan 日志
2. **Prisma 集成**：初始化 Prisma，封装 PrismaClient 单例，schema.prisma 中定义示例模型和管理员用户模型（AdminUser，含 username、password_hash、role、status 等字段）
3. **全局错误处理**：统一捕获异常，返回标准错误格式
4. **统一响应格式**：封装 success / fail 响应工具函数
5. **JWT 鉴权**：封装 JWT 签发与验证工具函数，提供 auth 中间件提取并校验 Token
6. **角色权限中间件**：根据管理员角色（如 `admin`、`super_admin`）控制管理台接口访问权限
7. **客户端示例路由**：提供 `/api/health` 健康检查接口和一个示例 CRUD 路由，展示 Controller → Service → Prisma 完整调用链路
8. **管理台示例路由**：提供 `/api/admin/login` 管理员登录接口、`/api/admin/example` 管理台 CRUD 示例（需鉴权 + 权限校验），展示管理台完整链路
9. **环境变量**：`.env.example` 包含端口、DATABASE_URL、JWT_SECRET、JWT_EXPIRES_IN 等基础配置项

## 统一响应格式

```json
{ "code": 0, "message": "success", "data": {} }
{ "code": 500, "message": "错误信息", "data": null }
```

## 启动脚本

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

## 构建步骤（AI 请按顺序执行）

1. 初始化项目：`pnpm init`，安装所有依赖（含 jsonwebtoken、bcryptjs 及其类型包），配置 `tsconfig.json`
2. 初始化 Prisma：`npx prisma init`，配置 schema.prisma，定义示例模型和 AdminUser 模型
3. 创建目录结构和所有文件
4. 封装 PrismaClient 单例
5. 实现 config 模块（环境变量读取，含 JWT 配置）
6. 实现 utils（统一响应、日志、JWT 工具）
7. 实现中间件：错误处理、JWT 鉴权、角色权限校验
8. 实现管理员用户 Service（登录、密码校验）
9. 实现客户端示例 Service → Controller → Route 完整链路（`/api` 前缀）
10. 实现管理台示例 Service → Controller → Route 完整链路（`/api/admin` 前缀，含鉴权和权限中间件）
11. 在路由汇总中挂载 `/api` 路由组（其中 `/api/admin` 作为子路由组）
12. 组装 app.ts 和 server.ts
13. 编写 `.env.example`
14. 确保 `pnpm dev` 可以正常启动

## 开发环境要求

| 工具 | 版本 |
|------|------|
| Node.js | >= 18.0 |
| pnpm | 最新稳定版 |

## 快速启动

```bash
cd server
cp .env.example .env
pnpm install
pnpm dev                  # 默认监听 3000 端口
```

---

> **给 AI 的提示**：本文档用于搭建 Server 端基础项目框架（含管理台），不涉及具体业务逻辑。请生成可直接运行的脚手架代码，包含客户端 API 和管理台 API 两套完整的示例链路（从路由到服务层），方便后续在此基础上扩展业务功能。管理台路由需体现鉴权 + 角色权限的完整中间件链路。所有函数和方法必须添加注释，说明其用途。
