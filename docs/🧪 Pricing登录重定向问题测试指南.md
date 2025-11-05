# 🧪 Pricing 登录重定向问题测试指南

## 📋 准备工作

### 1. 启动开发服务器（Debug 模式）

```bash
pnpm dev:debug
```

### 2. 打开浏览器开发者工具

- **Chrome**: 按 `F12` 或 `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- 切换到 **Console** 标签
- 勾选 **Preserve log**（保留日志，避免页面跳转时日志被清除）

## 🧪 测试场景

### 场景 1：导航栏 Sign In 按钮（UserButton）

**步骤**：
1. **清除浏览器缓存和 Cookies**（确保未登录状态）
2. 访问：`http://localhost:3000/pricing`
3. 点击右上角 **"Sign In"** 按钮
4. 在弹出的对话框中选择 **GitHub** 或 **Google**
5. 完成授权登录

**预期日志输出**：
```
=== [UserButton SignIn] ===
Current Path: /pricing
===========================

=== [OAuth Login] ===
Provider: github
Redirect Path: /pricing
Origin: http://localhost:3000
Callback URL: http://localhost:3000/api/auth/callback?next=%2Fpricing
====================

=== [OAuth Callback] ===
Full URL: http://localhost:3000/api/auth/callback?code=xxx&next=%2Fpricing
Code exists: true
Next param: /pricing
All params: { code: "xxx", next: "/pricing" }
========================
```

**预期结果**：
- ✅ 登录成功后**跳转回 `/pricing` 页面**
- ✅ 显示已登录状态（右上角显示用户头像）

**实际结果**：
- [ ] 跳转到了：__________
- [ ] 控制台日志：__________

---

### 场景 2：Pricing 页面订阅按钮

**步骤**：
1. **清除浏览器缓存和 Cookies**（确保未登录状态）
2. 访问：`http://localhost:3000/pricing`
3. 点击任意套餐的 **"Subscribe"** 按钮（如 Basic 或 Pro）
4. 在弹出的对话框中选择 **GitHub** 或 **Google**
5. 完成授权登录

**预期日志输出**：
```
=== [Pricing SignIn] ===
Redirect Path: /pricing
Pending Subscription: { tier: "basic", cycle: "monthly" }
========================

=== [OAuth Login] ===
Provider: github
Redirect Path: /pricing
Origin: http://localhost:3000
Callback URL: http://localhost:3000/api/auth/callback?next=%2Fpricing
====================

=== [OAuth Callback] ===
Full URL: http://localhost:3000/api/auth/callback?code=xxx&next=%2Fpricing
Code exists: true
Next param: /pricing
All params: { code: "xxx", next: "/pricing" }
========================
```

**预期结果**：
- ✅ 登录成功后**跳转回 `/pricing` 页面**
- ✅ 自动继续订阅流程（跳转到支付页面）

**实际结果**：
- [ ] 跳转到了：__________
- [ ] 控制台日志：__________

---

### 场景 3：导航栏 Dashboard 链接拦截

**步骤**：
1. **清除浏览器缓存和 Cookies**（确保未登录状态）
2. 访问：`http://localhost:3000/pricing`
3. 点击导航栏的 **"Dashboard"** 链接
4. 在弹出的对话框中选择 **GitHub** 或 **Google**
5. 完成授权登录

**预期日志输出**：
```
=== [Navigation SignIn] ===
Redirect Path: /dashboard (hardcoded)
===========================

=== [OAuth Login] ===
Provider: github
Redirect Path: /dashboard
Origin: http://localhost:3000
Callback URL: http://localhost:3000/api/auth/callback?next=%2Fdashboard
====================

=== [OAuth Callback] ===
Full URL: http://localhost:3000/api/auth/callback?code=xxx&next=%2Fdashboard
Code exists: true
Next param: /dashboard
All params: { code: "xxx", next: "/dashboard" }
========================
```

**预期结果**：
- ✅ 登录成功后**跳转到 `/dashboard` 页面**（这是设计意图）
- ✅ 显示 Dashboard 内容

**实际结果**：
- [ ] 跳转到了：__________
- [ ] 控制台日志：__________

---

## 🔍 问题诊断

### 如果跳转到了首页 `/` 而不是 `/pricing`

**可能原因**：

#### 1. Next 参数丢失
**症状**：回调日志显示 `Next param: /`

**检查**：
```
=== [OAuth Callback] ===
Next param: /  ❌ 应该是 /pricing
```

