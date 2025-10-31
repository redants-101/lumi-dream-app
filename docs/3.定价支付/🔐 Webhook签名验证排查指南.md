# 🔐 Webhook 签名验证排查指南

**目标**: 找出为什么 Creem Webhook 签名验证失败并修复

---

## 🔍 当前问题

```bash
[Webhook] Missing signature
POST /api/webhooks/creem 401
```

**问题**: Creem 发送的 Webhook 请求中找不到签名头

---

## ✅ 已完成的改进

### 1. 增强的签名头检测

**现在检查这些可能的签名头**:
```typescript
[
  "x-creem-signature",
  "x-signature", 
  "signature",
  "creem-signature",
  "webhook-signature",
  "x-webhook-signature"
]
```

### 2. 多格式签名验证

**支持 3 种签名格式**:
```typescript
// 格式 1: HMAC-SHA256 (hex)
expectedHex = hmac_sha256(payload, secret).hex()

// 格式 2: HMAC-SHA256 (base64)
expectedBase64 = hmac_sha256(payload, secret).base64()

// 格式 3: 带前缀
"sha256=xxxxx"
```

### 3. 详细的调试日志

**Webhook 日志会显示**:
- 所有 HTTP Headers
- 找到的签名头名称
- 签名值（前 20 个字符）
- 期望的签名值（多种格式）
- 验证结果

---

## 🧪 排查步骤

### 步骤 1: 触发 Webhook 并查看日志

#### 方法 A: 完成真实支付

1. 访问 `/pricing`
2. 点击订阅按钮
3. 完成测试支付
4. 查看终端日志

#### 方法 B: 在 Creem 后台手动测试

1. 登录 Creem 后台
2. 进入 Settings → Webhooks
3. 找到你的 Webhook
4. 点击 "Test" 或 "Send Test Event"
5. 查看终端日志

### 步骤 2: 分析日志输出

**日志示例 A - 找不到签名头**:
```json
🔔 [Webhook] Received request
[Webhook] Headers: {
  "content-type": "application/json",
  "user-agent": "Creem-Webhooks",
  "x-request-id": "xxx"
  // ← 没有任何签名相关的头！
}
[Webhook] Signature header name: NOT FOUND
❌ [Webhook] No signature found in headers
Checked headers: x-creem-signature, x-signature, ...
Available headers: content-type, user-agent, x-request-id
```

**原因**: Creem 测试环境可能不发送签名

---

**日志示例 B - 找到签名但验证失败**:
```json
🔔 [Webhook] Received request
[Webhook] Headers: {
  "x-creem-signature": "abc123def456...",
  ...
}
[Webhook] Signature header name: x-creem-signature
[Webhook] Signature value: abc123def456...

🔐 [Webhook Verification] Starting...
Payload length: 1234
Signature received: abc123def456...
Webhook Secret: SET
Expected (hex): 789xyz123...
Expected (base64): eHl6MTIz...
❌ Signature verification failed
None of the formats matched
```

**原因**: 签名算法或 secret 不匹配

---

### 步骤 3: 根据日志结果采取行动

#### 情况 A: 找不到签名头

**说明**: Creem 没有发送签名头

**可能原因**:
1. Creem 测试环境不发送签名
2. Webhook 配置中未启用签名
3. Creem 使用了我们未检查的头名称

**解决方案**:

1. **检查 Creem 后台配置**:
   - 进入 Settings → Webhooks
   - 确认 Webhook 签名已启用（如果有此选项）
   - 查看文档说明签名头的名称

2. **查看实际的头列表**:
   ```
   Available headers: content-type, user-agent, xxx
   ```
   在这个列表中找可能是签名的头

3. **联系 Creem 支持**:
   询问测试环境是否支持签名验证

#### 情况 B: 找到签名但验证失败

**说明**: 签名格式或算法不匹配

**可能原因**:
1. Webhook Secret 不正确
2. 签名算法不是 HMAC-SHA256
3. Payload 处理方式不同

**解决方案**:

1. **确认 Webhook Secret**:
   ```bash
   # 检查 .env.local
   CREEM_WEBHOOK_SECRET=whsec_2Xi0pGThjh7iyyXFgcl5WH
   
   # 在 Creem 后台确认一致
   ```

