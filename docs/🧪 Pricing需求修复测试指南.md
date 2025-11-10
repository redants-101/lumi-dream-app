# 🧪 Pricing 需求修复测试指南

## ✅ 修复内容

### 修复 1：禁止手动续费 ✅
- 移除 "Renew Subscription" 按钮
- 改为自动续费提示

### 修复 2：添加升级权益提醒 ✅
- Basic → Pro 显示警告对话框
- 提示剩余时间不退款

### 修复 3：区分 Free 用户 ✅
- Free 用户升级无警告
- 直接进入支付

---

## 🧪 快速测试清单

### 测试 1：Basic 用户禁止手动续费 ⭐

**步骤**：
1. 使用 Basic Monthly 账号登录
2. 访问 http://localhost:3000/pricing
3. 查看 Basic Monthly 卡片

**✅ 应该看到**：
- [ ] 蓝色"Current Plan"提示框
- [ ] 剩余天数（如：15 days remaining）
- [ ] 续费日期（如：Renews on Dec 1, 2025）
- [ ] 绿色"Auto-Renewal Enabled"提示框
- [ ] 显示："Will automatically renew on..."
- [ ] 按钮文案："Manage Subscription"（不是 Renew）

**❌ 不应该看到**：
- [ ] "Renew Subscription" 按钮

**截图位置**：当前套餐卡片底部区域

---

### 测试 2：Basic → Pro 升级警告 ⭐⭐⭐

**步骤**：
1. Basic Monthly 用户
2. 点击 Pro Monthly 卡片的 "Upgrade to Pro" 按钮

**✅ 应该弹出对话框**：
- [ ] 标题："Upgrade to Pro?"
- [ ] ⚠️ 黄色警告图标
- [ ] 显示："You're upgrading from Basic Monthly to Pro Monthly"
- [ ] 黄色警告框，包含 4 个要点：
  - [ ] Upgraded plan starts immediately
  - [ ] Remaining X days of Basic won't be refunded
  - [ ] Charged Pro rate starting today
  - [ ] Old subscription canceled automatically
- [ ] 显示当前订阅到期日期
- [ ] 两个按钮："Cancel" 和 "Continue Upgrade"

**点击 Cancel**：
- [ ] 对话框关闭
- [ ] 返回 Pricing 页面
- [ ] 未进入支付

**点击 Continue Upgrade**：
- [ ] 对话框关闭
- [ ] 进入支付流程

**截图位置**：完整的对话框

---

### 测试 3：Free 用户无警告 ⭐

**步骤**：
1. 使用 Free 账号登录（或新注册）
2. 访问 `/pricing`
3. 点击 Basic 或 Pro 的购买按钮

**✅ 预期**：
- [ ] **不弹出**警告对话框
- [ ] 直接显示"Processing..."
- [ ] 直接进入支付流程

**❌ 不应该看到**：
- [ ] 升级警告对话框
- [ ] 任何权益提醒

---

### 测试 4：换周期警告（验证未破坏）

**步骤**：
1. Basic Monthly 用户
2. 切换顶部 Toggle 到 "Yearly"
3. 查看 Basic Yearly 卡片
4. 点击 "Switch to Yearly" 按钮

**✅ 应该弹出对话框**：
- [ ] 标题："Change Billing Cycle?"
- [ ] 显示换周期说明
- [ ] 黄色警告框
- [ ] 有 Cancel 和 Continue 按钮

**确认**：功能与之前一致（未破坏）

---

## 📋 完整功能对照表

### Anonymous 用户

| 操作 | 预期行为 | 测试 |
|------|---------|------|
| 点击任意购买按钮 | 显示登录对话框 | ⬜ |
| 登录后 | 直接进入支付 | ⬜ |

---

### Free 用户

| 操作 | 预期行为 | 测试 |
|------|---------|------|
| 点击 Basic | 直接支付，无警告 | ⬜ |
| 点击 Pro | 直接支付，无警告 | ⬜ |

---

### Basic Monthly 用户

