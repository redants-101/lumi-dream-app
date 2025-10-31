# 🔍 Creem 500 错误排查报告

**问题**: Creem API 返回 500 错误  
**日期**: 2025-10-27  
**状态**: 正在排查

---

## ✅ 已确认的配置

### 环境变量配置（已验证存在）

```bash
✅ CREEM_API_URL=https://test-api.creem.io
✅ CREEM_API_KEY=creem_test_2TDi7LxCo5acXCp231xJ7k
✅ CREEM_WEBHOOK_SECRET=whsec_2Xi0pGThjh7iyyXFgcl5WH
✅ CREEM_BASIC_MONTHLY_PRODUCT_ID=prod_veCYtNSAMyrW4vPaU2OL0
✅ CREEM_BASIC_YEARLY_PRODUCT_ID=prod_6PMD258aSwR1UJkrEHZIOI
✅ CREEM_PRO_MONTHLY_PRODUCT_ID=prod_3A7nAxY2mHgUD0Xobqzyn1
✅ CREEM_PRO_YEARLY_PRODUCT_ID=prod_2GgY2gPErTLgaeiWGvxPNn
✅ NEXT_PUBLIC_APP_URL=https://semiprecious-raul-flavorsome.ngrok-free.dev
```

### 网络检查

- ✅ 域名 `test-api.creem.io` 可以 ping 通
- ✅ IP 地址: 172.67.69.227
- ✅ 网络连接正常

---

## 🎯 问题分析

### HTTP 500 错误含义

```json
{
  "statusCode": 500,
  "timestamp": "2025-10-27T11:25:09.538Z",
  "path": "/checkout/sessions"
}
```

**500 错误表示**：
- 请求已到达 Creem 服务器 ✅
- 服务器接收了请求 ✅
- 服务器处理请求时发生内部错误 ❌

---

## 🔍 可能的原因

### 1. **API Key 问题** ⚠️⚠️⚠️ (最可能)

**检查项**：
- API Key 格式正确: `creem_test_xxx` ✅
- API Key 是测试环境密钥 ✅
- 但可能：
  - ❓ API Key 已过期
  - ❓ API Key 权限不足
  - ❓ API Key 未激活

**验证方法**：
```bash
# 测试 API Key 是否有效
curl -X GET "https://test-api.creem.io/products" \
  -H "x-api-key: creem_test_2TDi7LxCo5acXCp231xJ7k"

# 如果返回 401 - API Key 无效
# 如果返回 200 - API Key 有效
# 如果返回 403 - API Key 权限不足
```

### 2. **产品 ID 不存在** ⚠️⚠️ (很可能)

**检查项**：
- 产品 ID 已配置 ✅
- 但可能：
  - ❓ 产品在测试环境不存在
  - ❓ 产品状态为非活跃
  - ❓ 产品 ID 复制错误

**验证方法**：
1. 登录 Creem 测试环境后台
2. 检查 Products 列表
3. 确认产品 ID 与配置一致
4. 确认产品状态为 "Active"

### 3. **测试环境配置问题** ⚠️ (可能)

**可能原因**：
- Creem 测试环境未完全设置
- 测试账户权限不足
- 测试环境 API 限制

---

## 🛠️ 排查步骤

### 步骤 1: 重启开发服务器（查看调试日志）

```bash
# 停止当前服务器（Ctrl+C）
pnpm dev
```

**期望看到的日志**：
```
🔍 [Creem Debug] Creating checkout session...
📍 URL: https://test-api.creem.io/checkout/sessions
🔑 API Key: ✅ creem_test_2T...7k
📦 Product ID: prod_veCYtNSAMyrW4vPaU2OL0
📧 Email: user@example.com
🔗 Success URL: https://...ngrok-free.dev/pricing/success
🔗 Cancel URL: https://...ngrok-free.dev/pricing
```

### 步骤 2: 测试支付流程

1. 访问 `http://localhost:3000/pricing`
2. 点击任意套餐的 "Subscribe" 按钮
3. **观察终端日志**

### 步骤 3: 分析日志

**关键检查点**：
- [ ] API Key 是否显示 `✅`
- [ ] Product ID 是否正确
- [ ] Response Status 是什么（500?）
- [ ] 错误响应的详细内容

---

## 🧪 测试 API Key 有效性

### 方法 1: 使用 PowerShell

```powershell
$headers = @{
    "x-api-key" = "creem_test_2TDi7LxCo5acXCp231xJ7k"
}

try {
    $response = Invoke-RestMethod -Uri "https://test-api.creem.io/products" -Headers $headers
    Write-Host "✅ API Key 有效"
    Write-Host "产品列表:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ API Key 无效或 API 调用失败" -ForegroundColor Red
    Write-Host "错误:" $_.Exception.Message
}
```

### 方法 2: 使用 curl（如果已安装）

```bash
curl -X GET "https://test-api.creem.io/products" \
  -H "x-api-key: creem_test_2TDi7LxCo5acXCp231xJ7k" \
  -v
```

---

## 📋 完整检查清单

### 配置检查
- [x] `.env.local` 文件存在
- [x] `CREEM_API_KEY` 已配置
- [x] `CREEM_API_URL` 已配置
- [x] 所有产品 ID 已配置
- [x] `NEXT_PUBLIC_APP_URL` 已配置
- [ ] API Key 有效性验证
- [ ] 产品 ID 在 Creem 后台存在
- [ ] 产品状态为 Active

### 测试检查
- [ ] 开发服务器已重启
- [ ] 查看启动日志
- [ ] 测试支付流程
- [ ] 观察详细调试日志
- [ ] 记录错误响应内容

---

## 💡 临时解决方案（如果是测试环境问题）

### 尝试使用生产环境

如果测试环境有问题，可以暂时切换到生产环境：

```bash
# .env.local
# 改为生产环境 URL
CREEM_API_URL=https://api.creem.io

# 使用生产环境的 API Key（如果有）
CREEM_API_KEY=creem_sk_xxxxxxxx  # 注意：不是 creem_test_

# 使用生产环境的产品 ID
CREEM_BASIC_MONTHLY_PRODUCT_ID=prod_xxxxxxxx
# ... 其他产品 ID
```

**注意**：生产环境会产生真实费用，建议先在测试环境解决问题。

---

## 🎯 下一步行动

### 立即执行

1. **重启开发服务器**
   ```bash
   pnpm dev
   ```

2. **测试支付流程**
   - 访问 `/pricing`
   - 点击订阅按钮
   - **截图终端日志**

3. **验证 API Key**
   - 运行 PowerShell 测试脚本
   - 或使用 curl 测试

4. **检查 Creem 后台**
   - 确认测试环境已切换
   - 确认产品存在且活跃
   - 确认 API Key 有效

### 报告信息

如果问题持续，请提供：
- [ ] 完整的终端日志（重启后的）
- [ ] API Key 验证结果
- [ ] Creem 后台产品列表截图
- [ ] 错误响应的详细内容

---

## 📞 联系 Creem 支持

如果以上都正常但仍然报错，可能是 Creem 服务问题：

1. **检查 Creem 状态页面**
2. **联系 Creem 技术支持**
3. **提供以下信息**：
   - API Key: `creem_test_2TDi7LxCo5acXCp231xJ7k`
   - 时间戳: `2025-10-27T11:25:09.538Z`
   - 端点: `/checkout/sessions`
   - 错误: HTTP 500

---

## 🔄 更新记录

- **2025-10-27**: 初始排查，配置验证完成
- **待更新**: 测试结果和详细日志

---

**当前状态**: ⏳ 等待测试结果

**下一步**: 重启服务器 → 测试 → 查看日志

