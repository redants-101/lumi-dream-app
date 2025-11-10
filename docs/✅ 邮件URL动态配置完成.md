# ✅ 邮件 URL 动态配置完成

## 📋 任务概述

**目标**：将邮件中硬编码的 URL 改为根据环境变量 `NEXT_PUBLIC_APP_URL` 动态配置  
**优先级**：中（影响开发和生产环境的灵活性）  
**完成时间**：2025-11-10  
**状态**：✅ 已完成

---

## 🎯 问题描述

### 修改前的问题 ❌

邮件中的所有链接都硬编码为生产环境 URL：

```typescript
// ❌ 硬编码 URL
<Button href="https://www.lumidreams.app/dashboard">
  View Dashboard
</Button>

// ❌ 纯文本中也是硬编码
Visit your dashboard: https://www.lumidreams.app/dashboard
```

**影响**：

1. **开发环境问题**：
   - 本地测试时，邮件链接指向生产环境
   - 无法测试完整的用户流程
   - 开发体验差

2. **灵活性问题**：
   - 无法适配不同环境（dev/staging/production）
   - 更换域名需要修改多处代码
   - 维护成本高

3. **测试问题**：
   - 测试邮件链接时跳转到错误的环境
   - ngrok 等工具无法正常使用

---

## ✅ 解决方案

### 核心思路

使用环境变量 `NEXT_PUBLIC_APP_URL` 动态配置所有邮件中的 URL。

### 环境变量配置

```bash
# .env.local（开发环境）
NEXT_PUBLIC_APP_URL=http://localhost:3000

# .env.local（使用 ngrok）
NEXT_PUBLIC_APP_URL=https://xxx.ngrok-free.app

# .env.production（生产环境）
NEXT_PUBLIC_APP_URL=https://www.lumidreams.app
```

---

## 📝 修改内容

### 修改文件清单

1. ✅ `lib/services/email-service.ts` - 邮件发送服务
2. ✅ `components/emails/renewal-reminder.tsx` - 续费提醒邮件模板
3. ✅ `components/emails/renewal-failed.tsx` - 续费失败邮件模板

---

### 详细修改

#### 1. 邮件服务 (`lib/services/email-service.ts`)

**添加 APP_URL 常量**：

```typescript
// ✅ 应用 URL 配置（根据环境变量动态设置）
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.lumidreams.app"
```

**修改纯文本邮件内容**（3 处）：

```typescript
// ❌ 修改前
Visit your dashboard: https://www.lumidreams.app/dashboard

// ✅ 修改后
Visit your dashboard: ${APP_URL}/dashboard
```

**修改位置**：
- 续费提醒邮件纯文本（第 119 行）
- 续费失败邮件纯文本（第 219 行）
- 订阅确认邮件纯文本（第 268 行）

**传递 appUrl 给 React 组件**：

```typescript
// ✅ 续费提醒邮件
react: RenewalReminderEmail({
  ...params,
  appUrl: APP_URL,  // 传递动态 URL
})

// ✅ 续费失败邮件
react: RenewalFailedEmail({
  ...params,
  appUrl: APP_URL,  // 传递动态 URL
})
```

---

#### 2. 续费提醒模板 (`components/emails/renewal-reminder.tsx`)

**添加 appUrl 参数**：

```typescript
interface RenewalReminderEmailProps {
  userName: string
  tier: "basic" | "pro"
  billingCycle: "monthly" | "yearly"
  expirationDate: Date
  daysUntilExpiration: number
  appUrl?: string  // ✅ 新增可选参数
}

export const RenewalReminderEmail = ({
  userName = "Friend",
  tier = "basic",
  billingCycle = "monthly",
  expirationDate = new Date(),
  daysUntilExpiration = 7,
  appUrl = "https://www.lumidreams.app",  // ✅ 默认值（兜底）
}: RenewalReminderEmailProps) => {
```

**修改按钮链接**（2 处）：

```typescript
// ❌ 修改前
<Button href="https://www.lumidreams.app/dashboard">
  View Dashboard
</Button>

// ✅ 修改后
<Button href={`${appUrl}/dashboard`}>
  View Dashboard
</Button>
```

