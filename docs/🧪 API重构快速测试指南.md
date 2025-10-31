# 🧪 API 重构快速测试指南

**测试目标**: 验证 API 响应格式统一重构后所有功能正常运行  
**预计时间**: 10-15 分钟

---

## 🚀 快速测试步骤

### 1️⃣ 准备工作（1分钟）

```bash
# 1. 启动开发服务器
npm run dev

# 2. 打开浏览器访问
http://localhost:3000

# 3. 打开开发者工具（F12）查看 Console 和 Network
```

---

### 2️⃣ 测试游客模式（2分钟）

**目标**: 验证 `/api/interpret` API

✅ **测试步骤**:
1. 清除浏览器缓存和 localStorage（可选）
2. 在首页输入梦境：`I dreamed of flying over the ocean`
3. 点击 "Illuminate My Dream" 按钮
4. 等待 5-10 秒

**✅ 预期结果**:
- ✅ 看到加载状态："Lumi is reflecting on your dream..."
- ✅ 显示解析结果卡片
- ✅ Console 显示：`[AIService] AI Interpretation Stats`
- ✅ 右上角显示剩余次数递减

**🔍 Network 检查**:
- 请求：`POST /api/interpret`
- 响应格式：
```json
{
  "success": true,
  "data": {
    "interpretation": "..."
  },
  "metadata": {
    "timestamp": "...",
    "userTier": "anonymous",
    "model": "..."
  }
}
```

---

### 3️⃣ 测试用户登录（2分钟）

**目标**: 验证 `/api/auth/login` API

✅ **测试步骤**:
1. 点击导航栏的 "Sign In" 按钮
2. 选择 Google 或 GitHub 登录
3. 完成 OAuth 登录流程

**✅ 预期结果**:
- ✅ 跳转到 OAuth 提供商页面
- ✅ 登录成功后返回首页
- ✅ 导航栏显示用户头像和邮箱
- ✅ 右上角显示 Free 用户限制（5 today, 10 this month）

**🔍 Network 检查**:
- 请求：`POST /api/auth/login`
- 响应格式：
```json
{
  "success": true,
  "data": {
    "url": "https://accounts.google.com/..."
  },
  "metadata": {
    "provider": "google",
    "redirectPath": "/"
  }
}
```

---

### 4️⃣ 测试订阅查询（1分钟）

**目标**: 验证 `/api/subscription/manage` (GET) 和 `/api/usage` (GET)

✅ **测试步骤**:
1. 登录后刷新页面
2. 查看 Network 面板

**✅ 预期结果**:
- ✅ 自动调用 `/api/subscription/manage`
- ✅ 自动调用 `/api/usage`
- ✅ Console 显示：`[Usage Limit V2] User subscription loaded: free`
- ✅ Console 显示：`[Usage Limit V2] ✅ Synced from database`

**🔍 Network 检查**:

**`GET /api/subscription/manage`**:
```json
{
  "success": true,
  "data": {
    "tier": "free",
    "status": "active"
  },
  "metadata": {
    "source": "default",
    "userId": "..."
  }
}
```

**`GET /api/usage`**:
```json
{
  "success": true,
  "data": {
    "tier": "free",
    "usage": { "daily": 0, "monthly": 0 },
    "limits": { "daily": 5, "monthly": 10 },
    "remaining": { "daily": 5, "monthly": 10 }
  },
  "metadata": {
    "source": "database",
    "userId": "..."
  }
}
```

---

### 5️⃣ 测试定价页面（2分钟）

**目标**: 验证 `/api/checkout/create-session` API

✅ **测试步骤**:
1. 访问 `/pricing` 页面
2. 点击 Basic 或 Pro 套餐的 "Subscribe" 按钮
3. 观察跳转（无需完成支付）

**✅ 预期结果**:
- ✅ 显示加载状态："Processing..."
- ✅ 跳转到 Creem 支付页面（或显示登录对话框）
- ✅ Console 显示：`[Pricing] Creating checkout session for: basic monthly`

**🔍 Network 检查**:
- 请求：`POST /api/checkout/create-session`
- 响应格式：
```json
{
  "success": true,
  "data": {
    "sessionId": "session_xxx",
    "checkoutUrl": "https://checkout.creem.io/..."
  },
  "metadata": {
    "userId": "...",
    "tier": "basic",
    "billingCycle": "monthly",
    "productId": "..."
  }
}
```

---

### 6️⃣ 测试 Dashboard（1分钟）

**目标**: 验证 Dashboard 页面数据加载

✅ **测试步骤**:
1. 登录后访问 `/dashboard`
2. 查看页面内容

