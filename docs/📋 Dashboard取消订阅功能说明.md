# 📋 Dashboard 取消订阅功能说明

## 🎯 功能概述

**位置**：`/dashboard` → Subscription Management 卡片

**功能**：允许 Basic/Pro 用户取消订阅，自动降级到 Free

**特点**：
- ✅ 取消后保留到周期结束
- ✅ 自动降级到 Free
- ✅ 调用 Creem API 停止自动续费

---

## 🎨 页面交互流程

### 1️⃣ Dashboard 页面显示

**Basic/Pro 用户看到**：

```
┌─ Subscription Management ─────────────────┐
│                                           │
│ Upgrade Plan                              │
│ Upgrade to a higher tier                  │
│                                [Upgrade]  │
│                                           │
│ ─────────────────────────────────────── │
│                                           │
│ Cancel Subscription                       │
│ You'll be downgraded to free tier        │
│ after the current period ends             │
│                                [Cancel]   │ ← 红色按钮
└───────────────────────────────────────────┘
```

**显示条件**：
- ✅ `subscription.status === "active"`
- ✅ `subscription.tier !== "free"`

**Free 用户看到**：
```
┌─ Upgrade to Unlock More Features ─────┐
│                                       │
│ Upgrade to a paid plan for more       │
│ interpretations and advanced features │
│                                       │
│  [View Pricing Plans]                 │
└───────────────────────────────────────┘
```

---

### 2️⃣ 点击 Cancel 按钮

**触发**：
```typescript
<Button
  variant="destructive"  // 红色警告样式
  onClick={() => setShowCancelDialog(true)}
>
  Cancel
</Button>
```

**效果**：
- 弹出确认对话框
- 不立即执行取消

---

### 3️⃣ 确认对话框

**对话框内容**：

```
┌────────────────────────────────────────┐
│  Are you sure you want to cancel?     │
├────────────────────────────────────────┤
│                                        │
│  After cancellation, you can still    │
│  use the service until the end of     │
│  your current billing period          │
│  (Dec 1, 2025). Then you'll be        │
│  automatically downgraded to the      │
│  free tier.                           │
│                                        │
│  [Keep Subscription]  [Confirm]       │
└────────────────────────────────────────┘
```

**按钮**：
- **Keep Subscription**（左侧，默认）
  - 灰色 outline 样式
  - 点击关闭对话框，不取消
  
- **Confirm Cancellation**（右侧，危险）
  - 红色 destructive 样式
  - 点击执行取消操作

**动态信息**：
- ✅ 显示当前周期结束日期
- ✅ 告知降级到 Free

---

### 4️⃣ 确认取消

**用户点击 "Confirm Cancellation"**

**前端逻辑**：
```typescript
const handleCancelSubscription = async () => {
  setCanceling(true)  // 显示加载状态
  
  try {
    // 1. 调用 API
    const response = await fetch("/api/subscription/manage", {
      method: "DELETE",
    })
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message)
    }
    
    // 2. 显示成功提示
    toast.success("Subscription canceled. Changes will take effect at the end of the current period.")
    
    // 3. 关闭对话框
    setShowCancelDialog(false)
    
    // 4. 刷新用户数据
    await refreshUserInfo()
    
  } catch (error) {
    toast.error("Failed to cancel subscription. Please try again.")
  } finally {
    setCanceling(false)
  }
}
```

---

### 5️⃣ 后端处理

**API**: `DELETE /api/subscription/manage`

**处理流程**：

```typescript
// 1. 验证用户登录
const { user } = await supabase.auth.getUser()
if (!user) return 401

// 2. 查询用户订阅
const { data: subscription } = await supabase
  .from("user_subscriptions")
  .select("*")
  .eq("user_id", user.id)
  .single()

if (!subscription) return 404

// 3. 调用 Creem API 取消订阅
if (subscription.creem_subscription_id) {
  await creemClient.cancelSubscription(
    subscription.creem_subscription_id
  )
}

// 4. 更新本地状态
await supabase
  .from("user_subscriptions")
  .update({
    status: "canceled",
    updated_at: new Date()
  })
  .eq("user_id", user.id)

// 5. 返回成功
return { success: true }
```