2. **比较签名值**:
   ```
   Signature received: abc123def456...
   Expected (hex):     789xyz123...
   Expected (base64):  eHl6MTIz...
   ```
   
   如果都不匹配，可能需要查看 Creem 文档了解正确的算法

3. **检查 Creem 文档**:
   查找 "Verify Webhook Requests" 页面
   确认正确的签名验证方法

---

## 📋 检查清单

### Creem 后台配置

- [ ] Webhook URL: `https://xxx.ngrok-free.dev/api/webhooks/creem`
- [ ] Webhook Secret: 已生成并复制
- [ ] Webhook Events: 已选择（checkout.session.completed 等）
- [ ] Webhook Status: Active
- [ ] 签名验证: 已启用（如果有此选项）

### 环境变量配置

- [ ] `CREEM_WEBHOOK_SECRET` 已配置
- [ ] Secret 与 Creem 后台一致
- [ ] Secret 格式正确（通常以 `whsec_` 开头）
- [ ] 服务器已重启

### 代码配置

- [x] 支持多种签名头名称 ✅
- [x] 支持多种签名格式 ✅
- [x] 详细调试日志 ✅
- [x] 错误信息包含调试信息 ✅

---

## 🔧 下一步行动

### 立即执行

1. **触发一次 Webhook**（完成支付或后台测试）
2. **查看终端完整日志**
3. **根据日志分析**:
   - 签名头是否存在？
   - 签名头的名称是什么？
   - 签名验证结果如何？

### 根据结果调整

#### 如果找不到签名头 → 检查 Creem 后台配置

#### 如果找到签名但验证失败 → 查看 Creem 签名算法文档

#### 如果仍然无法解决 → 联系 Creem 支持

---

## 📚 Creem Webhook 文档

- [Webhook Introduction](https://docs.creem.io/learn/webhooks/introduction)
- [Verify Webhook Requests](https://docs.creem.io/learn/webhooks/verify-webhook-requests)
- [Event Types](https://docs.creem.io/learn/webhooks/event-types)

**关键**: 查看 "Verify Webhook Requests" 页面了解正确的验证方法

---

## 🎯 预期结果

修复后，Webhook 应该显示：

```
🔔 [Webhook] Received request
[Webhook] Headers: {
  "x-creem-signature": "abc123...",
  ...
}
[Webhook] Signature header name: x-creem-signature
[Webhook] Signature value: abc123...

🔐 [Webhook Verification] Starting...
Signature received: abc123...
Webhook Secret: SET
Expected (hex): abc123...
✅ Signature verified (hex format)

✅ [Webhook] Signature verified successfully
[Webhook] 📦 Event received: checkout.session.completed
[Webhook] Processing for user: xxx
[Webhook] ✅ Subscription activated for user: xxx
```

---

## ⚠️ 临时解决方案（不推荐）

如果必须快速测试但无法解决签名问题，可以临时跳过验证：

```bash
# .env.local（仅测试用！）
CREEM_SKIP_SIGNATURE=true
```

然后修改代码：
```typescript
const skipValidation = process.env.CREEM_SKIP_SIGNATURE === "true"
if (!signature && !skipValidation) {
  return Response.json({ error: "Missing signature" }, { status: 401 })
}
```

**警告**: ⚠️ 生产环境**必须**启用签名验证！

---

## 🎉 总结

### 已完成

- ✅ 增强签名头检测（6 种可能的头名称）
- ✅ 支持多种签名格式（hex, base64, 带前缀）
- ✅ 详细的调试日志输出
- ✅ 详细的错误信息

### 待确认

- [ ] 触发一次 Webhook
- [ ] 查看完整日志
- [ ] 确认实际的签名头名称
- [ ] 确认签名验证结果

### 下一步

**立即测试**: 完成一次支付，查看 Webhook 日志，根据日志调整配置。

---

**修复状态**: ✅ 代码已优化  
**测试状态**: ⏳ 待触发 Webhook  
**文档参考**: [Creem Webhook Docs](https://docs.creem.io/learn/webhooks/introduction)

🔍 **请触发一次支付，然后把 Webhook 日志发给我，我会帮你分析！**

