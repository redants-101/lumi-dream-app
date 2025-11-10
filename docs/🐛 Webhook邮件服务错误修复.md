# 🐛 Webhook 邮件服务错误修复

## 🔍 错误分析

### 错误现象

```bash
POST /api/webhooks/creem 500 in 343ms
⨯ Error: Missing API key. Pass it to the constructor `new Resend("re_123")`
   at eval (lib\services\email-service.ts:11:16)
> 11 | const resend = new Resend(process.env.RESEND_API_KEY)
     |                ^
```

### 问题根源

```
1. Creem 发送 webhook
   POST /api/webhooks/creem
   ↓
2. Webhook 路由加载
   import { sendRenewalFailedEmail } from "@/lib/services/email-service"
   ↓
3. email-service.ts 模块初始化
   const resend = new Resend(process.env.RESEND_API_KEY)
   ↓
4. ❌ RESEND_API_KEY 未定义（环境变量未配置）
   Resend 抛出错误："Missing API key"
   ↓
5. 模块加载失败
   ↓
6. Webhook 处理失败
   返回 500 错误
   ↓
7. ❌ 订阅未激活
   因为 webhook 没有成功处理
```

### 为什么会影响订阅激活？

**关键点**：虽然 webhook 路由不直接发送邮件，但：

1. **导入了 email-service.ts**
   ```typescript
   // app/api/webhooks/creem/route.ts
   import { sendRenewalFailedEmail } from "@/lib/services/email-service"
   ```

2. **模块初始化时就执行**
   ```typescript
   // lib/services/email-service.ts
   // ❌ 这行代码在模块加载时就执行！
   const resend = new Resend(process.env.RESEND_API_KEY)
   ```

3. **即使不调用，也会报错**
   - 只要导入模块，就会初始化
   - 初始化失败，整个模块加载失败
   - 导致 webhook 路由无法启动

## ✅ 修复方案

### 修复内容

修改了 `lib/services/email-service.ts`，让它能够**优雅降级**：

#### 修复前（会崩溃）

```typescript
// ❌ 直接初始化，如果 API Key 不存在就崩溃
const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendRenewalReminderEmail(params) {
  // ⚠️ 这里检查已经太晚了，模块初始化时就崩溃了
  if (!process.env.RESEND_API_KEY) {
    return false
  }
  
  await resend.emails.send(...)  // 永远执行不到这里
}
```

#### 修复后（优雅降级）

```typescript
// ✅ 检查 API Key 是否配置
const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_ENABLED = !!RESEND_API_KEY

// ✅ 条件初始化：有 API Key 才创建客户端
const resend = EMAIL_ENABLED ? new Resend(RESEND_API_KEY) : null

// ✅ 警告日志
if (!EMAIL_ENABLED) {
  console.warn("⚠️ [Email Service] RESEND_API_KEY not configured - email sending disabled")
}

export async function sendRenewalReminderEmail(params) {
  // ✅ 检查服务是否启用
  if (!EMAIL_ENABLED || !resend) {
    console.warn("[Email] Email service not enabled - skipping renewal reminder")
    return false  // 返回 false 但不抛出错误
  }
  
  await resend.emails.send(...)  // 只有在启用时才调用
}
```

### 修复效果

**修复前**：
```
Webhook 收到 → 加载模块 → ❌ 崩溃 → 500 错误 → 订阅未激活
```

**修复后**：
```
Webhook 收到 → 加载模块 → ✅ 成功（跳过邮件） → 200 成功 → ✅ 订阅激活
```

## 🔧 如何应用修复

### 步骤 1：重启开发服务器

修改已自动保存，需要重启服务器：

```bash
# 按 Ctrl+C 停止当前服务器
# 然后重新启动
pnpm dev
```

### 步骤 2：等待 Creem 重试 Webhook

Creem 会**自动重试**失败的 webhook：

- **重试间隔**：通常是 1 分钟、5 分钟、15 分钟...
- **最多重试**：通常 10-20 次
- **查看状态**：Creem Dashboard → Webhooks

**或者手动重发**：
1. 访问 Creem Dashboard
2. 找到 Webhooks 页面
3. 找到失败的事件
4. 点击 "Resend"

### 步骤 3：观察日志

重启后，webhook 应该显示：

```bash
🔔 [Webhook] Received request
⚠️ [Email Service] RESEND_API_KEY not configured - email sending disabled
✅ [Webhook] Signature verified successfully
📦 [Webhook] Event received: checkout.completed
💳 [Webhook] Checkout completed: ch_6kSkxaYzBmHpdRXmZshm1G
✅ [Webhook] Subscription activated successfully!
⚠️ [Email] Email service not enabled - skipping renewal failed notification
POST /api/webhooks/creem 200 in 500ms  ← ✅ 200 成功！
```

