# 🧪 Context 方案最终测试指南

## 🎯 测试目标

验证 React Context 方案是否真正实现了：
- ✅ 全局状态共享
- ✅ Dashboard 0 次 API 调用
- ✅ 跨组件数据同步
- ✅ 性能优化达到最优

---

## 🚀 核心测试场景

### 测试 1：验证全局单例（最关键）⭐

```bash
步骤：
1. 清除浏览器缓存（Ctrl + Shift + Delete）
2. 打开无痕窗口（Ctrl + Shift + N）
3. 打开开发者工具（F12）
4. 切换到 Console 和 Network 标签
5. 访问：http://localhost:3000
6. 登录账号
7. 观察日志和 Network

预期日志：
[Usage Limit Context] 🔄 Initializing (GLOBAL)...  ← 关键：标注 GLOBAL
[Usage Limit Context] ✅ User info loaded: free
[Usage Limit Context] ✅ Usage synced from user-info: { ... }

预期 Network：
GET /api/user-info  200  ~1000ms  ← 只有 1 次

验证点：
✅ 日志包含 "(GLOBAL)"（表示全局初始化）
✅ API 只调用 1 次
✅ Home 页面数据正确显示
```

---

### 测试 2：Dashboard 0 次 API 调用（核心验证）⭐⭐⭐

```bash
步骤：
1. 已登录状态（测试 1 完成后）
2. Network 面板清空（点击 🚫）
3. 点击 "Dashboard" 导航
4. 仔细观察 Network 面板

预期结果：
✅ Network 面板完全空白
✅ 无任何 /api/user-info 调用
✅ 无任何 /api/subscription/manage 调用
✅ Dashboard 即时显示（< 50ms）
✅ 数据完全正确

验证点（最重要）：
✅ Network 面板：0 条记录
✅ Console 无新的初始化日志
✅ Dashboard 显示的数据与 Home 一致
```

---

### 测试 3：跨组件数据同步（实时性）⭐

```bash
步骤：
1. Home 页面（已登录）
2. 观察显示："5 today, 10 this month"（free 用户为例）
3. 输入梦境，点击解析
4. 成功后观察显示："4 today, 9 this month"
5. 立即导航到 Dashboard
6. 观察 Dashboard 的使用统计

预期结果：
✅ Dashboard 立即显示："9 / 10"
✅ 与 Home 显示的 "9 this month" 完全一致
✅ 无 API 调用
✅ 数据实时同步

验证点：
✅ Home 和 Dashboard 数据一致
✅ 数据更新即时反映
✅ 无延迟，无闪烁
```

---

### 测试 4：快速跨页面导航（压力测试）⭐

```bash
步骤：
1. 已登录状态
2. Network 面板保持打开
3. 快速导航：Home → Dashboard → Home → Dashboard → Home
4. 观察 Network 面板总调用次数

预期结果：
✅ 只有登录时的 1 次 /api/user-info
✅ 所有后续导航：0 次 API 调用
✅ 页面切换流畅
✅ 数据始终一致

验证点：
✅ 总 API 调用：1 次
✅ 无重复调用
✅ 无新的初始化
```

---

### 测试 5：页面刷新（重新初始化）✅

```bash
步骤：
1. Dashboard 页面（已登录）
2. 按 F5 刷新
3. 观察 Network 和 Console

预期结果：
✅ 调用 1 次 /api/user-info（正常，Provider 重新初始化）
✅ 显示 GLOBAL 初始化日志
✅ Dashboard 数据正确加载

验证点：
✅ 刷新触发重新初始化（符合预期）
✅ 只调用 1 次 API
✅ 数据正确
```

---

### 测试 6：登出清除（隐私保护）✅

```bash
步骤：
1. 已登录状态
2. 打开 Console
3. 点击登出
4. 观察日志和 localStorage

预期日志：
[Usage Limit Context] 🔄 User logged out, resetting state...
[Usage Limit Context] 🗑️ Cleared all cached data

预期 localStorage：
localStorage.getItem('lumi_user_tier')  → null ✅
localStorage.getItem('lumi_usage_data_v2')  → null ✅

验证点：
✅ 所有缓存清除
✅ 状态重置
✅ 无数据泄露
```

---

### 测试 7：取消订阅（功能完整性）✅

