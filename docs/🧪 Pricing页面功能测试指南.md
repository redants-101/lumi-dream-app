# 🧪 Pricing 页面功能测试指南

## 🎯 测试目标

验证 Pricing 页面的三个新功能：
1. ✅ 当前订阅剩余时间提示
2. ✅ 换周期警告
3. ✅ 智能按钮（续费/换周期/购买）

---

## 📋 测试前准备

### 1. 重启服务器

```bash
# 停止当前服务器（Ctrl + C）
# 重新启动
pnpm dev
```

### 2. 准备测试账号

需要至少 2 个测试账号：
- **账号 A**：Free 用户（无订阅）
- **账号 B**：Basic Monthly 用户（有活跃订阅）

---

## 🧪 测试场景

### 测试场景 1：Free 用户 ✅

**目标**：验证无订阅用户看到的正常状态

#### 步骤

1. **退出登录**（如果已登录）
   - 访问：http://localhost:3000
   - 点击右上角退出

2. **访问 Pricing 页面**
   - http://localhost:3000/pricing

#### 预期结果

**所有套餐卡片**：

```
┌─────────────────────────────────┐
│         Free                    │
│         Free                    │
│                                 │
│  [Get Started]                  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│       Basic Monthly             │
│        $4.99/mo                 │
│                                 │
│  [Get Started]                  │  ← 正常购买按钮
└─────────────────────────────────┘

┌─────────────────────────────────┐
│       Basic Yearly              │
│        $4.08/mo                 │
│                                 │
│  [Get Started]                  │  ← 正常购买按钮
└─────────────────────────────────┘
```

✅ **检查点**：
- [ ] 没有"Current Plan"提示
- [ ] 没有"Change Billing Cycle"警告
- [ ] 所有按钮显示正常购买文案
- [ ] 无错误提示

---

### 测试场景 2：Basic Monthly 用户（核心测试）⭐

**目标**：验证所有新功能

#### 步骤

1. **使用 Basic Monthly 账号登录**
   
2. **访问 Pricing 页面**
   - http://localhost:3000/pricing
   
3. **观察页面显示**

#### 预期结果 A：Basic Monthly 卡片

```
┌─────────────────────────────────┐
│        Basic Monthly            │
│         $4.99/mo                │
├─────────────────────────────────┤
│ ✓ 100 interpretations/month     │
│ ✓ Priority processing           │
│ ✓ Email support                 │
│                                 │
│ ⏰ Current Plan                 │  ← ✅ 新增：当前订阅提示
│    15 days remaining            │  ← ✅ 显示剩余天数
│    Renews on Dec 1, 2025        │  ← ✅ 显示续费日期
│                                 │
│  [Renew Subscription]           │  ← ✅ 续费按钮
└─────────────────────────────────┘
```

**✅ 检查点**：
- [ ] 显示蓝色"Current Plan"提示框
- [ ] 显示正确的剩余天数
- [ ] 显示正确的续费日期（格式：Dec 1, 2025）
- [ ] 按钮文案为"Renew Subscription"
- [ ] 按钮样式为主要按钮（Primary）

---

#### 预期结果 B：Basic Yearly 卡片

```
┌─────────────────────────────────┐
│        Basic Yearly             │
│         $4.08/mo                │
│         $49/year - Save $11     │
├─────────────────────────────────┤
│ ✓ 100 interpretations/month     │
│ ✓ Priority processing           │
│ ✓ Email support                 │
│                                 │
│ ⚠️ Change Billing Cycle         │  ← ✅ 新增：换周期警告
│    Switching will start a new   │
│    subscription. Your remaining │
│    15 days won't be refunded.   │  ← ✅ 警告说明
│                                 │
│  [Switch to Yearly]             │  ← ✅ 换周期按钮
└─────────────────────────────────┘
```

**✅ 检查点**：
- [ ] 显示黄色"Change Billing Cycle"警告框
- [ ] 警告图标为 ⚠️
- [ ] 提示剩余天数不退款
- [ ] 按钮文案为"Switch to Yearly"
- [ ] 按钮样式为黄色边框（Outline + Yellow）

---

#### 预期结果 C：Pro Monthly 卡片

```
┌─────────────────────────────────┐
│         Pro Monthly             │
│          $9.99/mo               │
├─────────────────────────────────┤
│ ✓ Unlimited interpretations     │
│ ✓ Advanced Claude model         │
│ ✓ Priority support              │
│                                 │
│  [Upgrade to Pro]               │  ← 正常升级按钮
└─────────────────────────────────┘
```