### 步骤 4：验证订阅激活

```javascript
// 在浏览器控制台执行
fetch('/api/subscription/manage')
  .then(r => r.json())
  .then(d => console.log(d))

// 应该返回：
// {
//   success: true,
//   data: {
//     tier: "basic",  ← ✅ 已激活！
//     status: "active"
//   }
// }
```

或者直接访问：
- `/dashboard` - 查看订阅状态
- `/` - 使用解梦功能，应该显示 Basic 会员限制

## 📋 两个方案对比

### 方案 1：禁用邮件功能（当前方案）✅

**优点**：
- ✅ 立即解决问题
- ✅ Webhook 可以正常工作
- ✅ 订阅正常激活
- ✅ 不需要额外配置

**缺点**：
- ⚠️ 不发送确认邮件
- ⚠️ 不发送续费提醒
- ⚠️ 生产环境需要邮件功能

**适用场景**：
- 开发/测试环境
- 快速验证功能
- 不需要邮件通知

### 方案 2：配置 Resend API Key（完整方案）

**步骤**：

1. **注册 Resend 账号**
   - 访问：https://resend.com
   - 免费额度：100 封/天，3000 封/月

2. **获取 API Key**
   - Dashboard → API Keys → Create API Key
   - 复制 `re_xxxxxxxxxxxxx`

3. **配置环境变量**
   ```bash
   # .env.local
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@lumidreams.app
   ```

4. **验证域名**（可选，用于发送邮件）
   - Resend Dashboard → Domains
   - 添加你的域名
   - 设置 DNS 记录

5. **重启服务器**
   ```bash
   pnpm dev
   ```

**优点**：
- ✅ 完整功能
- ✅ 发送确认邮件
- ✅ 发送续费提醒
- ✅ 生产环境可用

**缺点**：
- ⚠️ 需要额外配置
- ⚠️ 需要验证域名（生产环境）
- ⚠️ 免费额度有限

## 🔍 验证修复是否成功

### 检查 1：服务器启动日志

```bash
# 应该看到警告（不是错误）
⚠️ [Email Service] RESEND_API_KEY not configured - email sending disabled
```

### 检查 2：Webhook 处理日志

```bash
POST /api/webhooks/creem 200 in 500ms  ← ✅ 200 成功
✅ [Webhook] Subscription activated successfully!
```

### 检查 3：订阅状态

```javascript
fetch('/api/subscription/manage').then(r => r.json()).then(console.log)
// tier: "basic" ✅
```

### 检查 4：功能测试

- 访问首页，解梦功能应该显示 Basic 会员限制
- 访问 Dashboard，应该显示 Basic 会员信息

## 🚨 常见问题

### Q1：修复后仍然显示 500 错误？

**原因**：服务器未重启，仍在使用旧代码

**解决**：
```bash
# 完全停止服务器（Ctrl+C）
# 删除缓存
Remove-Item -Recurse -Force .next
# 重新启动
pnpm dev
```

### Q2：Webhook 一直不来？

**原因**：Creem 可能已经放弃重试

**解决**：
1. 在 Creem Dashboard 手动 Resend
2. 或使用手动激活 SQL（临时方案）

### Q3：将来如何启用邮件功能？

**步骤**：
1. 获取 Resend API Key
2. 添加到 `.env.local`
3. 重启服务器
4. 自动启用邮件发送

## 📊 影响范围

### 受影响的功能

- ❌ 订阅确认邮件（暂时不发送）
- ❌ 续费提醒邮件（暂时不发送）
- ❌ 续费失败通知（暂时不发送）

### 不受影响的功能

- ✅ Webhook 处理（正常工作）
- ✅ 订阅激活（正常工作）
- ✅ 支付流程（正常工作）
- ✅ 用户权限（正常生效）
- ✅ Dashboard 显示（正常显示）

## 🎯 总结

**问题**：缺少 `RESEND_API_KEY` 导致 webhook 崩溃

**修复**：优雅降级，未配置时跳过邮件功能

**效果**：
- ✅ Webhook 正常处理
- ✅ 订阅正常激活
- ⚠️ 邮件功能暂时禁用

**下一步**：
1. 重启服务器
2. 等待 webhook 重试或手动重发
3. 验证订阅激活
4. （可选）配置 Resend 启用邮件

---

**修复时间**：2025-11-05  
**修复文件**：`lib/services/email-service.ts`  
**状态**：✅ 已修复，等待验证