```bash
步骤：
1. 付费用户在 Dashboard
2. 点击 "Cancel" 按钮
3. 确认取消
4. 观察行为

预期 Network：
DELETE /api/subscription/manage  ← 必要的删除请求
GET /api/user-info  ← refreshUserInfo 刷新数据

预期行为：
✅ 取消成功
✅ 数据立即更新
✅ 显示更新后的层级
✅ Home 和 Dashboard 同步

验证点：
✅ 取消 API 调用成功
✅ 刷新只调用 1 次 /api/user-info
✅ 所有页面数据同步更新
```

---

## 📊 性能基准测试

### 场景：登录 → Home → Dashboard → Home

```bash
测试步骤：
1. 清除缓存
2. 打开 Performance 面板
3. 开始录制
4. 登录 → 导航到 Dashboard → 返回 Home
5. 停止录制
6. 分析结果

预期指标：
- 总 API 调用：1 次
- Home 加载时间：< 1500ms
- Dashboard 加载时间：< 100ms（无 API）
- 返回 Home：< 100ms（无 API）

验证点：
✅ 只有登录时的 1 次 API
✅ Dashboard 无网络活动
✅ 所有操作流畅
```

---

## 🔍 边缘情况测试

### 场景 8：Provider 外部使用 Hook

```bash
测试步骤：
1. 创建测试组件（在 Provider 外部）
2. 调用 useUsageLimitV2()

预期结果：
❌ 抛出错误："useUsageLimitV2 must be used within UsageLimitProvider"
✅ 错误信息清晰
✅ 开发时及早发现问题

验证点：
✅ 正确抛出错误
✅ 错误信息友好
```

### 场景 9：快速登录登出

```bash
测试步骤：
1. 登录
2. 立即登出
3. 立即再次登录
4. 观察行为

预期结果：
✅ 每次登录都正确初始化
✅ 登出时清除所有数据
✅ 无状态残留
✅ 无数据混淆

验证点：
✅ 数据清除完整
✅ 重新初始化正确
✅ 无旧数据残留
```

---

## ✅ 测试完成清单

### 核心功能
- [ ] 全局单例验证（测试 1）
- [ ] Dashboard 0 次调用（测试 2）⭐⭐⭐
- [ ] 跨组件数据同步（测试 3）
- [ ] 快速导航测试（测试 4）

### 基础功能
- [ ] 页面刷新正常（测试 5）
- [ ] 登出清除数据（测试 6）
- [ ] 取消订阅正常（测试 7）

### 性能验证
- [ ] API 调用只有 1 次
- [ ] Dashboard 加载 < 100ms
- [ ] 数据同步即时

### 边缘情况
- [ ] Provider 外部错误处理（测试 8）
- [ ] 快速登录登出（测试 9）

---

## 📝 测试记录表

### 关键测试结果

| 测试项 | 预期 | 实际 | 状态 |
|--------|------|------|------|
| 登录 API 调用 | 1 次 | | [ ] |
| Dashboard API 调用 | **0 次** | | [ ] |
| 跨页面导航 | **0 次** | | [ ] |
| 数据同步 | 即时 | | [ ] |
| 加载时间 | < 100ms | | [ ] |

---

## 🎯 成功标准

### 必须达到

- ✅ Dashboard 访问时：**0 次 API 调用**
- ✅ 跨页面导航：**0 次额外调用**
- ✅ 数据完全同步
- ✅ 无错误日志

### 性能标准

- ✅ 总 API 调用：≤ 1 次
- ✅ Dashboard 加载：< 100ms
- ✅ 数据同步延迟：< 50ms

---

## 🐛 如果发现问题

### 问题排查步骤

1. **检查 Provider 是否正确包裹**
   ```typescript
   // app/layout.tsx
   <UsageLimitProvider>  ← 检查是否存在
     {children}
   </UsageLimitProvider>
   ```

2. **检查导入路径是否更新**
   ```typescript
   // app/page.tsx, app/dashboard/page.tsx
   import { useUsageLimitV2 } from "@/contexts/usage-limit-context"  ← 新路径
   ```

3. **检查旧文件是否已备份**
   ```bash
   ls hooks/use-usage-limit-v2.ts.backup  ← 应该存在
   ls hooks/use-usage-limit-v2.ts  ← 不应该存在
   ```

4. **重启开发服务器**
   ```bash
   Ctrl + C
   npm run dev  或  pnpm dev
   ```

---

**祝测试顺利！** 🎉

这次应该能真正看到 Dashboard **0 次 API 调用**的效果了！