**修改页脚链接**（3 处）：

```typescript
// ❌ 修改前
<a href="https://www.lumidreams.app/privacy" style={link}>Privacy Policy</a>

// ✅ 修改后
<a href={`${appUrl}/privacy`} style={link}>Privacy Policy</a>
```

---

#### 3. 续费失败模板 (`components/emails/renewal-failed.tsx`)

**添加 appUrl 参数**：

```typescript
interface RenewalFailedEmailProps {
  userName: string
  tier: "basic" | "pro"
  billingCycle: "monthly" | "yearly"
  failureDate: Date
  failureReason?: string
  appUrl?: string  // ✅ 新增可选参数
}

export const RenewalFailedEmail = ({
  userName = "Friend",
  tier = "basic",
  billingCycle = "monthly",
  failureDate = new Date(),
  failureReason = "Payment declined",
  appUrl = "https://www.lumidreams.app",  // ✅ 默认值（兜底）
}: RenewalFailedEmailProps) => {
```

**修改按钮链接**（1 处）：

```typescript
// ❌ 修改前
<Button href="https://www.lumidreams.app/dashboard">
  Update Payment Method
</Button>

// ✅ 修改后
<Button href={`${appUrl}/dashboard`}>
  Update Payment Method
</Button>
```

**修改页脚链接**（3 处）：

```typescript
// 同续费提醒模板
<a href={`${appUrl}/privacy`} style={link}>Privacy Policy</a>
<a href={`${appUrl}/terms`} style={link}>Terms of Service</a>
<a href={`${appUrl}/contact`} style={link}>Contact Us</a>
```

---

#### 4. Linter 错误修复

**修复订阅确认邮件函数**：

```typescript
// ❌ 修改前（可能导致 null 错误）
if (!process.env.RESEND_API_KEY) {
  console.error("[Email] RESEND_API_KEY not configured")
  return false
}

// ✅ 修改后（统一的检查方式）
if (!EMAIL_ENABLED || !resend) {
  console.warn("[Email] Email service not enabled - skipping confirmation email")
  return false
}
```

---

## 📊 影响范围统计

### 文件修改

| 文件 | 修改行数 | 修改类型 |
|------|----------|----------|
| `lib/services/email-service.ts` | 7 处 | URL 替换 + 参数传递 |
| `components/emails/renewal-reminder.tsx` | 5 处 | Props + URL 替换 |
| `components/emails/renewal-failed.tsx` | 5 处 | Props + URL 替换 |

### URL 替换统计

| 邮件类型 | React 组件 | 纯文本 | 页脚链接 | 合计 |
|---------|-----------|--------|---------|-----|
| 续费提醒 | 2 | 1 | 3 | 6 |
| 续费失败 | 1 | 1 | 3 | 5 |
| 订阅确认 | 0 | 1 | 0 | 1 |
| **总计** | **3** | **3** | **6** | **12** |

---

## 🎨 功能验证

### 不同环境下的邮件链接

#### 开发环境（localhost）

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**邮件中的链接**：
- Dashboard: `http://localhost:3000/dashboard`
- Privacy: `http://localhost:3000/privacy`
- Terms: `http://localhost:3000/terms`

✅ **效果**：点击邮件链接直接跳转到本地开发环境

---

#### 开发环境（ngrok）

```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app
```

**邮件中的链接**：
- Dashboard: `https://abc123.ngrok-free.app/dashboard`
- Privacy: `https://abc123.ngrok-free.app/privacy`
- Terms: `https://abc123.ngrok-free.app/terms`

✅ **效果**：可以在真实设备上测试完整流程

---

#### 生产环境

```bash
# .env.production（或 Vercel 环境变量）
NEXT_PUBLIC_APP_URL=https://www.lumidreams.app
```

**邮件中的链接**：
- Dashboard: `https://www.lumidreams.app/dashboard`
- Privacy: `https://www.lumidreams.app/privacy`
- Terms: `https://www.lumidreams.app/terms`

✅ **效果**：正常的生产环境链接

---

## 🔧 兼容性说明

### 向后兼容

即使未设置 `NEXT_PUBLIC_APP_URL`，也会使用默认值：

