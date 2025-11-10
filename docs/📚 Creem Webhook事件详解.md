# 📚 Creem Webhook 事件详解

## 🎯 核心问题

**问题**：`subscription.paid` 和 `checkout.completed` 有什么区别和联系？

---

## 📊 基于实际日志的分析

### 从你的购买日志中发现

**一次购买触发了 3 个 Webhook**（按时间顺序）：

```
Time: 05:13:07
Event 1: subscription.active
├─ 订阅对象激活通知
└─ Status: active

Time: 05:13:07  
Event 2: subscription.paid
├─ 支付成功通知
├─ 包含 transaction 信息
└─ Description: "Subscription payment"

Time: 05:13:20
Event 3: checkout.completed
├─ 结账流程完成通知
├─ 包含完整的 checkout + order + subscription
└─ Status: completed
```

---

## 🔍 两个事件的区别

### `checkout.completed`（结账完成）

**定义**：结账会话完成事件

**触发时机**：
- ✅ 用户在 Creem 支付页面完成支付
- ✅ 首次购买
- ✅ 手动购买续费（用户主动支付）

**包含数据**：
```json
{
  "id": "ch_7QG64HCyuHuQKDsC94gAcs",  // Checkout ID
  "object": "checkout",
  "status": "completed",
  "order": {
    "id": "ord_xxx",
    "amount": 499,
    "status": "paid"
  },
  "subscription": {
    "id": "sub_5S2qCYUJySmOFxTNk7fYuP",
    "status": "active",
    "current_period_end_date": "2025-12-10"
  },
  "customer": {...},
  "product": {...},
  "metadata": {
    "user_id": "...",
    "tier": "basic"
  }
}
```

**特点**：
- ✅ 包含完整的结账流程信息
- ✅ 包含 checkout、order、subscription 三个对象
- ✅ 包含用户传递的 metadata
- ✅ 表示整个购买流程完成

**用途**：
- **首次购买**：创建订阅记录
- **手动续费**：延长订阅记录
- **升级/降级**：更新订阅层级

---

### `subscription.paid`（订阅支付）

**定义**：订阅支付成功事件

**触发时机**：
- ✅ 订阅自动续费成功
- ✅ 手动支付续费账单
- ⚠️ 首次购买也会触发（这是混淆点）

**包含数据**：
```json
{
  "id": "sub_5S2qCYUJySmOFxTNk7fYuP",  // Subscription ID
  "object": "subscription",
  "status": "active",
  "last_transaction": {
    "id": "tran_5XGilDU7rYNo0yBgTXGLrL",
    "amount": 499,
    "status": "paid",
    "description": "Subscription payment"
  },
  "current_period_start_date": "2025-11-10",
  "current_period_end_date": "2025-12-10",
  "next_transaction_date": "2025-12-10",
  "customer": {...},
  "product": {...},
  "metadata": {...}
}
```

**特点**：
- ✅ 专注于订阅对象
- ✅ 包含交易详情（last_transaction）
- ✅ 包含周期信息（current_period, next_transaction）
- ✅ 适合处理周期性支付

**用途**：
- **自动续费**：主要用途
- **续费确认**：订阅周期更新
- **支付记录**：财务对账

---

## 📋 事件对比表

| 特性 | checkout.completed | subscription.paid |
|------|-------------------|------------------|
| **主要 ID** | checkout_id (ch_xxx) | subscription_id (sub_xxx) |
| **对象类型** | checkout | subscription |
| **触发场景** | 用户完成支付流程 | 订阅支付成功 |
| **首次购买** | ✅ 触发 | ✅ 触发 |
| **手动续费** | ✅ 触发 | ✅ 触发 |
| **自动续费** | ❌ 不触发 | ✅ 触发 |
| **包含 metadata** | ✅ 是（用户传递的） | ✅ 是（订阅的） |
| **包含 order** | ✅ 是 | ⚠️ 只有 transaction |
| **适合场景** | 激活订阅、创建记录 | 续费处理、财务记录 |

---

## 🔄 不同场景的事件流

### 场景 1：首次购买

```
用户点击购买 → 完成支付
  ↓
Creem 发送 Webhook（顺序可能不同）：
  ├─ subscription.active
  ├─ subscription.paid  ← 支付成功
  └─ checkout.completed ← 结账完成

建议处理：
  ├─ subscription.active → 忽略
  ├─ subscription.paid → 跳过（首次购买）
  └─ checkout.completed → 处理（创建订阅）✅
```

**为什么这样处理？**
- `checkout.completed` 包含最完整的信息（checkout + order + subscription）
- 有 metadata（包含 user_id 等关键信息）
- 明确表示购买流程完成

---

