---
agent: scheduler
timestamp: 20260417-192000
priority: high
---

# 在线扫雷游戏 - 契约定义

## Motivation
创建在线扫雷游戏，采用前后端分离架构：
- 前端只负责渲染（格子显示、用户交互）
- 后端负责格子数据生成、管理和点击后果判断
- 点到地雷扣分（-10），点开空包格子加分（+1 per cell revealed）

## Affected Files
- contract/schema.graphql

## Proposed Changes
完整定义扫雷游戏的 GraphQL Schema：
- User: 用户信息（含分数）
- Game: 游戏数据（格子由后端管理）
- Cell: 格子状态
- Mutations: createGame, revealCell, toggleFlag
- Subscriptions: 游戏状态实时推送

## Impact
- 后端需要实现格子生成、状态管理、分数计算
- 前端需要实现游戏界面渲染、实时订阅