**✅ 预期结果**:
- ✅ 显示当前套餐：Free
- ✅ 显示使用统计（模拟数据）
- ✅ 显示套餐详情
- ✅ 显示升级按钮

**🔍 Console 检查**:
- 无错误信息
- 正确加载订阅数据

---

### 7️⃣ 测试登出（1分钟）

**目标**: 验证 `/api/auth/logout` API

✅ **测试步骤**:
1. 点击用户头像
2. 点击 "Sign Out" 按钮
3. 观察页面变化

**✅ 预期结果**:
- ✅ 跳转回首页
- ✅ 导航栏显示 "Sign In" 按钮
- ✅ 右上角显示游客限制（2 today, 4 this month）
- ✅ Console 显示：`[Auth] Cache cleared on sign out`

**🔍 Network 检查**:
- 请求：`POST /api/auth/logout`
- 响应格式：
```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out"
  },
  "metadata": {
    "loggedOutAt": "2025-10-29T..."
  }
}
```

---

### 8️⃣ 测试错误处理（1分钟）

**目标**: 验证 API 错误响应格式

✅ **测试步骤**:
1. 断开网络连接
2. 尝试解析梦境
3. 观察错误提示

**✅ 预期结果**:
- ✅ 显示友好的错误提示："It seems the connection is a bit foggy..."
- ✅ 页面不崩溃
- ✅ 可以重试

---

## 📊 测试结果记录

### ✅ 功能测试清单

| 测试项 | API 路由 | 状态 | 备注 |
|--------|---------|------|------|
| 游客解析梦境 | `POST /api/interpret` | ⬜ | |
| 用户登录 | `POST /api/auth/login` | ⬜ | |
| 查询订阅 | `GET /api/subscription/manage` | ⬜ | |
| 查询使用次数 | `GET /api/usage` | ⬜ | |
| 创建支付会话 | `POST /api/checkout/create-session` | ⬜ | |
| Dashboard 加载 | `GET /api/subscription/manage` | ⬜ | |
| 用户登出 | `POST /api/auth/logout` | ⬜ | |
| 错误处理 | 所有 API | ⬜ | |

**测试符号**:
- ✅ 通过
- ❌ 失败
- ⚠️ 部分通过
- ⬜ 未测试

---

## 🔍 常见问题排查

### 问题 1: API 返回 401 Unauthorized

**可能原因**:
- 用户未登录
- Session 过期

**解决方案**:
1. 检查是否已登录
2. 重新登录
3. 检查 Supabase 配置

---

### 问题 2: 响应格式不对

**检查点**:
1. API 路由是否正确导入了 `successResponse` / `errorResponse`
2. 前端是否使用 `result.data` 而不是直接使用 `data`
3. 检查 TypeScript 类型是否正确

---

### 问题 3: 前端显示错误

**检查点**:
1. 打开 Console 查看错误信息
2. 检查 Network 面板的响应
3. 确认数据路径是否正确（`result.data.xxx`）

---

## 🎯 快速验证命令

```bash
# 1. 检查所有 API 路由是否导入了统一响应工具
grep -r "successResponse\|errorResponse" app/api/

# 2. 检查前端是否使用 result.data
grep -r "result\.data\." hooks/ app/

# 3. 检查是否有 TypeScript 错误
npm run build
```

---

## ✅ 测试完成标准

所有以下条件都满足即为测试通过：

- ✅ 所有 8 个测试项都通过
- ✅ Console 无错误信息
- ✅ Network 响应格式符合预期
- ✅ 用户体验流畅，无卡顿
- ✅ 错误处理友好

---

## 📝 测试报告模板

```markdown
## 测试报告

**测试时间**: 2025-10-29 XX:XX
**测试环境**: localhost:3000
**测试人员**: [你的名字]

### 测试结果
- 游客解析梦境: ✅ 通过
- 用户登录: ✅ 通过
- 查询订阅: ✅ 通过
- 查询使用次数: ✅ 通过
- 创建支付会话: ✅ 通过
- Dashboard 加载: ✅ 通过
- 用户登出: ✅ 通过
- 错误处理: ✅ 通过

### 发现的问题
[如果有问题，在这里记录]

### 总体评价
✅ 所有功能正常，可以部署
```

---

## 🚀 测试通过后的下一步

1. ✅ **提交代码**
   ```bash
   git add .
   git commit -m "✨ Unify API response format across all endpoints"
   ```

2. ✅ **部署到测试环境**
   ```bash
   vercel deploy
   ```

3. ✅ **在测试环境再次验证**

4. ✅ **部署到生产环境**
   ```bash
   vercel deploy --prod
   ```

5. ✅ **监控日志和错误**

---

祝测试顺利！🎉

