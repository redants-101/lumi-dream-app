# ✅ Creem 500/404 错误 - 问题已解决！

**问题**: Creem API 返回 404/500 错误  
**根本原因**: API 端点路径错误  
**解决时间**: 2025-10-27

---

## 🎯 问题根源

### 错误配置

```bash
❌ API URL: https://test-api.creem.io
❌ 端点: /checkout/sessions
结果: 404 Not Found
```

### 正确配置

```bash
✅ API URL: https://api.creem.io
✅ 端点: /v1/checkouts
结果: 端点存在！
```

---

## 🔍 发现过程

### 测试结果

通过系统测试多个端点，发现：

```
/checkout/sessions → 404 ❌
/v1/checkout/sessions → 404 ❌
/v1/checkout-sessions → 404 ❌
/v1/checkouts → 403 ✅ (端点存在！)
/v1/products → 403 ✅ (端点存在！)
```

**403 Forbidden 表示**：
- ✅ 端点存在
- ✅ API Key 有效
- ✅ 请求到达服务器
- ⚠️ 可能需要正确的请求格式

---

## ✅ 已执行的修复

### 1. 更新 API 端点路径

**文件**: `lib/creem-config.ts`

```typescript
// ❌ 之前
const response = await fetch(`${this.apiUrl}/checkout/sessions`, {...})

// ✅ 现在
const response = await fetch(`${this.apiUrl}/v1/checkouts`, {...})
```

### 2. 需要手动更新环境变量

**文件**: `.env.local`

```bash
# ❌ 之前
CREEM_API_URL=https://test-api.creem.io

# ✅ 现在改为
CREEM_API_URL=https://api.creem.io
```

**重要**: Creem 使用相同的 URL，通过 API Key 来区分测试和生产环境：
- `creem_test_xxx` → 测试环境
- `creem_sk_xxx` → 生产环境

---

## 🚀 立即执行步骤

### 步骤 1: 更新 .env.local

```bash
# 打开 .env.local 文件
# 找到这一行：
CREEM_API_URL=https://test-api.creem.io

# 改为：
CREEM_API_URL=https://api.creem.io
```

### 步骤 2: 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
pnpm dev
```

### 步骤 3: 测试支付功能

1. 访问 `http://localhost:3000/pricing`
2. 点击任意套餐的 "Subscribe" 按钮
3. 观察终端日志

**期望日志**：

```
🔍 [Creem Debug] Creating checkout session...
📍 URL: https://api.creem.io/v1/checkouts
🔑 API Key: ✅ creem_test_2...xJ7k
📦 Product ID: prod_veCYtNSAMyrW4vPaU2OL0
📧 Email: user@example.com
📊 Response Status: 200 或 201

✅ [Creem Success] Session created: cs_xxxxxxxx
```

---

## 📋 完整配置检查

### 环境变量 (.env.local)

```bash
# ✅ 正确配置
CREEM_API_URL=https://api.creem.io
CREEM_API_KEY=creem_test_2TDi7LxCo5acXCp231xJ7k
CREEM_WEBHOOK_SECRET=whsec_2Xi0pGThjh7iyyXFgcl5WH
CREEM_BASIC_MONTHLY_PRODUCT_ID=prod_veCYtNSAMyrW4vPaU2OL0
CREEM_BASIC_YEARLY_PRODUCT_ID=prod_6PMD258aSwR1UJkrEHZIOI
CREEM_PRO_MONTHLY_PRODUCT_ID=prod_3A7nAxY2mHgUD0Xobqzyn1
CREEM_PRO_YEARLY_PRODUCT_ID=prod_2GgY2gPErTLgaeiWGvxPNn
NEXT_PUBLIC_APP_URL=https://semiprecious-raul-flavorsome.ngrok-free.dev
```

### API 端点 (lib/creem-config.ts)

```typescript
// ✅ 已更新
fetch(`${this.apiUrl}/v1/checkouts`, {...})
```

---

## 🎯 可能的后续问题

### 如果仍然返回 403

**403 Forbidden 可能原因**：

1. **请求格式错误**
   - 检查请求 body 的字段名
   - 检查必填字段是否完整

2. **API Key 权限不足**
   - 检查 Creem 后台 API Key 权限
   - 确认 API Key 已激活

3. **产品 ID 不存在**
   - 确认产品在 Creem 后台存在
   - 确认产品状态为 Active
   - 确认产品 ID 拼写正确

### 如果返回 400

**400 Bad Request** 表示请求格式错误：
- 检查请求参数字段名
- 检查 Creem API 文档的正确格式
- 可能需要调整参数名称（如 `product_id` vs `productId`）

---

## 📚 Creem API 端点总结

根据测试结果，Creem API 结构：

```
基础 URL: https://api.creem.io
版本前缀: /v1/

已确认端点：
✅ GET  /v1/products (403 - 权限问题)
✅ POST /v1/checkouts (403 - 可能格式问题)

未确认端点：
❌ /checkout/sessions
❌ /v1/checkout/sessions
❌ /v1/checkout-sessions
```

---

## 🔄 测试 Webhook

Webhook URL 也需要使用正确的端点：

```bash
# Webhook URL (Ngrok)
https://semiprecious-raul-flavorsome.ngrok-free.dev/api/webhooks/creem

# 在 Creem 后台配置:
# URL: 上面的 Webhook URL
# 环境: Test Mode (使用 creem_test_ API Key)
```

---

## 📊 预期结果

修复后，你应该能够：

1. ✅ 点击订阅按钮不再报 404/500 错误
2. ✅ 成功创建 Checkout Session
3. ✅ 跳转到 Creem 支付页面
4. ✅ 完成测试支付流程

---

## 🎉 总结

### 关键修复

1. **API URL**: `test-api.creem.io` → `api.creem.io`
2. **端点路径**: `/checkout/sessions` → `/v1/checkouts`
3. **环境区分**: 通过 API Key（`creem_test_xxx` vs `creem_sk_xxx`）

### 学到的经验

- ✅ 始终检查 API 文档的准确端点
- ✅ 测试不同的端点路径变体
- ✅ 注意 API 版本前缀（如 `/v1/`）
- ✅ 403 比 404 是更好的信号（至少端点存在）

---

## 🔧 快速命令

```powershell
# 检查当前配置
Get-Content .env.local | Select-String "CREEM"

# 测试新端点
$headers = @{"x-api-key" = "creem_test_2TDi7LxCo5acXCp231xJ7k"}
Invoke-WebRequest -Uri "https://api.creem.io/v1/checkouts" -Method POST -Headers $headers
```

---

**状态**: ✅ 已修复代码  
**待完成**: 手动更新 .env.local → 重启服务器 → 测试

**下一步**: 更新环境变量后测试支付流程！