**✅ 检查点**：
- [ ] 无特殊提示
- [ ] 按钮文案为"Upgrade to Pro"
- [ ] 按钮样式正常

---

### 测试场景 3：换周期警告对话框 ⚠️

**目标**：验证换周期确认流程

#### 步骤

1. **作为 Basic Monthly 用户访问 Pricing**
   
2. **点击 Basic Yearly 卡片的"Switch to Yearly"按钮**

#### 预期结果：弹出警告对话框

```
┌────────────────────────────────────┐
│           ⚠️                       │
│     Change Billing Cycle?          │
├────────────────────────────────────┤
│                                    │
│  You're switching from             │
│  Basic Monthly to Basic Yearly     │  ← ✅ 显示切换说明
│                                    │
│  ⚠️ Important:                     │
│  • This will start a new           │
│    subscription immediately        │
│  • Your remaining 15 days won't    │  ← ✅ 显示剩余天数
│    be refunded                     │
│  • The new billing cycle starts    │
│    today                           │
│                                    │
│  Current subscription expires:     │
│  Dec 1, 2025                       │  ← ✅ 显示到期日期
│                                    │
│  [Cancel]  [Continue]              │  ← ✅ 两个按钮
└────────────────────────────────────┘
```

**✅ 检查点**：
- [ ] 对话框正确弹出
- [ ] 标题为"Change Billing Cycle?"
- [ ] 显示黄色警告图标 ⚠️
- [ ] 正确显示"from Basic Monthly to Basic Yearly"
- [ ] 列出三个警告点
- [ ] 显示正确的剩余天数
- [ ] 显示当前订阅到期日期
- [ ] 有"Cancel"和"Continue"两个按钮

#### 步骤 3：点击"Cancel"

**预期结果**：
- [ ] 对话框关闭
- [ ] 返回 Pricing 页面
- [ ] 未发起支付

#### 步骤 4：再次点击"Switch to Yearly"，然后点击"Continue"

**预期结果**：
- [ ] 对话框关闭
- [ ] 进入支付流程（创建 Creem checkout session）
- [ ] 跳转到支付页面

---

### 测试场景 4：续费流程 🔄

**目标**：验证续费不显示警告，直接进入支付

#### 步骤

1. **作为 Basic Monthly 用户访问 Pricing**
   
2. **点击 Basic Monthly 卡片的"Renew Subscription"按钮**

#### 预期结果

- [ ] **不显示**警告对话框
- [ ] 直接进入支付流程
- [ ] 跳转到 Creem 支付页面

**原因**：续费是相同套餐，会延长订阅，不需要警告

---

### 测试场景 5：切换计费周期（Monthly → Yearly）

**目标**：完整测试计费周期切换

#### 步骤

1. **确认当前切换 Toggle 为 "Monthly"**

2. **切换到 "Yearly"**
   - 点击页面上方的 Monthly/Yearly 切换开关

#### 预期结果：Basic Yearly 卡片变化

**从**：
```
┌─────────────────────────────────┐
│ ⚠️ Change Billing Cycle         │
│  [Switch to Yearly]             │
└─────────────────────────────────┘
```

**到**：
```
┌─────────────────────────────────┐
│ ⏰ Current Plan                 │  ← 如果用户是 Yearly
│  [Renew Subscription]           │
└─────────────────────────────────┘
```

或保持警告（如果用户是 Monthly）

---

### 测试场景 6：响应式布局 📱

**目标**：验证移动端显示

#### 步骤

1. **打开浏览器开发者工具**（F12）

2. **切换到移动设备模拟**
   - iPhone 13 Pro
   - 宽度：390px

#### 预期结果

- [ ] 套餐卡片垂直排列
- [ ] 提示框正确显示
- [ ] 按钮宽度 100%
- [ ] 对话框适配移动端
- [ ] 文字可读

---

## 🐛 故障排查

### 问题 1：未显示"Current Plan"提示

**可能原因**：
1. 用户未登录
2. 用户是 Free 用户
3. 订阅信息获取失败

