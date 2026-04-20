# 测试与上线保障指南（DTT）

## 一、目标
保证：
- 改代码不会破坏已有功能
- 每次提交都经过自动验证

---

## 二、本地验证流程

```bash
npm install
npm test
```

必须全部通过才允许提交。

---

## 三、CI 机制

GitHub Actions 会自动执行：
- 安装依赖
- 执行 Jest

任何失败都会阻断 PR 合并。

---

## 四、测试分层

### 1. 单元测试（游戏逻辑）
- Main 循环
- DataBus
- GameInfo

### 2. 接口测试（服务层）
- /health
- /
- 静态资源

### 3. 运行环境模拟
- canvas
- RAF
- performance

---

## 五、回归测试策略

每次修改必须检查：

- [ ] 游戏是否能正常进入（menu → playing）
- [ ] 玩家能跳跃
- [ ] 游戏结束逻辑正常
- [ ] 页面能正常加载
- [ ] /health 返回 OK

---

## 六、常见问题

### 1. Jest 报错
- 删除 node_modules
- 重新 npm install

### 2. canvas 报错
- 检查 tests/setup.js 是否被修改

---

## 七、上线前检查（必须）

```bash
npm test
npm run start
```

并手动访问：
- /
- /health

---

## 八、未来增强（建议）

- 覆盖率 >= 80%
- 加入 E2E（Puppeteer）
- 加入性能测试（FPS）

---

这是一个最小但可持续的 DTT 体系。
