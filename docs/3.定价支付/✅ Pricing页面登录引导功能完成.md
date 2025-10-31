# ✅ Pricing 页面登录引导功能完成

## 🎯 功能需求

在 `/pricing` 页面，当用户点击任何套餐按钮时：
1. **如果未登录**：先弹出登录对话框引导用户登录
2. **登录成功后**：
   - **Free 套餐**：跳转到 home 页面（`/`）
   - **Basic/Pro 套餐**：跳转到 Creem 支付页面

## ✅ 实现内容

### 1. 新增登录对话框

在 pricing 页面添加了与 navigation 组件一致的登录对话框：

```typescript
// 登录对话框状态
const [showLoginDialog, setShowLoginDialog] = useState(false)

// 保存用户选择的套餐信息（登录后继续）
const [pendingSubscription, setPendingSubscription] = useState<{
  tier: string
  cycle: "monthly" | "yearly"
} | null>(null)
```

**登录对话框 UI**:
- Google 登录按钮
- GitHub 登录按钮
- 根据不同套餐显示不同的提示信息

### 2. 修改订阅流程

#### 统一的登录检查

```typescript
const handleSubscribe = async (tier: string, cycle: "monthly" | "yearly") => {
  // ✅ 统一检查：如果用户未登录，显示登录对话框
  if (!user) {
    console.log("[Pricing] User not logged in, showing login dialog")
    setPendingSubscription({ tier, cycle })  // 保存用户选择
    setShowLoginDialog(true)  // 显示登录对话框
    return
  }

  // 用户已登录，继续原有流程...
}
```

#### 根据套餐类型执行不同操作

```typescript
// Free 套餐：跳转到首页
if (tier === "free") {
  router.push("/")
  toast.success("You're using the free tier. Start interpreting your dreams!")
  return
}

// Basic 和 Pro 套餐：创建支付会话
setLoadingPlan(`${tier}-${cycle}`)
// ... 调用支付 API ...
```

### 3. 登录后自动继续流程

使用 `useEffect` 监听用户登录状态：

```typescript
// ✅ 监听用户登录状态变化，登录后自动继续订阅流程
useEffect(() => {
  if (user && pendingSubscription) {
    console.log("[Pricing] User logged in, continuing subscription:", pendingSubscription)
    // 用户登录成功，继续之前的订阅流程
    handleSubscribe(pendingSubscription.tier, pendingSubscription.cycle)
    setPendingSubscription(null)
  }
}, [user, pendingSubscription])
```

**流程说明**:
1. 用户点击按钮 → 未登录 → 显示登录对话框
2. 用户选择 Google/GitHub 登录
3. 登录成功后返回 `/pricing` 页面
4. `useEffect` 检测到用户已登录 + 有待处理的订阅
5. 自动执行 `handleSubscribe()`，完成订阅流程

### 4. 处理登录跳转

```typescript
// ✅ 处理登录（登录后会自动触发 useEffect 继续订阅流程）
const handleSignIn = (provider: (redirectPath?: string) => void) => {
  setShowLoginDialog(false)
  console.log("[Pricing] Initiating login...")
  // 登录成功后会返回当前页面，useEffect 会自动继续订阅流程
  provider("/pricing")  // 登录成功后回到 pricing 页面
}
```

---

## 📊 完整流程图

### 未登录用户流程

```
用户访问 /pricing
    ↓
点击任意套餐按钮（Free/Basic/Pro）
    ↓
检测到未登录
    ↓
显示登录对话框
    ↓
用户选择 Google/GitHub 登录
    ↓
跳转到 OAuth 授权页面
    ↓
授权成功，重定向到 /pricing
    ↓
useEffect 检测到已登录 + 有待处理订阅
    ↓
自动执行订阅流程:
    ├─ Free → 跳转到 /
    ├─ Basic → 创建支付会话 → Creem 支付页面
    └─ Pro → 创建支付会话 → Creem 支付页面
```

### 已登录用户流程

```
用户访问 /pricing（已登录）
    ↓
点击任意套餐按钮
    ↓
检测到已登录
    ↓
直接执行订阅流程:
    ├─ Free → 跳转到 /
    ├─ Basic → 创建支付会话 → Creem 支付页面
    └─ Pro → 创建支付会话 → Creem 支付页面
```

---

## 🎨 UI 改进

### 登录对话框

```tsx
<Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="text-center text-xl">Sign In to Continue</DialogTitle>
      <DialogDescription className="text-center">
        {pendingSubscription?.tier === "free" 
          ? "Please sign in to start using Lumi for free"
          : "Please sign in to complete your subscription"
        }
      </DialogDescription>
    </DialogHeader>
    <div className="flex flex-col gap-3 py-4">
      <Button onClick={() => handleSignIn(signInWithGoogle)} ...>
        <GoogleIcon className="h-6 w-6" />
        Continue with Google
      </Button>
      <Button onClick={() => handleSignIn(signInWithGithub)} ...>
        <Github className="h-6 w-6" />
        Continue with GitHub
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

**特点**：
- 根据套餐类型显示不同的描述文本
- 与 navigation 组件风格一致
- 大按钮、清晰的品牌图标
- 友好的用户提示

---

## 🔧 技术实现细节

### 1. 状态管理

```typescript
// 登录对话框状态
const [showLoginDialog, setShowLoginDialog] = useState(false)