```typescript
// ✅ 默认值保证兼容性
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.lumidreams.app"

// React 组件中也有默认值
appUrl = "https://www.lumidreams.app"
```

**结果**：
- ✅ 不会导致链接失效
- ✅ 现有部署不受影响
- ✅ 生产环境自动使用正确域名

---

## 🧪 测试指南

### 本地测试

1. **修改环境变量**：

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. **重启服务器**：

```bash
pnpm dev
```

3. **触发邮件发送**：
   - 完成购买流程
   - 或运行测试脚本

4. **检查邮件**：
   - 在 Resend Dashboard 查看邮件
   - 检查链接地址是否为 `http://localhost:3000/...`

---

### Ngrok 测试

1. **启动 ngrok**：

```bash
ngrok http 3000
```

2. **更新环境变量**：

```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app
```

3. **重启服务器并测试**

---

## 📋 部署检查清单

### Vercel 部署

- [ ] 在 Vercel 项目设置中添加环境变量：
  ```
  NEXT_PUBLIC_APP_URL=https://www.lumidreams.app
  ```
- [ ] 重新部署项目
- [ ] 测试邮件功能
- [ ] 检查邮件中的链接

### 自托管部署

- [ ] 在 `.env.production` 中设置：
  ```bash
  NEXT_PUBLIC_APP_URL=https://your-domain.com
  ```
- [ ] 构建项目：`pnpm build`
- [ ] 启动项目：`pnpm start`
- [ ] 测试邮件功能

---

## 🎉 优势总结

### 开发体验改善

- ✅ **本地测试更方便**：邮件链接指向本地环境
- ✅ **使用 ngrok 测试**：可在真实设备测试
- ✅ **多环境支持**：dev/staging/production 自动适配

### 维护性提升

- ✅ **配置集中化**：只需修改一个环境变量
- ✅ **域名切换简单**：无需修改代码
- ✅ **减少硬编码**：提高代码质量

### 灵活性增强

- ✅ **支持自定义域名**：适配不同部署场景
- ✅ **向后兼容**：现有部署不受影响
- ✅ **默认值兜底**：即使未配置也能正常工作

---

## 🔍 代码审查要点

### 修改质量

- ✅ **统一性**：所有邮件模板使用相同方式
- ✅ **类型安全**：TypeScript 类型完整
- ✅ **向后兼容**：默认值保证兼容性
- ✅ **可维护性**：配置集中，易于修改

### Linter 检查

- ✅ 无 TypeScript 错误
- ✅ 无 ESLint 错误
- ✅ null 检查完善

---

## 📚 相关文档

- [📧 Resend 邮件服务完整配置指南](./📧%20Resend邮件服务完整配置指南.md)
- [✅ 购买确认邮件功能完成](./✅%20购买确认邮件功能完成.md)
- [🧪 购买确认邮件测试指南](./🧪%20购买确认邮件测试指南.md)

---

## 💡 后续优化建议

### 短期（可选）

1. **支持邮件** URL：
   ```typescript
   const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@lumidreams.app"
   ```

2. **品牌名称配置**：
   ```typescript
   const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Lumi Dream Interpreter"
   ```

### 中期（可选）

1. **多语言支持**：
   - 根据用户语言选择不同域名
   - 邮件内容本地化

2. **A/B 测试**：
   - 测试不同的邮件文案
   - 追踪链接点击率

---

## 🎯 总结

### 问题
- ❌ 邮件中 URL 硬编码为生产环境
- ❌ 本地开发测试不便
- ❌ 维护成本高

### 解决方案
- ✅ 使用环境变量动态配置
- ✅ 支持多环境（dev/staging/prod）
- ✅ 保持向后兼容

### 效果
- ✅ 开发体验提升
- ✅ 维护成本降低
- ✅ 灵活性增强

### 影响
- ✅ 12 处 URL 替换
- ✅ 3 个文件修改
- ✅ 完全向后兼容

---

**文档创建时间**：2025-11-10  
**修改人员**：AI Assistant  
**审核状态**：✅ 已完成  
**优先级**：中  
**状态**：✅ 已完成并验证