### 场景 2：自动续费

```
订阅到期 → Creem 自动扣款 → 成功
  ↓
Creem 发送 Webhook：
  └─ subscription.paid ← 只有这一个

建议处理：
  └─ subscription.paid → 处理（延长订阅）✅
```

**为什么这样处理？**
- 没有 checkout 流程（自动扣款）
- 只需要更新订阅周期
- 使用 subscription_id 关联现有订阅

---

### 场景 3：手动续费

```
用户手动支付续费账单
  ↓
Creem 发送 Webhook（可能两个都有）：
  ├─ subscription.paid
  └─ checkout.completed

建议处理：
  ├─ subscription.paid → 检测到已有订阅 → 处理
  └─ checkout.completed → 幂等性检查 → 跳过（已处理）
```

---

## 🎯 最佳处理策略

### 策略：基于订阅存在性判断

```typescript
// checkout.completed：优先处理首次购买
case "checkout.completed":
  // ✅ 包含完整信息（metadata, checkout, order）
  // ✅ 有幂等性检查（payment_id）
  // ✅ 处理首次购买、手动续费、升级/降级
  handled = await handleCheckoutCompleted(eventData)
  break

// subscription.paid：智能判断
case "subscription.paid":
  // 检查是否已有订阅
  const existing = await query(creem_subscription_id = eventData.id)
  
  if (!existing) {
    // 首次购买 → 跳过（等待 checkout.completed）
    console.log("First payment - skipping")
    return true
  }
  
  // 续费 → 处理
  console.log("Renewal payment - processing")
  return await handleCheckoutCompleted(eventData)
  break
```

---

## 📝 推荐的处理逻辑

### checkout.completed

**用途**：处理所有需要创建/更新订阅的场景

```typescript
async function handleCheckoutCompleted(data) {
  // 1. 幂等性检查（payment_id）
  if (已处理) return true
  
  // 2. 提取信息（metadata, product_id, etc.）
  
  // 3. 查询现有订阅
  const existing = await query(user_id)
  
  // 4. 判断类型
  if (!existing) {
    // 首次购买
    createSubscription()
  } else if (isSamePlan) {
    // 续费
    extendSubscription()
  } else {
    // 升级/降级
    cancelOldSubscription()
    createNewSubscription()
  }
  
  // 5. 记录历史
  
  // 6. 发送邮件
}
```

**处理场景**：
- ✅ 首次购买（最完整的信息）
- ✅ 手动续费
- ✅ 升级/降级
- ✅ 换周期

---

### subscription.paid

**用途**：智能判断首次购买 vs 续费

```typescript
async function handleSubscriptionPaid(data) {
  // 1. 检查是否已有订阅
  const existing = await query(creem_subscription_id = data.id)
  
  if (!existing) {
    // 首次购买 → 跳过
    console.log("First payment - will be handled by checkout.completed")
    return true
  }
  
  // 2. 续费 → 调用 handleCheckoutCompleted
  console.log("Renewal payment")
  return await handleCheckoutCompleted(data)
}
```

**处理场景**：
- ✅ 自动续费（主要场景）
- ⚠️ 首次购买（跳过，由 checkout.completed 处理）

---

## 🔄 为什么需要两个事件？

### Creem 的设计理念

1. **`checkout.completed`**：
   - 面向**交易流程**
   - 用户主动发起的购买
   - 包含完整的结账上下文
   - 适合创建新订阅

2. **`subscription.paid`**：
   - 面向**订阅周期**
   - 周期性的支付事件
   - 专注于订阅状态
   - 适合续费处理

---

## 🎨 数据结构对比

### checkout.completed 的数据结构

```typescript
{
  // ✅ Checkout 层
  id: "ch_xxx",
  object: "checkout",
  status: "completed",
  success_url: "...",
  metadata: {  // ✅ 用户传递的元数据
    user_id: "...",
    tier: "basic",
    billing_cycle: "monthly"
  },
  
  // ✅ Order 层
  order: {
    id: "ord_xxx",
    amount: 499,
    status: "paid",
    transaction: "tran_xxx"
  },
  
  // ✅ Subscription 层
  subscription: {
    id: "sub_xxx",
    status: "active",
    current_period_end_date: "..."
  },
  
  // ✅ Customer 层
  customer: {
    email: "user@example.com",
    name: "..."
  },
  
  // ✅ Product 层
  product: {
    id: "prod_xxx",
    name: "Lumi Basic Monthly"
  }
}
```

**特点**：
- 🌟 **完整的上下文**：从结账到订阅的全流程
- 🌟 **用户 metadata**：包含自定义数据
- 🌟 **适合初始化**：创建订阅记录

---

### subscription.paid 的数据结构

