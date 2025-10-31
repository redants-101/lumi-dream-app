# 🚀 Creem 支付集成快速开始

> 5 分钟快速配置 Creem 支付系统

---

## ✅ 前置条件

- [x] 已注册 Supabase 账户
- [x] 已创建 Supabase 项目
- [x] 已配置用户认证（GitHub/Google OAuth）
- [ ] Creem 账户（将在步骤 1 创建）

---

## 📋 快速配置步骤

### 步骤 1: 创建 Creem 账户（2 分钟）

1. 访问 [creem.io](https://creem.io)
2. 点击 "Sign Up" 注册账户
3. 验证邮箱
4. 完成账户设置

---

### 步骤 2: 创建产品（3 分钟）

在 Creem 后台创建 4 个产品：

#### 产品 1: Lumi Basic Monthly
```
名称: Lumi Basic Monthly
价格: $4.99
计费周期: Monthly
描述: 50 次/月 Claude Haiku 梦境解析
```

#### 产品 2: Lumi Basic Yearly
```
名称: Lumi Basic Yearly
价格: $49.00
计费周期: Yearly
描述: 50 次/月 Claude Haiku 梦境解析（年付省 18%）
```

#### 产品 3: Lumi Pro Monthly
```
名称: Lumi Pro Monthly
价格: $9.99
计费周期: Monthly
描述: 200 次/月 Claude Sonnet 深度解析
```

#### 产品 4: Lumi Pro Yearly
```
名称: Lumi Pro Yearly
价格: $99.00
计费周期: Yearly
描述: 200 次/月 Claude Sonnet 深度解析（年付省 17%）
```

**创建后记录产品 ID**（格式: `prod_xxxxxxxxxx`）

---

### 步骤 3: 获取 API 密钥（1 分钟）

1. 进入 Creem 后台 → Settings → API Keys
2. 点击 "Create API Key"
3. 复制 **API Key** 和 **Webhook Secret**

---

### 步骤 4: 配置环境变量（2 分钟）

创建/编辑 `.env.local` 文件：

```bash
# ===================================
# Creem 支付配置
# ===================================

# API 密钥（从步骤 3 获取）
CREEM_API_KEY=creem_sk_xxxxxxxxxxxxxxxx
CREEM_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx

# 产品 ID（从步骤 2 获取）
CREEM_BASIC_MONTHLY_PRODUCT_ID=prod_xxxxxxxx
CREEM_BASIC_YEARLY_PRODUCT_ID=prod_xxxxxxxx
CREEM_PRO_MONTHLY_PRODUCT_ID=prod_xxxxxxxx
CREEM_PRO_YEARLY_PRODUCT_ID=prod_xxxxxxxx

# 应用 URL（本地开发）
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===================================
# Supabase 配置（如果还没配置）
# ===================================
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

### 步骤 5: 运行数据库迁移（1 分钟）

1. 打开 Supabase 控制台
2. 进入 SQL Editor
3. 复制 `docs/Creem数据库Schema.sql` 的内容
4. 粘贴并执行

**或者使用命令行**:

```bash
# 如果使用 Supabase CLI
supabase db reset
```

---

### 步骤 6: 启动开发服务器（1 分钟）

```bash
pnpm install  # 如果还没安装依赖
pnpm dev
```

访问 http://localhost:3000/pricing 查看定价页面

---

### 步骤 7: 配置 Webhook（使用 Ngrok）（3 分钟）

#### 7.1 安装 Ngrok

```bash
# macOS
brew install ngrok

# Windows
# 从 https://ngrok.com/download 下载
```

#### 7.2 启动 Ngrok

```bash
ngrok http 3000
```

复制 Ngrok 提供的 HTTPS URL（例如: `https://abc123.ngrok.io`）

#### 7.3 配置 Creem Webhook

1. 进入 Creem 后台 → Settings → Webhooks
2. 点击 "Add Webhook"
3. **URL**: `https://abc123.ngrok.io/api/webhooks/creem`
4. 选择事件:
   - ✅ `checkout.session.completed`
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.canceled`
   - ✅ `subscription.expired`
5. 保存

---

### 步骤 8: 测试支付流程（5 分钟）

#### 8.1 访问定价页面

http://localhost:3000/pricing

#### 8.2 点击"订阅"按钮

选择 Basic 或 Pro 版本，点击订阅

#### 8.3 使用测试卡号

```
卡号: 4242 4242 4242 4242
过期日期: 12/25（任意未来日期）
CVV: 123（任意 3 位数字）
邮编: 12345（任意）
```

#### 8.4 完成支付

支付成功后，应重定向到 `/pricing/success`

#### 8.5 验证订阅激活

1. 查看 Creem 后台 → Payments，确认支付成功
2. 查看 Ngrok 终端，确认收到 webhook
3. 访问 http://localhost:3000/dashboard，查看订阅状态

---

## 🎉 完成！

现在你已经成功集成了 Creem 支付系统！

---

## 🔍 验证清单

- [ ] 定价页面正常显示（http://localhost:3000/pricing）
- [ ] 点击订阅按钮可以跳转到 Creem 支付页面
- [ ] 使用测试卡号可以完成支付
- [ ] 支付成功后重定向到成功页面
- [ ] Webhook 正常接收（Ngrok 终端有日志）
- [ ] Supabase `user_subscriptions` 表有新记录
- [ ] Dashboard 页面显示订阅信息

---

## ⚠️ 常见问题

### Q1: Webhook 未收到？

**检查**:
- Ngrok 是否正在运行
- Creem webhook URL 是否正确（包含 `/api/webhooks/creem`）
- 在 Creem 后台查看 Webhook 日志

### Q2: 支付成功但订阅未激活？

**检查**:
- 终端是否有错误日志
- Supabase `user_subscriptions` 表是否有记录
- Webhook 签名验证是否通过

### Q3: 环境变量未生效？

**解决**:
```bash
# 重启开发服务器
# Ctrl+C 停止，然后重新运行
pnpm dev
```

---

## 📚 下一步

完成测试后，您可以：

1. 部署到生产环境 → [Vercel部署指南.md](./Vercel部署指南.md)
2. 配置生产 Webhook → 使用真实域名
3. 关闭测试模式 → 在 Creem 后台切换到生产模式
4. 实现使用限制 → [使用次数限制功能.md](./使用次数限制功能.md)
5. 添加邮件通知 → 订阅确认/到期提醒

---

## 📖 相关文档

| 文档 | 描述 |
|------|------|
| [Creem支付集成指南.md](./Creem支付集成指南.md) | 完整集成指南 |
| [Creem数据库Schema.sql](./Creem数据库Schema.sql) | 数据库 Schema |
| [定价策略V2免费版使用Haiku.md](./定价策略V2免费版使用Haiku.md) | 定价策略 |

---

## 🆘 需要帮助？

- Creem 文档: https://docs.creem.io/
- Creem 社区: https://discord.gg/creem
- 项目 Issues: [GitHub Issues](https://github.com/yourusername/lumi-dream-app/issues)

---

**配置时间**: 约 15-20 分钟  
**难度**: ⭐⭐ 简单  
**最后更新**: 2025-10-21

