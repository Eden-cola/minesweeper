# Minesweeper Webapp Agent 开发规范

## Schema First

API 定义在 `../contract/` 目录，包含：
- `../contract/schema.graphql` — GraphQL Schema
- `../contract/common.yaml` — REST API 公共类型定义

### 工具链

| 用途 | 工具 | 说明 |
|------|------|------|
| GraphQL 类型生成 | `@graphql-codegen/client-preset` | 生成 TypedDocumentNode |
| OpenAPI 类型生成 | `openapi-typescript` | 从 YAML 生成类型 |
| OpenAPI 客户端 | `openapi-fetch` | type-safe fetch 客户端 |

## 开发流程

1. **修改 contract 中的 schema 定义**
2. **运行 codegen 生成类型**
   ```bash
   bun run codegen:all    # 同时生成 GraphQL 和 OpenAPI 类型
   ```
3. **使用生成的类型编写业务代码**

## 契约约束

- **禁止修改契约文件**：不得编辑 `../contract/` 下的任何文件
- **提交契约变更请求**：如需新增或修改接口，在 `contract/requests/pending/` 下创建请求文件

## 开发规则

- 运行 `codegen:all` 生成类型后，再编写业务代码
- 前端类型、请求/响应结构必须与 contract 保持一致
- 不要在前端硬编码未在 contract 中定义的接口

## GraphQL Subscriptions

使用 urql 的 `useSubscription` 接收实时更新：
```typescript
useSubscription({ query: GAME_STATE_SUBSCRIPTION, variables: { gameId } });
```

## 游戏状态管理

使用 Zustand 管理本地游戏状态：
- 格子状态（已翻开、标记等）
- 计时器
- 玩家列表
- 游戏结果