```typescript
{
  // ✅ Subscription 对象（主体）
  id: "sub_xxx",
  object: "subscription",
  status: "active",
  
  // ✅ 周期信息
  current_period_start_date: "2025-11-10",
  current_period_end_date: "2025-12-10",
  next_transaction_date: "2025-12-10",  // 下次扣款日期
  
  // ✅ 最近一次交易
  last_transaction_id: "tran_xxx",
  last_transaction: {
    id: "tran_xxx",
    amount: 499,
    status: "paid",
    description: "Subscription payment",
    period_start: 1762751579000,
    period_end: 1765343579000
  },
  
  // ✅ 订阅元数据
  metadata: {
    tier: "basic",
    user_id: "...",
    billing_cycle: "monthly"
  },
  
  // ✅ Customer & Product
  customer: {...},
  product: {...}
}
```

**特点**：
- 🌟 **专注订阅**：以订阅对象为中心
- 🌟 **周期信息**：包含下次扣款日期
- 🌟 **适合续费**：更新订阅周期

---

## 📋 完整对比

| 维度 | checkout.completed | subscription.paid |
|------|-------------------|-------------------|
| **主要场景** | 用户完成结账流程 | 订阅支付成功 |
| **首次购买** | ✅ 触发 | ✅ 触发（同时） |
| **手动续费** | ✅ 触发 | ✅ 触发（同时） |
| **自动续费** | ❌ 不触发 | ✅ 触发（唯一） |
| **升级/降级** | ✅ 触发 | ✅ 触发（新订阅） |
| **数据完整性** | 🌟 最完整 | ⭐ 订阅专注 |
| **metadata** | ✅ 用户传递的 | ✅ 订阅的 |
| **适合创建** | ✅ 是 | ⚠️ 需判断 |
| **适合续费** | ✅ 可以 | ✅ 更适合 |

---

## 🎯 为什么首次购买会触发两个事件？

### Creem 的事件设计

**结账流程包含两个动作**：

1. **完成支付**（Payment）
   - 创建交易记录
   - 触发 `subscription.paid`
   
2. **完成结账**（Checkout）
   - 整个流程结束
   - 触发 `checkout.completed`

**为什么都触发？**
- `subscription.paid`：通知订阅相关服务（支付成功）
- `checkout.completed`：通知业务逻辑（可以激活用户权限）

---

## 🔄 事件触发规律

### 规律 1：首次购买

```
用户操作：点击购买 → 完成支付
  ↓
Creem 发送：
  1. subscription.active（订阅激活）
  2. subscription.paid（支付成功）
  3. checkout.completed（结账完成）

时间间隔：通常在几秒内全部发送
```

**关键**：这 3 个事件**几乎同时**发送

---

### 规律 2：自动续费

```
订阅到期 → Creem 自动扣款
  ↓
Creem 发送：
  └─ subscription.paid（唯一事件）

没有：
  ❌ checkout.completed（因为没有 checkout 流程）
```

**关键**：自动续费**只有** `subscription.paid`

---

### 规律 3：手动续费

```
用户点击续费 → 完成支付
  ↓
Creem 发送：
  ├─ subscription.paid
  └─ checkout.completed
```

**关键**：与首次购买类似（有 checkout 流程）

---

## ✅ 我们的处理策略

### 策略总结

| 事件 | 处理方式 | 原因 |
|------|---------|------|
| `subscription.active` | ✅ 忽略 | 通知性事件，无需处理 |
| `subscription.paid` | ✅ 智能判断 | 首次购买跳过，续费处理 |
| `checkout.completed` | ✅ 幂等性处理 | 处理首次购买和手动续费 |

---

### 具体实现

#### 1. subscription.active

```typescript
case "subscription.active":
  console.log("Subscription activated - ignoring")
  handled = true  // 标记成功，不处理
  break
```

**用途**：
- 避免 "Unhandled event" 警告
- 不做任何数据库操作

---

#### 2. subscription.paid

```typescript
case "subscription.paid":
  handled = await handleSubscriptionPaid(eventData)
  break

async function handleSubscriptionPaid(data) {
  // 检查是否已有订阅
  const existing = await query(creem_subscription_id = data.id)
  
  if (!existing) {
    // 首次购买 → 跳过
    console.log("First payment - will be handled by checkout.completed")
    return true
  }
  
  // 续费 → 处理
  console.log("Renewal payment - processing")
  return await handleCheckoutCompleted(data)
}
```

**逻辑**：
- 查询数据库
- 无记录 → 首次购买 → 跳过
- 有记录 → 续费 → 处理

---

#### 3. checkout.completed