---

### 6️⃣ Creem API 调用

**API**: `POST /v1/subscriptions/{id}/cancel`

**代码**：
```typescript
// lib/creem-config.ts
async cancelSubscription(subscriptionId: string) {
  const response = await fetch(
    `${this.apiUrl}/v1/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
      },
    }
  )
  
  if (!response.ok) {
    throw new Error(`Creem API Error: ${await response.text()}`)
  }
  
  return response.json()
}
```

**Creem 的处理**：
- ✅ 设置 `status = "canceled"`
- ✅ 关闭自动续费（`auto_renew = false`）
- ✅ 保留到周期结束的访问权限
- ✅ 到期后不再扣款

---

### 7️⃣ 取消后的状态

**用户订阅状态**（数据库）：

```json
{
  "tier": "basic",  // 保持不变（到期前仍是 Basic）
  "status": "canceled",  // ✅ 状态改为 canceled
  "current_period_end": "2025-12-01",
  "creem_subscription_id": "sub_xxx"
}
```

**Creem 订阅状态**：

```json
{
  "id": "sub_xxx",
  "status": "canceled",  // ✅ 已取消
  "auto_renew": false,   // ✅ 停止自动续费
  "current_period_end": "2025-12-01",
  "canceled_at": "2025-11-10T12:00:00Z"
}
```

---

### 8️⃣ 用户体验

**取消后立即**：
- ✅ 显示 toast："Subscription canceled. Changes will take effect at the end of the current period."
- ✅ 对话框关闭
- ✅ 页面数据刷新
- ✅ 订阅状态 Badge 可能变为 "Canceled"

**当前周期内**（例如到 12月1日前）：
- ✅ 仍可使用 Basic/Pro 功能
- ✅ 仍显示 Basic/Pro 限制
- ✅ Dashboard 显示到期日期

**周期结束后**（例如 12月1日后）：
- ✅ 自动降级到 Free
- ✅ 限制变为 Free（10次/月）
- ✅ 不会被扣款

---

## 📊 完整流程图

```
用户点击 "Cancel" 按钮
  ↓
弹出确认对话框
  ├─ "Keep Subscription" → 关闭对话框，不取消
  └─ "Confirm Cancellation" ↓
  
显示 "Processing..."
  ↓
调用 DELETE /api/subscription/manage
  ├─ 1. 调用 Creem API 取消订阅
  │    └─ Creem: status = "canceled", auto_renew = false
  ├─ 2. 更新本地数据库
  │    └─ user_subscriptions.status = "canceled"
  └─ 3. 返回成功
  ↓
显示成功 toast
  ↓
刷新页面数据
  └─ 订阅状态更新为 "canceled"
  ↓
完成

到期日：
  ↓
Creem 不再扣款（auto_renew = false）
  ↓
用户降级到 Free
  └─ tier: "free"
     monthly_limit: 10
