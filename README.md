# Minesweeper Online

在线扫雷游戏，支持多人实时对战。

## 技术栈

### 后端 (backend)
- **框架**: NestJS + TypeScript
- **API**: Apollo GraphQL + Subscriptions (WebSocket 实时推送)
- **ORM**: Prisma
- **包管理**: Bun

### 前端 (webapp)
- **框架**: React 19 + TypeScript
- **构建**: Vite
- **样式**: Tailwind CSS 4 + Radix UI
- **状态管理**: Zustand
- **GraphQL**: urql (支持 Subscriptions)

## 项目结构

```
minesweeper/
├── contract/                 # 契约目录（唯一事实源）
│   ├── schema.graphql        # GraphQL Schema 定义
│   ├── common.yaml          # REST API 共享类型
│   └── requests/            # 契约变更请求
│       ├── pending/         # 待处理请求
│       ├── approved/        # 已批准请求
│       └── rejected/        # 已拒绝请求
├── backend/                  # 后端子项目
│   ├── prisma/              # 数据库模型
│   ├── src/                 # 源代码
│   └── .opencode/agents/    # Agent 配置
└── webapp/                  # 前端子项目
    ├── src/                 # 源代码
    └── .opencode/agents/    # Agent 配置
```

## 契约驱动开发

本项目采用 **Schema First** 开发模式：

1. 所有 API 定义首先在 `contract/schema.graphql` 中声明
2. 后端和前端各自根据契约生成类型
3. 后端和前端独立开发，但必须符合契约定义

### 契约变更流程

如需修改 API：
1. 在 `contract/requests/pending/` 下创建变更请求文件
2. 描述变更动机、影响范围和具体方案
3. 等待批准后实施

## 开发指南

### 后端开发

```bash
cd backend

# 安装依赖
bun install

# 生成 Prisma 客户端
bun run prisma:generate

# 运行数据库迁移
bun run prisma:migrate

# 启动开发服务器
bun run start:dev
```

### 前端开发

```bash
cd webapp

# 安装依赖
bun install

# 生成 GraphQL 类型
bun run codegen:all

# 启动开发服务器
bun run dev
```

## 实时推送

后端使用 GraphQL Subscriptions 通过 WebSocket 向前端推送：
- 游戏状态变更（玩家加入/离开、游戏开始/结束）
- 格子状态更新
- 计时器同步

前端使用 urql 的 `useSubscription` Hook 接收实时数据。

## License

MIT