```typescript
case "checkout.completed":
  handled = await handleCheckoutCompleted(eventData)
  break

async function handleCheckoutCompleted(data) {
  // ✅ 幂等性检查
  const existing = await query(creem_payment_id = data.id)
  if (existing) {
    console.log("Already processed, skipping")
    return true
  }
  
  // 处理订阅创建/更新
  // ...
}
```

**逻辑**：
- 幂等性检查（payment_id）
- 处理首次购买、手动续费、升级/降级

---

## 🎨 完整的事件决策树

```
收到 Webhook
  ↓
事件类型？
  ├─ subscription.active
  │  └─ 忽略 ✅
  │
  ├─ subscription.paid
  │  ├─ 查询：user_subscriptions.creem_subscription_id = event.id
  │  ├─ 无 → 首次购买 → 跳过（等待 checkout.completed）
  │  └─ 有 → 续费 → 处理（调用 handleCheckoutCompleted）
  │
  ├─ checkout.completed
  │  ├─ 幂等性检查：subscription_history.creem_payment_id = event.id
  │  ├─ 已处理 → 跳过
  │  └─ 未处理 → 处理（创建/更新订阅）
  │
  └─ 其他事件...
```

---

## 📊 实际日志解读

### 你的购买日志

**Event 1: subscription.active**（行 123）
```bash
[Webhook] Event: subscription.active
[Webhook] ⚠️ Unhandled event type  ← 修复前
```

**修复后**：
```bash
[Webhook] Event: subscription.active
[Webhook] 📝 Ignoring (handled by checkout.completed)  ← ✅ 不再警告
```

---

**Event 2: subscription.paid**（行 218）
```bash
[Webhook] Event: subscription.paid
[Webhook] 💰 Subscription payment received - processing as renewal
📝 [Webhook] Event type: New subscription  ← 创建了订阅
✅ Subscription history recorded: subscription_created  ← 记录 1
```

**修复后**：
```bash
[Webhook] Event: subscription.paid
💳 [Webhook] First payment detected  ← ✅ 检测到首次购买
[Webhook] Skipping to avoid duplication  ← ✅ 跳过
✅ [Webhook] Event processed successfully
```

---

**Event 3: checkout.completed**（行 463）
```bash
[Webhook] Event: checkout.completed
🔄 [Webhook] Event type: Subscription renewal  ← ❌ 误判
✅ Extending subscription  ← ❌ 延长了
✅ Subscription history recorded: subscription_renewed  ← 记录 2（错误）
```

**修复后**：
```bash
[Webhook] Event: checkout.completed
✅ [Webhook] New payment ch_xxx, proceeding  ← ✅ 处理
📝 [Webhook] Event type: New subscription  ← ✅ 正确判断
✅ Subscription history recorded: subscription_created  ← 唯一记录
```

---

## 🎯 关键要点

### 1. 幂等性至关重要

**问题**：Creem 可能发送重复 webhook（重试机制）

**解决**：
```typescript
// 使用唯一 ID 去重
creem_payment_id: "ch_xxx"  // checkout.completed
creem_payment_id: "tran_xxx"  // subscription.paid

// 检查是否已处理
SELECT * FROM subscription_history WHERE creem_payment_id = ?
```

---

### 2. 区分首次购买和续费

**关键字段**：`creem_subscription_id`

```typescript
// 查询数据库
const existing = await query(creem_subscription_id = event.subscription.id)

if (existing) {
  // 续费
} else {
  // 首次购买
}
```

---

### 3. 优先使用 checkout.completed

**原因**：
- ✅ 包含用户传递的 metadata
- ✅ 包含完整的上下文
- ✅ 明确的流程完成标志

**策略**：
- 首次购买：`checkout.completed` 处理
- 自动续费：`subscription.paid` 处理
- 手动续费：两者都有，幂等性保证只处理一次

---

## 📚 总结

### 区别

| 维度 | checkout.completed | subscription.paid |
|------|-------------------|-------------------|
| **语义** | "用户完成了一次购买" | "订阅收到了一次支付" |
| **焦点** | 交易流程 | 订阅周期 |
| **自动续费** | 不触发 | 触发 |
| **metadata** | 用户传递的 | 订阅的 |

---

### 联系

1. **首次购买时同时触发**
2. **都包含订阅信息**
3. **都表示支付成功**
4. **可能包含相同的 subscription_id**

---

### 我们的处理

- ✅ `checkout.completed`：主要处理首次购买
- ✅ `subscription.paid`：主要处理自动续费
- ✅ 幂等性检查：防止重复
- ✅ 智能判断：区分场景

---

**文档创建时间**：2025-11-10  
**基于**：实际日志分析 + Creem 事件模型  
**状态**：✅ 已验证并修复