```

---

## 🔍 关键代码位置

### Dashboard 页面

**文件**：`app/dashboard/page.tsx`

**关键代码**：

#### 取消按钮（第 269-283 行）

```tsx
{subscription?.status === "active" && (
  <div className="flex items-center justify-between">
    <div>
      <p className="font-medium">Cancel Subscription</p>
      <p className="text-sm text-muted-foreground">
        You'll be downgraded to free tier after the current period ends
      </p>
    </div>
    <Button
      variant="destructive"
      onClick={() => setShowCancelDialog(true)}
    >
      Cancel
    </Button>
  </div>
)}
```

#### 确认对话框（第 295-318 行）

```tsx
<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
      <AlertDialogDescription>
        After cancellation, you can still use until {endDate}.
        Then you'll be downgraded to free tier.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleCancelSubscription}
        disabled={canceling}
      >
        {canceling ? "Processing..." : "Confirm Cancellation"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### 取消处理函数（第 75-100 行）

```typescript
const handleCancelSubscription = async () => {
  setCanceling(true)
  
  try {
    // API 调用
    const response = await fetch("/api/subscription/manage", {
      method: "DELETE",
    })
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message)
    }
    
    // 成功提示
    toast.success("Subscription canceled. Changes will take effect at the end of the current period.")
    setShowCancelDialog(false)
    
    // 刷新数据
    await refreshUserInfo()
    
  } catch (error) {
    toast.error("Failed to cancel subscription. Please try again.")
  } finally {
    setCanceling(false)
  }
}
```

---

### 后端 API

**文件**：`app/api/subscription/manage/route.ts`

**DELETE 方法**（第 62-128 行）：

```typescript
export async function DELETE(request: NextRequest) {
  // 1. 验证用户
  const { user } = await supabase.auth.getUser()
  if (!user) return 401
  
  // 2. 查询订阅
  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single()
  
  if (!subscription) return 404
  
  // 3. 调用 Creem API 取消
  if (subscription.creem_subscription_id) {
    await creemClient.cancelSubscription(
      subscription.creem_subscription_id
    )
  }
  
  // 4. 更新本地状态
  await supabase
    .from("user_subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date()
    })
    .eq("user_id", user.id)
  
  // 5. 返回成功
  return { success: true }
}
```

---

## ⚙️ 关键特性

### 1. 保留到期前权限 ✅

**逻辑**：
- 取消时只修改 `status = "canceled"`
- **不修改** `tier` 和 `current_period_end`
- 用户在到期前仍可使用 Basic/Pro 功能

**示例**：
```
11月10日：取消订阅
  status: canceled
  tier: basic  ← 保持不变
  period_end: 2025-12-01

11月15日-12月1日：
  ✅ 仍可使用 Basic 功能
  ✅ 50次/月限制
  ✅ 全部功能可用

12月1日之后：
  需要手动或自动降级到 Free
  （可能需要定时任务处理）
```

---

### 2. 停止自动续费 ✅

**Creem API 调用**：
```typescript
await creemClient.cancelSubscription(subscriptionId)
```

**Creem 的处理**：
- ✅ `status = "canceled"`
- ✅ `auto_renew = false`
- ✅ 到期后不再扣款

---

### 3. 用户数据自动刷新 ✅

**使用 Context 的 `refreshUserInfo()`**：
```typescript
await refreshUserInfo()
```

**刷新内容**：
- ✅ 订阅信息
- ✅ 使用限制
- ✅ 用户层级

**优势**：
- ✅ 无需刷新页面
- ✅ 数据立即更新
- ✅ 用户体验流畅

---

## 📋 详细交互步骤

### Step 1：查看 Cancel 按钮

**条件**：
```typescript
subscription?.status === "active"
```

**显示**：
- Basic/Pro 用户 + Active 状态 → ✅ 显示
- Free 用户 → ❌ 不显示
- Canceled 状态 → ❌ 不显示

---

### Step 2：点击 Cancel

**State 变化**：
```typescript
setShowCancelDialog(true)
```

**UI 变化**：
- 弹出模态对话框
- 页面其他部分变暗（背景遮罩）

---

### Step 3：阅读确认信息

**对话框显示**：
```
标题：Are you sure you want to cancel?

描述：
After cancellation, you can still use the service 
until the end of your current billing period 
(Dec 1, 2025). Then you'll be automatically 
downgraded to the free tier.
```

**关键信息**：
- ✅ 到期日期（动态显示）
- ✅ 保留到期前权限
- ✅ 自动降级说明

---

### Step 4：确认或取消

#### 选项 A：Keep Subscription

```typescript
<AlertDialogCancel>Keep Subscription</AlertDialogCancel>
```

**行为**：
- 关闭对话框
- 不执行任何操作
- 订阅保持 Active

---

#### 选项 B：Confirm Cancellation

```typescript
<AlertDialogAction
  onClick={handleCancelSubscription}
  disabled={canceling}
>
  {canceling ? "Processing..." : "Confirm Cancellation"}
</AlertDialogAction>
```

**行为**：
1. 按钮显示 "Processing..."
2. 调用 API
3. 等待响应

---

### Step 5：API 处理

**请求**：
```
DELETE /api/subscription/manage
Authorization: Bearer {token}
```

**后端处理**：
```
1. 验证用户 ✅
2. 查询订阅 ✅
3. 调用 Creem API：
   POST /v1/subscriptions/{id}/cancel
4. 更新数据库：
   status = "canceled"
5. 返回成功
```

---

### Step 6：前端反馈

**成功**：
```typescript
toast.success("Subscription canceled. Changes will take effect at the end of the current period.")
```

**显示位置**：右下角 toast 通知

**持续时间**：约 3-5 秒

---

### Step 7：数据刷新

**调用**：
```typescript
await refreshUserInfo()
```

**刷新的数据**：
- `subscription.status` → "canceled"
- 可能影响页面显示（Badge 颜色等）

---

## 🔄 取消后的页面变化

### Dashboard 页面

**可能的变化**：

1. **订阅状态 Badge**：
   ```
   修改前：[Active]（绿色）
   修改后：[Canceled]（灰色）
   ```

2. **Cancel 按钮**：
   - 可能隐藏（`status !== "active"`）
   - 或禁用

3. **提示信息**：
   - 可能显示"Subscription will end on Dec 1, 2025"

---

### Home 页面

**周期结束前**：
- ✅ 仍显示 Basic/Pro 限制
- ✅ 所有功能可用

**周期结束后**：
- 需要后台任务将 `tier` 更新为 "free"
- 或前端检测 `status === "canceled" && period_end < now`

---

## ⚠️ 潜在问题

### 问题 1：取消后的降级时机

**当前实现**：
- ✅ Creem 订阅已取消（不会续费）
- ✅ 本地状态标记为 "canceled"
- ⚠️ 但 `tier` 未改变（仍是 basic/pro）

**可能需要**：
- 定时任务：检查 `status === "canceled" && period_end < now`
- 或前端逻辑：检测并显示 Free 限制

---

### 问题 2：取消后能否重新订阅？

**当前实现**：
- Creem 订阅已取消
- 用户可以去 Pricing 页面重新购买
- 会创建新的订阅

---

## 🧪 测试指南

### 测试场景 1：Basic 用户取消订阅

**步骤**：
1. Basic Monthly 用户登录
2. 访问 `/dashboard`
3. 找到 "Cancel Subscription"
4. 点击红色 "Cancel" 按钮
5. 阅读确认对话框
6. 点击 "Confirm Cancellation"

**预期**：
- [ ] 显示 "Processing..."
- [ ] 几秒后显示成功 toast
- [ ] 对话框自动关闭
- [ ] 订阅状态可能变为 "Canceled"

---

### 测试场景 2：取消后验证 Creem

**步骤**：
1. 访问 Creem Dashboard
2. 查看用户的订阅

**预期**：
- [ ] Status: Canceled
- [ ] Auto Renew: No/False
- [ ] Current Period End: 未改变

---

### 测试场景 3：取消后重新订阅

**步骤**：
1. 取消订阅
2. 访问 `/pricing`
3. 重新购买 Basic

**预期**：
- [ ] 可以正常购买
- [ ] 创建新订阅
- [ ] 旧订阅保持 canceled

---

## 🎯 总结

### 当前逻辑

**显示条件**：
- ✅ `subscription.status === "active"`
- ✅ Basic/Pro 用户

**交互流程**：
1. 点击按钮 → 确认对话框
2. 确认 → API 调用
3. 成功 → Toast + 数据刷新

**后端处理**：
1. 调用 Creem API 取消
2. 更新本地状态为 "canceled"
3. 返回成功

**用户权益**：
- ✅ 保留到周期结束
- ✅ 自动停止续费
- ✅ 到期后降级到 Free

---

**这就是当前的取消订阅功能！** 📋

需要我帮你优化或修改什么吗？