| 操作 | 预期行为 | 测试 |
|------|---------|------|
| 查看 Basic Monthly 卡片 | 显示剩余天数 + 自动续费提示 | ⬜ |
| 按钮文案 | "Manage Subscription" | ⬜ |
| ❌ 续费按钮 | 不存在 | ⬜ |
| 点击 Basic Yearly | 弹出换周期警告 | ⬜ |
| 点击 Pro | 弹出升级警告 | ⬜ |

---

### Pro Monthly 用户

| 操作 | 预期行为 | 测试 |
|------|---------|------|
| 查看 Pro Monthly 卡片 | 显示剩余天数 + 自动续费提示 | ⬜ |
| 按钮文案 | "Manage Subscription" | ⬜ |
| ❌ 续费按钮 | 不存在 | ⬜ |
| 点击 Pro Yearly | 弹出换周期警告 | ⬜ |
| 点击 Basic | 直接进入支付（降级无警告） | ⬜ |

---

## 🎯 关键测试点

### 最重要的 3 个测试

1. ⭐⭐⭐ **Basic 用户无续费按钮**
   - 验证禁止手动续费

2. ⭐⭐⭐ **Basic → Pro 弹出警告**
   - 验证升级权益提醒

3. ⭐⭐ **Free 用户无警告**
   - 验证 Free 用户逻辑区分

---

## 📸 需要截图的位置

### 截图 1：Basic Monthly 用户看到的完整页面
- 包含所有 3 个套餐卡片
- 重点：Basic Monthly 卡片的按钮区域

### 截图 2：自动续费提示
- 绿色"Auto-Renewal Enabled"提示框
- "Manage Subscription"按钮

### 截图 3：升级警告对话框
- 完整的对话框
- 包含所有警告信息

### 截图 4：Free 用户点击购买
- 浏览器控制台
- 确认无警告，直接进入支付

---

## 🐛 故障排查

### 问题 1：仍显示续费按钮

**检查**：
- 服务器是否已重启？
- 浏览器缓存是否已清除？

**解决**：
```bash
# 1. 停止服务器（Ctrl+C）
# 2. 清除缓存
Remove-Item -Recurse -Force .next
# 3. 重启
pnpm dev
# 4. 浏览器硬刷新（Ctrl+Shift+R）
```

---

### 问题 2：升级无警告

**检查**：
```javascript
// 在浏览器控制台执行
const currentSub = { tier: "basic", billing_cycle: "monthly" }
const targetTier = "pro"
const tierLevel = { free: 0, basic: 1, pro: 2 }

console.log("Is Upgrade?", tierLevel[targetTier] > tierLevel[currentSub.tier])
// 应该输出：true
```

**检查日志**：
- 打开浏览器控制台
- 点击 Pro 按钮
- 查看是否有错误

---

### 问题 3：Free 用户显示警告

**检查**：
```javascript
// 浏览器控制台
fetch('/api/subscription/manage')
  .then(r => r.json())
  .then(d => console.log('订阅:', d))

// Free 用户应该返回：
// { success: true, data: { tier: "free", ... } }
```

**验证逻辑**：
```tsx
isUpgradeTier("basic") 
// Free 用户应该返回 false（不显示警告）
```

---

## ✅ 测试通过标准

### 最低要求

- [ ] Basic 用户无续费按钮
- [ ] 显示自动续费提示
- [ ] Basic → Pro 显示升级警告

### 完整要求

- [ ] 所有 4 类用户测试通过
- [ ] 所有对话框正确显示
- [ ] Free 用户无警告
- [ ] 无 JavaScript 错误
- [ ] UI 显示正常

---

## 🚀 测试步骤

### 立即开始

1. **重启服务器**：
   ```bash
   pnpm dev
   ```

2. **清除浏览器缓存**：
   ```
   Ctrl + Shift + R
   ```

3. **访问 Pricing 页面**：
   ```
   http://localhost:3000/pricing
   ```

4. **按照测试清单逐项测试**

---

## 📞 需要帮助？

完成测试后，告诉我：

1. ✅ **全部通过**："测试通过"

2. ⚠️ **部分通过**：
   - 哪些场景有问题
   - 截图
   - 控制台错误

3. ❌ **测试失败**：
   - 详细错误描述
   - 完整日志

---

**预计测试时间**：10-15 分钟  
**重要程度**：⭐⭐⭐⭐⭐  
**文档创建时间**：2025-11-10

