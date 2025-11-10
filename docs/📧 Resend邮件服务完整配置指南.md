# 📧 Resend 邮件服务完整配置指南

## 🎯 配置目标

启用完整的邮件功能，支持：
- ✅ 订阅确认邮件
- ✅ 续费提醒邮件（到期前 7 天、3 天、1 天）
- ✅ 续费失败通知邮件

## 📋 配置步骤

### 步骤 1：注册 Resend 账号

#### 1.1 访问官网

```
https://resend.com
```

#### 1.2 注册方式

**选项 A：使用 GitHub（推荐）**
1. 点击 "Sign in with GitHub"
2. 授权访问
3. 自动完成注册

**选项 B：使用邮箱**
1. 填写邮箱地址
2. 设置密码
3. 验证邮箱

#### 1.3 免费额度

```
✅ 100 封邮件/天
✅ 3,000 封邮件/月
✅ 完全免费
✅ 无需信用卡
```

对于测试和小规模应用完全足够！

---

### 步骤 2：获取 API Key

#### 2.1 进入 API Keys 页面

登录后：
1. 点击左侧菜单 **"API Keys"**
2. 或直接访问：https://resend.com/api-keys

#### 2.2 创建新的 API Key

点击 **"Create API Key"** 按钮

填写信息：
```
Name: Lumi Dream App (Development)
或: Lumi Dream App (Production)

Permission: 选择以下之一
- Full Access (完全访问)
- Sending Access (仅发送邮件) ← 推荐
```

#### 2.3 复制并保存 API Key

**重要⚠️**：
- API Key 格式：`re_123abc456def789ghi012jkl345mno678`
- **只显示一次**，关闭后无法再查看
- 立即复制并保存到安全的地方

**建议**：
- 开发环境和生产环境使用不同的 API Key
- 不要将 API Key 提交到 Git

---

### 步骤 3：配置环境变量

#### 3.1 打开配置文件

```powershell
# Windows
notepad .env.local

# Mac/Linux
nano .env.local
# 或
vim .env.local
```

#### 3.2 添加配置（测试环境）

在文件末尾添加：

```bash
# ===================================
# Resend 邮件服务配置
# ===================================
# API Key（从 https://resend.com/api-keys 获取）
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 发件人邮箱（测试环境）
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**测试环境说明**：
- `onboarding@resend.dev` 是 Resend 提供的测试邮箱
- ✅ 无需验证域名
- ✅ 立即可用
- ⚠️ 邮件只能发送到 `delivered@resend.dev` 或你自己的邮箱
- ⚠️ 不能发送给真实用户

#### 3.3 配置示例（完整）

```bash
# .env.local 完整示例

# OpenRouter API Key
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# 应用 URL
NEXT_PUBLIC_APP_URL=https://unpatentable-unrepudiable-marget.ngrok-free.dev

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Creem 支付配置
CREEM_API_KEY=creem_test_xxx
CREEM_WEBHOOK_SECRET=whsec_xxx
CREEM_BASIC_MONTHLY_PRODUCT_ID=prod_xxx
CREEM_BASIC_YEARLY_PRODUCT_ID=prod_xxx
CREEM_PRO_MONTHLY_PRODUCT_ID=prod_xxx
CREEM_PRO_YEARLY_PRODUCT_ID=prod_xxx

# ===================================
# Resend 邮件服务配置（新增）
# ===================================
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
```

#### 3.4 保存文件

- **Notepad**：`Ctrl + S`
- **Nano**：`Ctrl + X`, 然后 `Y`, 然后 `Enter`
- **Vim**：`:wq`

---

### 步骤 4：重启服务器

#### 4.1 停止当前服务器

```bash
# 按 Ctrl + C
```

#### 4.2 清除缓存（可选但推荐）

```powershell
# Windows PowerShell
Remove-Item -Recurse -Force .next

