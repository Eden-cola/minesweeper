# Minesweeper Backend Agent 开发规范

## Schema First 开发模式

**必须遵循 Schema First 流程**：
1. 首先阅读 `../contract/schema.graphql` 和相关契约文件
2. 理解接口需求、输入输出参数和业务逻辑
3. 在 `prisma/schema.prisma` 定义数据模型
4. 执行 `bun run graphql:validate` 验证契约有效性
5. 再执行业务逻辑开发

## 契约约束（绝对遵守）

- **禁止修改契约文件**：不得编辑 `../contract/` 下的任何文件
- **契约优先**：业务代码必须符合契约定义，不得反向修改契约
- **类型来源**：使用自动生成的类型，禁止手动重复定义
- **契约语法错误处理**：在运行 codegen 或读取契约文件时发现语法错误，应报告具体错误信息并**停止当前任务**，等待用户修复契约

## GraphQL Subscriptions 实时推送

游戏状态通过 GraphQL Subscriptions 实时推送：
- 使用 `@nestjs/graphql` 的 `Subscription` 装饰器
- 使用 `PubSub` 实现发布/订阅机制
- 关联字段必须使用 DataLoader 实现按需加载

## 实现自检清单

- [ ] 字段完整性：检查 schema.graphql 中定义的输入类型
- [ ] resolver 方法存在性：每个 query/mutation 都有对应实现
- [ ] 错误类型：所有 `throw new Error` 应替换为统一错误类型
- [ ] lint 通过：运行 `cd backend && bun run lint`
- [ ] DataLoader 检查：关联字段使用 DataLoader
- [ ] Subscription 测试：验证实时推送功能正常

## 提交契约变更请求

如需修改契约：
1. 在 `contract/requests/pending/` 下创建 `YYYYMMDD-HHMMSS-backend-<slug>.md`
2. 参照 `contract/requests/TEMPLATE.md` 填写
3. **立即返回**，说明已提交契约变更请求