// 待处理的订阅信息
const [pendingSubscription, setPendingSubscription] = useState<{
  tier: string
  cycle: "monthly" | "yearly"
} | null>(null)

// 加载状态
const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
```

### 2. 自动继续逻辑

```typescript
useEffect(() => {
  if (user && pendingSubscription) {
    // 登录成功，自动继续订阅
    handleSubscribe(pendingSubscription.tier, pendingSubscription.cycle)
    setPendingSubscription(null)  // 清除待处理状态
  }
}, [user, pendingSubscription])
```

### 3. 错误处理

```typescript
try {
  const response = await fetch("/api/checkout/create-session", {...})
  
  if (!response.ok) {
    const errorData = await response.json()
    
    // 处理未登录错误（双重保险）
    if (response.status === 401) {
      setPendingSubscription({ tier, cycle })
      setShowLoginDialog(true)
      return
    }
    
    throw new Error(errorData.error)
  }
  
  // 成功，跳转到支付页面
  window.location.href = checkoutUrl
} catch (error) {
  toast.error("Failed to create checkout session. Please try again.")
}
```

---

## 📝 修改的文件

### 主要修改文件

1. **`app/pricing/page.tsx`** - Pricing 页面主文件
   - 添加登录对话框
   - 修改订阅流程逻辑
   - 添加登录后自动继续功能
   - 添加 Google 图标组件

### 导入的新组件

```typescript
import { useState, useEffect } from "react"  // 新增 useEffect
import { Github } from "lucide-react"  // 新增 Github 图标
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"  // 新增 Dialog 组件
```

---

## 🧪 测试场景

### 场景 1: 未登录用户点击 Free 套餐

1. 访问 `/pricing` 页面（未登录）
2. 点击 Free 套餐的 "Get Started" 按钮
3. **预期结果**：
   - 弹出登录对话框
   - 提示 "Please sign in to start using Lumi for free"
4. 选择 Google/GitHub 登录
5. 登录成功后自动跳转到 `/`（home 页面）
6. 显示 toast: "You're using the free tier..."

### 场景 2: 未登录用户点击 Basic 套餐

1. 访问 `/pricing` 页面（未登录）
2. 点击 Basic 套餐的 "Subscribe Now" 按钮
3. **预期结果**：
   - 弹出登录对话框
   - 提示 "Please sign in to complete your subscription"
4. 选择 Google/GitHub 登录
5. 登录成功后自动创建支付会话
6. 跳转到 Creem 支付页面

### 场景 3: 已登录用户点击套餐

1. 访问 `/pricing` 页面（已登录）
2. 点击任意套餐按钮
3. **预期结果**：
   - 不显示登录对话框
   - Free: 直接跳转到 home
   - Basic/Pro: 直接跳转到支付页面

### 场景 4: 切换计费周期

1. 在 pricing 页面切换 Monthly/Yearly
2. 点击 Basic 月付按钮（未登录）
3. 登录后应该创建**月付**支付会话
4. 点击 Pro 年付按钮（未登录）
5. 登录后应该创建**年付**支付会话

---

## ✅ 完成状态

| 功能 | 状态 | 说明 |
|------|------|------|
| 未登录拦截 | ✅ 完成 | 所有套餐按钮都会检查登录状态 |
| 登录对话框 | ✅ 完成 | 美观、易用的登录界面 |
| 保存用户选择 | ✅ 完成 | 登录前保存套餐和计费周期 |
| 自动继续流程 | ✅ 完成 | 登录后自动执行订阅操作 |
| Free 跳转逻辑 | ✅ 完成 | 跳转到 home 页面 |
| Basic/Pro 支付 | ✅ 完成 | 跳转到 Creem 支付页面 |
| Linter 错误 | ✅ 修复 | 无错误 |

---

## 🎯 用户体验改进

### 改进前

- ❌ 未登录点击 Free：显示 toast 并跳转到 home
- ❌ 未登录点击 Basic/Pro：显示 toast 并跳转到 home
- ❌ 用户需要手动登录后再回到 pricing 页面
- ❌ 体验割裂，转化率低

### 改进后

- ✅ 统一的登录引导流程
- ✅ 无缝的用户体验（登录后自动继续）
- ✅ 清晰的提示信息
- ✅ 美观的登录对话框
- ✅ 提高转化率

---

## 📚 相关文档

- [支付问题修复完成总结](./✅%20支付问题修复完成总结.md)
- [Creem 支付集成指南](./Creem支付集成指南.md)
- [定价策略](./定价策略.md)

---

## 💡 未来优化建议

1. **记住用户上次选择的计费周期**
   - 使用 localStorage 保存用户偏好
   - 下次访问时自动选中

2. **添加第三方登录选项**
   - Apple Sign In
   - Microsoft Account
   - Email + Password

3. **登录对话框动画**
   - 添加淡入淡出动画
   - 提升视觉体验

4. **A/B 测试**
   - 测试不同的登录对话框文案
   - 优化转化率

---

**文档版本**: v1.0  
**创建日期**: 2025-10-28  
**完成状态**: ✅ 全部完成  
**测试状态**: ⏳ 待测试