**检查**：
```javascript
// 在浏览器控制台执行
fetch('/api/subscription/manage')
  .then(r => r.json())
  .then(console.log)

// 预期返回：
// {
//   success: true,
//   data: {
//     tier: "basic",
//     billing_cycle: "monthly",
//     current_period_end: "2025-12-01T..."
//   }
// }
```

**解决**：
- 确认已登录
- 确认有活跃订阅
- 检查 API 是否正常返回

---

### 问题 2：剩余天数不正确

**检查**：
```javascript
// 在浏览器控制台执行
const endDate = new Date("2025-12-01T00:00:00Z")
const now = new Date()
const days = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
console.log("剩余天数:", days)
```

**解决**：
- 确认 `current_period_end` 格式正确
- 确认时区设置

---

### 问题 3：警告对话框未弹出

**可能原因**：
1. 点击的不是换周期按钮
2. JavaScript 错误

**检查**：
1. 打开浏览器控制台（F12）
2. 查看是否有错误
3. 确认点击的是黄色"Switch to..."按钮

---

### 问题 4：按钮文案不正确

**检查逻辑**：
```
当前套餐 + 相同周期 → "Renew Subscription"
当前套餐 + 不同周期 → "Switch to Yearly/Monthly"
不同套餐 → "Get Started" / "Upgrade to..."
```

---

## 📊 测试结果记录

### 测试环境

```
日期：2025-11-10
测试人员：[你的名字]
浏览器：Chrome / Firefox / Safari
版本：[版本号]
屏幕分辨率：[分辨率]
```

### 测试结果

| 测试场景 | 状态 | 备注 |
|---------|------|------|
| 场景 1：Free 用户 | ⬜ 未测试 / ✅ 通过 / ❌ 失败 | |
| 场景 2A：Current Plan 提示 | ⬜ 未测试 / ✅ 通过 / ❌ 失败 | |
| 场景 2B：换周期警告 | ⬜ 未测试 / ✅ 通过 / ❌ 失败 | |
| 场景 2C：其他套餐按钮 | ⬜ 未测试 / ✅ 通过 / ❌ 失败 | |
| 场景 3：警告对话框 | ⬜ 未测试 / ✅ 通过 / ❌ 失败 | |
| 场景 4：续费流程 | ⬜ 未测试 / ✅ 通过 / ❌ 失败 | |
| 场景 5：切换周期 | ⬜ 未测试 / ✅ 通过 / ❌ 失败 | |
| 场景 6：响应式布局 | ⬜ 未测试 / ✅ 通过 / ❌ 失败 | |

### 发现的问题

```
问题 1：
描述：
重现步骤：
预期结果：
实际结果：
截图：

问题 2：
...
```

---

## ✅ 测试通过标准

### 最低要求

- [ ] Free 用户看到正常按钮
- [ ] Basic Monthly 用户看到"Current Plan"提示
- [ ] 换周期按钮显示警告
- [ ] 点击换周期弹出确认对话框

### 完整要求

- [ ] 所有场景测试通过
- [ ] 剩余天数正确显示
- [ ] 日期格式正确
- [ ] 按钮文案准确
- [ ] 对话框内容完整
- [ ] 无 JavaScript 错误
- [ ] 移动端显示正常

---

## 🎯 测试重点

### 核心功能（必测）

1. **Current Plan 提示**
   - 显示剩余天数
   - 显示续费日期

2. **换周期警告**
   - 卡片内警告
   - 确认对话框
   - 显示剩余天数

3. **智能按钮**
   - 续费按钮
   - 换周期按钮
   - 购买按钮

### 边缘情况（选测）

1. 订阅即将到期（剩余 1 天）
2. 订阅已过期但未更新
3. 快速切换 Monthly/Yearly
4. 同时打开多个标签页

---

## 📞 需要帮助？

完成测试后，请提供：

1. ✅ **测试通过**：
   - 所有场景都正常 ✓

2. ⚠️ **部分通过**：
   - 哪些场景有问题
   - 错误截图
   - 浏览器控制台错误

3. ❌ **测试失败**：
   - 详细错误描述
   - 重现步骤
   - 完整日志

---

## 🚀 下一步

测试通过后：

1. ✅ 部署到生产环境
2. ✅ 监控用户反馈
3. ✅ 收集使用数据
4. 💡 后续优化建议

---

**文档创建时间**：2025-11-10  
**测试预计时间**：15-20 分钟  
**重要程度**：⭐⭐⭐⭐⭐（核心用户体验）

