# 🔐 Creem 支付集成完整指南

> Creem 是一个简单易用的支付平台，专为独立开发者和小型企业设计  
> 文档：https://docs.creem.io/

---

## 📋 目录

1. [为什么选择 Creem](#为什么选择-creem)
2. [集成架构](#集成架构)
3. [快速开始](#快速开始)
4. [数据库配置](#数据库配置)
5. [API 路由说明](#api-路由说明)
6. [Webhook 配置](#webhook-配置)
7. [测试指南](#测试指南)
8. [常见问题](#常见问题)

---

## 🎯 为什么选择 Creem

### Creem vs Stripe

| 特性 | Creem | Stripe |
|------|-------|--------|
| **设置复杂度** | ⭐ 简单 | ⭐⭐⭐ 复杂 |
| **文档友好度** | ⭐⭐⭐ 清晰 | ⭐⭐ 完整但复杂 |
| **手续费** | 2.9% + $0.30 | 2.9% + $0.30 |
| **支持支付方式** | 信用卡、支付宝、微信 | 信用卡为主 |
| **API 简洁度** | ⭐⭐⭐ 非常简洁 | ⭐⭐ 功能全面但复杂 |
| **适合场景** | 独立开发者、MVP | 企业、复杂需求 |

**结论**: Creem 更适合 Lumi 这样的独立产品，简单易用，快速上线。

---

## 🏗️ 集成架构

```
用户访问定价页面
    │
    ├─ 点击"订阅"按钮
    │
    ├─ 前端调用 /api/checkout/create-session
    │   │
    │   └─ 创建 Creem 结账会话
    │       ├─ 获取 checkout_url
    │       └─ 重定向到 Creem 支付页面
    │
    ├─ 用户在 Creem 完成支付
    │
    ├─ Creem 发送 Webhook 到 /api/webhooks/creem
    │   │
    │   ├─ 验证签名
    │   ├─ 更新 Supabase 订阅状态
    │   └─ 激活用户权限
    │
    └─ 重定向到 /pricing/success
```

---

## 🚀 快速开始

### 步骤 1: 创建 Creem 账户

1. 访问 [Creem 官网](https://creem.io)
2. 注册账户并完成邮箱验证
3. 进入仪表板

### 步骤 2: 创建产品

在 Creem 后台创建 4 个产品：

```
1. Basic 版 - 月付
   - 名称: Lumi Basic Monthly
   - 价格: $4.99
   - 计费周期: 月付
   - 描述: 50 次/月 Claude Haiku 解析

2. Basic 版 - 年付
   - 名称: Lumi Basic Yearly
   - 价格: $49.00
   - 计费周期: 年付
   - 描述: 50 次/月 Claude Haiku 解析（年付省 18%）

3. Pro 版 - 月付
   - 名称: Lumi Pro Monthly
   - 价格: $9.99
   - 计费周期: 月付
   - 描述: 200 次/月 Claude Sonnet 解析

4. Pro 版 - 年付
   - 名称: Lumi Pro Yearly
   - 价格: $99.00
   - 计费周期: 年付
   - 描述: 200 次/月 Claude Sonnet 解析（年付省 17%）
```

### 步骤 3: 获取 API 密钥

1. 在 Creem 仪表板 → 设置 → API 密钥
2. 创建新的 API 密钥
3. 复制 API Key 和 Webhook Secret

### 步骤 4: 配置环境变量

创建 `.env.local` 文件：

```bash
# Creem 配置
CREEM_API_KEY=creem_sk_xxxxxxxxxxxxxxxx
CREEM_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx

# 产品 ID（从 Creem 后台获取）
CREEM_BASIC_MONTHLY_PRODUCT_ID=prod_xxxxxxxx
CREEM_BASIC_YEARLY_PRODUCT_ID=prod_xxxxxxxx
CREEM_PRO_MONTHLY_PRODUCT_ID=prod_xxxxxxxx
CREEM_PRO_YEARLY_PRODUCT_ID=prod_xxxxxxxx

# 应用 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 步骤 5: 配置数据库

运行以下 SQL 创建订阅表：

```sql
-- 用户订阅表
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 订阅信息
  tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'pro')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired')),
  
  -- Creem 相关
  creem_subscription_id TEXT,
  creem_customer_email TEXT,
  
  -- 时间戳
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 创建索引
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_creem_id ON user_subscriptions(creem_subscription_id);

-- RLS 策略
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

### 步骤 6: 配置 Webhook

1. 在 Creem 后台 → 设置 → Webhooks
2. 添加 Webhook URL: `https://yourdomain.com/api/webhooks/creem`
3. 选择要监听的事件：
   - ✅ `checkout.session.completed`
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.canceled`
   - ✅ `subscription.expired`

---

## 📂 文件结构

```
lumi-dream-app/
├── app/
│   ├── pricing/
│   │   ├── page.tsx              # 定价页面
│   │   └── success/
│   │       └── page.tsx          # 支付成功页面
│   └── api/
│       ├── checkout/
│       │   └── create-session/
│       │       └── route.ts      # 创建结账会话
│       ├── subscription/
│       │   └── manage/
│       │       └── route.ts      # 订阅管理 API
│       └── webhooks/
│           └── creem/
│               └── route.ts      # Webhook 处理器
├── lib/
│   ├── creem-config.ts          # Creem 配置
│   └── pricing-config.ts        # 定价配置
└── docs/
    └── CREEM_INTEGRATION.md     # 本文档
```

---

## 🔌 API 路由说明

### 1. 创建结账会话

**端点**: `POST /api/checkout/create-session`

**请求体**:
```json
{
  "tier": "basic",              // "basic" | "pro"
  "billingCycle": "monthly"     // "monthly" | "yearly"
}
```

**响应**:
```json
{
  "sessionId": "cs_xxxxxxxx",
  "checkoutUrl": "https://checkout.creem.io/xxxxxxxx"
}
```

**流程**:
1. 验证用户登录状态
2. 获取对应的 Creem 产品 ID
3. 调用 Creem API 创建结账会话
4. 返回支付链接

---

### 2. 获取订阅信息

**端点**: `GET /api/subscription/manage`

**响应**:
```json
{
  "tier": "basic",
  "billing_cycle": "monthly",
  "status": "active",
  "current_period_end": "2025-11-21T00:00:00Z"
}
```

---

### 3. 取消订阅

**端点**: `DELETE /api/subscription/manage`

**响应**:
```json
{
  "success": true,
  "message": "Subscription canceled successfully"
}
```

**注意**: 取消后用户仍可使用至当前计费周期结束。

---

## 🎣 Webhook 处理

### 事件类型

#### 1. `checkout.session.completed`

支付完成，订阅激活。

**处理逻辑**:
- 创建/更新 `user_subscriptions` 记录
- 设置 `status = 'active'`
- 记录 `creem_subscription_id`
- 计算 `current_period_end`

#### 2. `subscription.created`

订阅创建（通常在 checkout 后自动触发）。

#### 3. `subscription.updated`

订阅更新（升级/降级套餐）。

**处理逻辑**:
- 更新 `tier` 和 `billing_cycle`
- 更新 `updated_at`

#### 4. `subscription.canceled`

用户主动取消订阅。

**处理逻辑**:
- 设置 `status = 'canceled'`
- 保留至 `current_period_end`

#### 5. `subscription.expired`

订阅到期/支付失败。

**处理逻辑**:
- 设置 `status = 'expired'`
- 降级至 `tier = 'free'`

---

## 🧪 测试指南

### 本地测试

1. **启动本地服务器**:
   ```bash
   pnpm dev
   ```

2. **使用 Ngrok 暴露本地端口**:
   ```bash
   ngrok http 3000
   ```

3. **配置 Creem Webhook**:
   - URL: `https://your-ngrok-url.ngrok.io/api/webhooks/creem`

4. **测试支付流程**:
   - 访问 `http://localhost:3000/pricing`
   - 点击"订阅"按钮
   - 使用 Creem 测试卡号完成支付

### Creem 测试卡号

```
信用卡号: 4242 4242 4242 4242
过期日期: 任意未来日期
CVV: 任意 3 位数字
邮编: 任意
```

---

## 🔍 调试技巧

### 1. 查看 Webhook 日志

在 Creem 后台 → Webhooks → 事件日志，可以看到：
- Webhook 发送记录
- 响应状态码
- 重试次数

### 2. 本地调试 Webhook

在 `app/api/webhooks/creem/route.ts` 中添加日志：

```typescript
console.log("[Webhook] Event:", JSON.stringify(event, null, 2))
```

### 3. 验证签名问题

如果 webhook 签名验证失败：
- 检查 `CREEM_WEBHOOK_SECRET` 是否正确
- 确认 webhook 配置中的密钥与环境变量一致

---

## 📊 订阅状态流转

```
用户注册
    │
    ├─ 状态: free
    │
    ├─ 点击订阅
    │
    ├─ 支付成功 → Webhook: checkout.session.completed
    │   │
    │   └─ 状态: active (basic 或 pro)
    │
    ├─ 用户主动取消
    │   │
    │   └─ 状态: canceled (保留至周期结束)
    │
    ├─ 订阅到期
    │   │
    │   └─ 状态: expired → 自动降级至 free
    │
    └─ 续费成功 → Webhook: subscription.updated
        │
        └─ 状态: active
```

---

## 🛡️ 安全最佳实践

### 1. Webhook 签名验证

**必须**验证所有 webhook 请求的签名：

```typescript
const signature = request.headers.get("x-creem-signature")
const isValid = creemClient.verifyWebhookSignature(payload, signature)

if (!isValid) {
  return Response.json({ error: "Invalid signature" }, { status: 401 })
}
```

### 2. API 密钥安全

- ❌ 不要在客户端代码中使用 `CREEM_API_KEY`
- ✅ 仅在服务端 API 路由中使用
- ✅ 使用环境变量存储敏感信息

### 3. 用户权限验证

在所有订阅相关 API 中验证用户身份：

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return Response.json({ error: "Unauthorized" }, { status: 401 })
}
```

---

## ❓ 常见问题

### Q1: 用户支付成功但订阅未激活？

**排查步骤**:
1. 检查 Creem Webhook 是否正确配置
2. 查看 webhook 事件日志，确认是否收到 `checkout.session.completed`
3. 检查服务器日志，确认 webhook 处理是否成功
4. 验证数据库 `user_subscriptions` 表是否有记录

### Q2: Webhook 签名验证失败？

**解决方法**:
1. 确认 `CREEM_WEBHOOK_SECRET` 与 Creem 后台一致
2. 检查 webhook 配置中的密钥是否正确
3. 确保使用原始 payload 进行签名验证（不要先解析 JSON）

### Q3: 如何测试取消订阅？

**步骤**:
1. 完成一次测试支付
2. 调用 `DELETE /api/subscription/manage`
3. 在 Creem 后台查看订阅状态
4. 验证数据库中 `status` 是否为 `canceled`

### Q4: 年付用户如何按月退款？

**策略**:
- Creem 支持按比例退款
- 在 `DELETE /api/subscription/manage` 中调用 Creem 退款 API
- 计算已使用月份，退还剩余金额

---

## 📚 相关文档

| 文档 | 链接 |
|------|------|
| Creem 官方文档 | https://docs.creem.io/ |
| Creem API 参考 | https://docs.creem.io/api-reference/introduction |
| Pricing 配置 | [pricing-config.ts](../lib/pricing-config.ts) |
| 定价策略 V2 | [PRICING_STRATEGY_V2_HAIKU_FREE.md](./PRICING_STRATEGY_V2_HAIKU_FREE.md) |

---

## 🎯 下一步

1. ✅ 完成 Creem 账户注册
2. ✅ 创建产品并获取产品 ID
3. ✅ 配置环境变量
4. ✅ 运行数据库迁移
5. ✅ 配置 Webhook URL
6. ⬜ 测试完整支付流程
7. ⬜ 部署到生产环境

---

**文档版本**: v1.0  
**最后更新**: 2025-10-21  
**状态**: ✅ 集成完成，待测试