**可能原因**：
- Supabase Redirect URLs 配置不正确
- OAuth 提供商不保留自定义 query 参数
- URL 编码/解码问题

**解决方案**：
1. 检查 Supabase Dashboard → Authentication → URL Configuration
2. 确保 Redirect URLs 包含：
   ```
   http://localhost:3000/api/auth/callback
   http://localhost:3000/api/auth/callback?next=*
   ```

#### 2. RedirectPath 未传递
**症状**：登录日志显示 `Redirect Path: (default: /)`

**检查**：
```
=== [OAuth Login] ===
Redirect Path: (default: /)  ❌ 应该是 /pricing
```

**可能原因**：
- 前端调用时没有传递 redirectPath 参数
- UserButton 的 currentPath 为 undefined

**解决方案**：
1. 检查是否从正确的登录入口触发
2. 确认 UserButton 正确接收到 pathname

#### 3. 触发了错误的登录对话框
**症状**：显示了 Navigation 的日志而不是 UserButton 或 Pricing 的日志

**检查**：
```
=== [Navigation SignIn] ===  ❌ 在 Pricing 页面不应该出现
```

**可能原因**：
- 误点击了 Dashboard 链接
- 有多个登录对话框同时打开

**解决方案**：
1. 确认点击的是正确的按钮
2. 检查是否有对话框状态冲突

---

## 📊 日志收集模板

请将测试结果填写在下面：

### 场景 1：UserButton 登录

**操作步骤**：
- [ ] 在 `/pricing` 页面
- [ ] 点击 "Sign In" 按钮
- [ ] 选择 GitHub/Google

**控制台日志**：
```
（粘贴完整的控制台输出）
```

**最终跳转页面**：
```
（例如：http://localhost:3000/ 或 http://localhost:3000/pricing）
```

---

### 场景 2：Pricing 订阅登录

**操作步骤**：
- [ ] 在 `/pricing` 页面
- [ ] 点击订阅按钮
- [ ] 选择 GitHub/Google

**控制台日志**：
```
（粘贴完整的控制台输出）
```

**最终跳转页面**：
```
（例如：http://localhost:3000/ 或 http://localhost:3000/pricing）
```

---

### 场景 3：Dashboard 拦截登录

**操作步骤**：
- [ ] 在 `/pricing` 页面
- [ ] 点击 Dashboard 链接
- [ ] 选择 GitHub/Google

**控制台日志**：
```
（粘贴完整的控制台输出）
```

**最终跳转页面**：
```
（例如：http://localhost:3000/dashboard）
```

---

## 🔧 额外检查

### Network 标签检查

1. 打开 DevTools → **Network** 标签
2. 勾选 **Preserve log**
3. 执行登录操作
4. 查找以下请求：

#### `/api/auth/login` 请求

**Request Payload** 应该包含：
```json
{
  "provider": "github",
  "redirectPath": "/pricing"  // ✅ 应该有这个字段
}
```

**如果 redirectPath 缺失或为空**：
- 问题在前端调用层
- 检查 UserButton/Pricing 的 handleSignIn 实现

#### OAuth 回调请求

**Request URL** 应该类似：
```
http://localhost:3000/api/auth/callback?code=xxx&next=%2Fpricing
                                                    ↑
                                                    ✅ next 参数应该存在
```

**如果 next 参数缺失**：
- 问题在 OAuth 提供商或 Supabase 层
- 检查 Supabase Redirect URLs 配置

---

## 💡 快速修复建议

### 临时解决方案：强制重定向

如果问题持续存在，可以在 callback 中添加强制逻辑：

```typescript
// app/api/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  
  // 从 Referer header 中获取来源页面
  const referer = request.headers.get("referer")
  let next = searchParams.get("next") ?? "/"
  
  // 如果 next 参数丢失，尝试从 referer 恢复
  if (next === "/" && referer && referer.includes("/pricing")) {
    console.warn("[Callback] Next param missing, using referer fallback")
    next = "/pricing"
  }
  
  // ... 其他代码
}
```

---

## 📝 测试完成后

请将收集的日志和结果反馈，包括：

1. **完整的控制台日志**（从点击登录到最终跳转）
2. **Network 标签中的请求详情**（/api/auth/login 和回调请求）
3. **最终跳转的 URL**
4. **使用的登录方式**（GitHub/Google）
5. **浏览器信息**（Chrome/Firefox/Safari 版本）

这些信息将帮助精确定位问题所在！

---

**创建时间**：2025-11-05  
**状态**：📋 待用户测试

