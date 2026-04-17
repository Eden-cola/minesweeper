# Minesweeper Monorepo 开发规范

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    Scheduler Agent                          │
│              (协调后端 & 前端 开发工作)                        │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│    Backend Agent        │     │    Webapp Agent         │
│  (NestJS + GraphQL)     │     │  (React + urql)         │
└─────────────────────────┘     └─────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
              ┌───────────────────────────────┐
              │         contract/              │
              │    (唯一事实源 - Schema First) │
              └───────────────────────────────┘
```

## Agent 职责

### Scheduler Agent (当前)
- 理解用户需求
- 决定是否需要契约变更
- 分配任务给子 agent
- 协调后端和前端开发顺序

### Backend Agent
- 位置: `backend/.opencode/agents/backend.md`
- 职责: 实现后端业务逻辑、GraphQL Resolvers、Subscriptions

### Webapp Agent
- 位置: `webapp/.opencode/agents/webapp.md`
- 职责: 实现前端页面、组件、状态管理

## Schema First 开发流程

```
1. 定义契约 (contract/schema.graphql)
        ↓
2. 后端 & 前端各自生成类型
        ↓
3. 后端 & 前端独立开发
        ↓
4. 集成测试
```

## 契约变更流程

```
1. 在 contract/requests/pending/ 创建变更请求
       ↓
2. Scheduler Agent 审核并分配
       ↓
3. Backend Agent & Webapp Agent 实施变更
       ↓
4. 移动到 approved/ 或 rejected/
```

## 实时推送实现

后端使用 **GraphQL Subscriptions** 通过 WebSocket 推送：
- `gameStateUpdated` - 游戏状态变更
- `cellRevealed` - 格子被翻开
- `playerJoined` / `playerLeft` - 玩家进出

前端使用 **urql** 订阅：
```typescript
useSubscription({ query: GAME_SUBSCRIPTION, variables: { gameId } });
```

## 快速开始

### 1. 启动后端开发
```
使用 Backend Agent 开始后端开发
```

### 2. 启动前端开发
```
使用 Webapp Agent 开始前端开发
```

### 3. 修改契约
```
在 contract/schema.graphql 中定义新 API
然后分别启动 Backend Agent 和 Webapp Agent 实施
```