# Mac/Linux
rm -rf .next
```

#### 4.3 重新启动

```bash
pnpm dev
```

#### 4.4 验证启动成功

**✅ 正确配置**（不应该看到警告）：
```bash
✓ Compiled in 2.5s
○ Compiling / ...
✓ Compiled / in 1.2s
```

**❌ 配置失败**（会看到警告）：
```bash
⚠️ [Email Service] RESEND_API_KEY not configured - email sending disabled
```

如果看到警告，检查：
1. API Key 是否正确复制（没有空格或换行）
2. `.env.local` 文件格式是否正确
3. 服务器是否已重启

---

### 步骤 5：测试邮件发送

#### 5.1 运行测试脚本

```bash
npx tsx scripts/test-email.ts
```

#### 5.2 预期输出

**✅ 成功**：
```bash
📧 Testing email configuration...

配置信息:
- API Key: re_123abc4...
- From Email: onboarding@resend.dev

📤 发送测试邮件...

✅ 邮件发送成功!
- Email ID: 0e5f6c87-1234-5678-9abc-def012345678

📬 检查方式:
1. 访问 Resend Dashboard: https://resend.com/emails
2. 查看 'Emails' 标签
3. 应该能看到刚发送的测试邮件

⚠️ 注意:
- 当前使用测试邮箱 (onboarding@resend.dev)
- 邮件只能发送到 'delivered@resend.dev'
- 生产环境需要验证自己的域名
```

**❌ 失败**：
```bash
❌ 错误: RESEND_API_KEY 未配置
请在 .env.local 中添加:
RESEND_API_KEY=re_xxxxx
```

检查环境变量配置。

#### 5.3 在 Resend Dashboard 查看

1. 访问：https://resend.com/emails
2. 应该能看到刚发送的测试邮件
3. 状态应该是 **"Delivered"**

---

### 步骤 6：验证 Webhook 邮件功能

#### 6.1 触发 Webhook

**方法 A：完成一次支付**
1. 访问 `/pricing`
2. 点击订阅（使用测试模式）
3. 完成支付

**方法 B：手动重发 Webhook**
1. 访问 Creem Dashboard
2. 找到 Webhooks 页面
3. 找到之前失败的事件
4. 点击 "Resend"

#### 6.2 观察日志

**✅ 成功**（应该看到）：
```bash
🔔 [Webhook] Received request
✅ [Webhook] Signature verified successfully
💳 [Webhook] Checkout completed: ch_xxxxx
✅ [Webhook] Subscription activated successfully!
📧 [Email] Sending renewal reminder...  ← 新增
✅ [Email] Email sent successfully. ID: xxx  ← 新增
POST /api/webhooks/creem 200 in 1200ms
```

**⚠️ 邮件服务未启用**（之前的状态）：
```bash
⚠️ [Email] Email service not enabled - skipping renewal reminder
```

如果仍然看到这个警告，说明配置未生效，重新检查步骤 3-4。

---

## 🏭 生产环境配置（可选）

### 为什么需要验证域名？

测试邮箱 `onboarding@resend.dev` 的限制：
- ❌ 不能发送给真实用户
- ❌ 只能用于测试
- ❌ 邮件可能被标记为垃圾邮件

验证自己的域名后：
- ✅ 可以发送给任何用户
- ✅ 更好的送达率
- ✅ 显示你的品牌名称

### 步骤 1：添加域名

1. **Resend Dashboard** → **Domains**
2. 点击 **"Add Domain"**
3. 输入域名：`lumidreams.app`
4. 点击 **"Add"**

### 步骤 2：配置 DNS 记录

Resend 会提供需要添加的 DNS 记录：

```
类型    名称                     值
------  --------------------    ---------------------------
TXT     @                       v=DKIM1; k=rsa; p=MIGfMA0...
TXT     resend._domainkey       v=DKIM1; k=rsa; p=MIIBIj...
MX      @                       feedback-smtp.resend.com
```

到你的域名注册商（如 Cloudflare、GoDaddy）添加这些记录。

### 步骤 3：验证域名

1. 添加 DNS 记录后，等待 5-10 分钟
2. 在 Resend Dashboard 点击 **"Verify"**
3. 验证成功后，状态变为 **"Verified"** ✅

### 步骤 4：更新配置

```bash
# .env.production
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@lumidreams.app  ← 使用自己的域名
```

---

## 🧪 测试不同的邮件类型

### 1. 订阅确认邮件

当前系统配置为在订阅激活时**不**自动发送确认邮件（通过 webhook）。

如果需要启用，修改 `app/api/webhooks/creem/route.ts`。

### 2. 续费提醒邮件

**触发时机**：
- 订阅到期前 7 天
- 订阅到期前 3 天
- 订阅到期前 1 天

**运行定时任务**：
```bash
# 测试续费提醒功能
npx tsx scripts/test-renewal-reminders.ts
```

### 3. 续费失败通知

**触发时机**：
- 自动续费失败时
- 订阅过期时

**测试方法**：
模拟订阅过期，webhook 会触发邮件发送。

---

## 🔧 故障排查

### 问题 1：API Key 无效

**错误**：
```
Error: Invalid API key
```

**解决**：
1. 检查 API Key 是否完整复制
2. 确认没有多余的空格或换行
3. 在 Resend Dashboard 重新生成 API Key

### 问题 2：环境变量未生效

**症状**：
```
⚠️ [Email Service] RESEND_API_KEY not configured
```

**解决**：
1. 确认 `.env.local` 文件在项目根目录
2. 检查文件名（不是 `.env.txt` 或其他）
3. 重启服务器（`Ctrl+C` 然后 `pnpm dev`）
4. 删除 `.next` 缓存

### 问题 3：邮件发送失败

**错误**：
```
Error: Missing required provider
```

**解决**：
1. 确认 `RESEND_FROM_EMAIL` 已配置
2. 测试环境使用 `onboarding@resend.dev`
3. 生产环境使用已验证的域名

### 问题 4：邮件未收到

**检查**：
1. Resend Dashboard 中邮件状态
2. 垃圾邮件文件夹
3. 邮箱地址是否正确
4. 测试邮箱限制（只能发送到特定地址）

---

## 📊 监控邮件发送

### Resend Dashboard

访问：https://resend.com/emails

**查看内容**：
- 📤 已发送的邮件列表
- ✅ 发送状态（Sent, Delivered, Bounced）
- 📈 发送统计
- 🔍 邮件内容预览

### 日志监控

服务器终端会显示：
```bash
[Email] Sending renewal reminder to user@example.com...
[Email] Email sent successfully. ID: 0e5f6c87-1234-5678-9abc
```

---

## 💰 费用说明

### 免费额度

```
100 封/天
3,000 封/月
完全免费
```

**够用吗？**
- 10 个用户 × 3 封邮件/月 = 30 封
- 100 个用户 × 3 封邮件/月 = 300 封
- 1,000 个用户 × 3 封邮件/月 = 3,000 封 ← 刚好

对于初期完全够用！

### 付费计划

如果超过免费额度：
```
$20/月 - 50,000 封邮件
$80/月 - 100,000 封邮件
```

---

## ✅ 配置完成检查清单

完成配置后，确认以下所有项：

### 基础配置
- [ ] 已注册 Resend 账号
- [ ] 已创建 API Key
- [ ] 已添加到 `.env.local`
- [ ] 已配置 `RESEND_FROM_EMAIL`
- [ ] 已重启服务器

### 功能验证
- [ ] 测试脚本运行成功
- [ ] Resend Dashboard 能看到测试邮件
- [ ] Webhook 处理时不再报错
- [ ] 订阅激活成功

### 可选配置（生产环境）
- [ ] 已添加自定义域名
- [ ] 已配置 DNS 记录
- [ ] 域名验证成功
- [ ] 已更新生产环境配置

---

## 📚 相关资源

- **Resend 官网**：https://resend.com
- **Resend 文档**：https://resend.com/docs
- **API 参考**：https://resend.com/docs/api-reference
- **Dashboard**：https://resend.com/home
- **邮件列表**：https://resend.com/emails

---

## 🎉 总结

完成配置后，你的应用将具备：
- ✅ 完整的邮件发送功能
- ✅ 自动续费提醒
- ✅ 订阅状态通知
- ✅ 专业的用户体验

**下一步**：
1. 完成基础配置和测试
2. 测试真实的订阅流程
3. （可选）配置自定义域名
4. 部署到生产环境

祝配置顺利！🚀

---

**文档创建时间**：2025-11-05  
**适用版本**：Lumi Dream App v2.x  
**状态**：✅ 完整配置指南

