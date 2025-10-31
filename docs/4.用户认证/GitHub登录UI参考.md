# 🎨 GitHub 登录 UI 参考

本文档展示 Lumi Dream App 中 GitHub 登录功能的用户界面设计。

---

## 🖼️ UI 状态概览

### 1. 未登录状态

**位置**：页面右上角

**外观**：
```
┌─────────────────────────────┐
│  🐙  Sign in with GitHub   │  ← 按钮
└─────────────────────────────┘
```

**组件代码**：
```typescript
<Button variant="outline" className="gap-2">
  <Github className="h-5 w-5" />
  Sign in with GitHub
</Button>
```

**特点**：
- GitHub 图标（Lucide React）
- Outline 风格按钮
- 悬停效果（背景变化）
- 点击后跳转到 GitHub 授权页面

---

### 2. 加载状态

**外观**：
```
┌───────┐
│  ⟳   │  ← 转圈加载图标
└───────┘
```

**组件代码**：
```typescript
<Button variant="ghost" size="icon" disabled>
  <Loader2 className="h-5 w-5 animate-spin" />
</Button>
```

**特点**：
- 转圈动画
- 禁用状态
- 在获取用户信息时显示

---

### 3. 已登录状态

**外观**：
```
┌─────────────────────────────────────┐
│  👤  ← 用户头像（圆形，可点击）     │
│                                     │
│  点击后展开下拉菜单：               │
│  ┌───────────────────────┐         │
│  │  John Doe              │  ← 用户名
│  │  john@example.com      │  ← 邮箱
│  ├───────────────────────┤
│  │  🚪  Sign out          │  ← 登出按钮
│  └───────────────────────┘
└─────────────────────────────────────┘
```

**组件代码**：
```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatarUrl} alt={userName} />
        <AvatarFallback>
          <User className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-56" align="end">
    <DropdownMenuLabel>
      <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium">{userName}</p>
        <p className="text-xs text-muted-foreground">{userEmail}</p>
      </div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={signOut}>
      <LogOut className="mr-2 h-4 w-4" />
      <span>Sign out</span>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**特点**：
- 用户 GitHub 头像（如果有）
- 后备图标（User 图标）
- 下拉菜单显示用户信息
- 登出选项

---

## 🎨 设计规范

### 颜色
- **按钮边框**：`border` (Lumi 主题颜色)
- **按钮背景**：`transparent` → `accent/10` (悬停)
- **头像边框**：无边框，圆形
- **下拉菜单**：`card` 背景，带阴影
- **文字颜色**：
  - 主文本：`foreground`
  - 次要文本：`muted-foreground`

### 尺寸
- **登录按钮高度**：默认（约 40px）
- **头像大小**：40px × 40px
- **图标大小**：
  - 按钮图标：20px × 20px
  - 菜单图标：16px × 16px
- **下拉菜单宽度**：224px (w-56)

### 间距
- **按钮内边距**：标准 Shadcn/ui 间距
- **菜单项间距**：4px (space-y-1)
- **图标与文字间距**：8px (gap-2 或 mr-2)

### 动画
- **加载图标**：`animate-spin`（旋转动画）
- **下拉菜单**：淡入 + 下滑动画（Radix UI 默认）
- **按钮悬停**：平滑过渡（transition-all）

---

## 📱 响应式设计

### 桌面端（> 768px）
```
┌────────────────────────────────────────────────┐
│  Lumi Logo                      👤 ← 用户头像   │
│                                                │
│  [Dream Input Area]                            │
└────────────────────────────────────────────────┘
```

### 移动端（< 768px）
```
┌──────────────────────────┐
│  Lumi Logo      👤       │  ← 头像稍小
│                          │
│  [Dream Input Area]      │
└──────────────────────────┘
```

**适配说明**：
- 移动端头像可以保持相同大小
- 下拉菜单自动适配屏幕宽度
- 登录按钮文字在极小屏幕可考虑隐藏（仅显示图标）

---

## 🔄 交互流程

### 登录流程

```
1. 用户看到登录按钮
   ┌─────────────────────────────┐
   │  🐙  Sign in with GitHub   │
   └─────────────────────────────┘
   
2. 用户点击按钮
   ↓
   
3. 跳转到 GitHub 授权页面
   ┌─────────────────────────────┐
   │  GitHub Authorization       │
   │                             │
   │  Lumi wants to access:      │
   │  - Your email               │
   │  - Your profile info        │
   │                             │
   │  [Cancel]  [Authorize]      │
   └─────────────────────────────┘
   
4. 用户点击 Authorize
   ↓
   
5. 返回 Lumi，显示加载状态
   ┌───────┐
   │  ⟳   │
   └───────┘
   
6. 加载完成，显示用户头像
   ┌─────┐
   │  👤 │
   └─────┘
```

### 登出流程

```
1. 用户点击头像
   ┌─────┐
   │  👤 │
   └─────┘
   
2. 展开下拉菜单
   ┌───────────────────────┐
   │  John Doe              │
   │  john@example.com      │
   ├───────────────────────┤
   │  🚪  Sign out          │ ← 点击此处
   └───────────────────────┘
   
3. 页面刷新
   ↓
   
4. 重新显示登录按钮
   ┌─────────────────────────────┐
   │  🐙  Sign in with GitHub   │
   └─────────────────────────────┘
```

---

## 🎭 状态说明

### 状态 1：未认证（Initial）
- **显示内容**：Sign in with GitHub 按钮
- **可交互**：是
- **用户操作**：点击登录

### 状态 2：加载中（Loading）
- **显示内容**：旋转的加载图标
- **可交互**：否
- **持续时间**：1-3 秒

### 状态 3：已认证（Authenticated）
- **显示内容**：用户头像
- **可交互**：是
- **用户操作**：点击查看菜单/登出

### 状态 4：认证错误（Error）
- **显示内容**：错误页面（`/auth/auth-code-error`）
- **可交互**：是
- **用户操作**：返回首页重试

---

## 🖌️ 自定义样式

### Lumi 主题适配

当前实现已完美适配 Lumi 主题：

```css
/* 主题色变量（已配置） */
--background: oklch(0.12 0.05 280)      /* 深午夜蓝 */
--foreground: oklch(0.95 0.01 280)      /* 柔和白色 */
--primary: oklch(0.65 0.15 60)          /* 柔和金色 */
--accent: oklch(0.55 0.18 280)          /* 鲜艳紫色 */
```

**按钮悬停效果**：
```typescript
// 自动应用主题色
className="hover:bg-accent/10"
```

**发光效果（可选）**：
```typescript
// 为登录按钮添加金色光晕
className="glow-box"
```

---

## 📋 辅助功能（A11y）

### 键盘导航
- ✅ Tab 键可聚焦按钮
- ✅ Enter/Space 键可激活按钮
- ✅ Esc 键可关闭下拉菜单
- ✅ 方向键可在菜单项间导航

### 屏幕阅读器
- ✅ 按钮有明确的 label："Sign in with GitHub"
- ✅ 头像有 alt 属性
- ✅ 菜单项有语义化 HTML
- ✅ 加载状态可被读取

### 对比度
- ✅ 文字与背景对比度 > 4.5:1（WCAG AA）
- ✅ 按钮边框清晰可见
- ✅ 图标大小足够（不小于 16px）

---

## 🔧 自定义配置

### 更改按钮文字

```typescript
// components/user-button.tsx
<Button onClick={signInWithGithub} variant="outline">
  <Github className="h-5 w-5" />
  登录 GitHub  {/* ← 改为中文 */}
</Button>
```

### 更改按钮样式

```typescript
// 改为主色按钮
<Button 
  onClick={signInWithGithub} 
  variant="default"  {/* outline → default */}
  className="glow-box"  {/* 添加发光效果 */}
>
  <Github className="h-5 w-5" />
  Sign in with GitHub
</Button>
```

### 隐藏用户邮箱

```typescript
// components/user-button.tsx
<DropdownMenuLabel className="font-normal">
  <div className="flex flex-col space-y-1">
    <p className="text-sm font-medium">{userName}</p>
    {/* 注释掉邮箱显示 */}
    {/* <p className="text-xs text-muted-foreground">{userEmail}</p> */}
  </div>
</DropdownMenuLabel>
```

### 添加更多菜单项

```typescript
// components/user-button.tsx
<DropdownMenuContent>
  {/* ... 现有内容 ... */}
  <DropdownMenuSeparator />
  <DropdownMenuItem>
    <Settings className="mr-2 h-4 w-4" />
    <span>Settings</span>
  </DropdownMenuItem>
  <DropdownMenuItem>
    <User className="mr-2 h-4 w-4" />
    <span>Profile</span>
  </DropdownMenuItem>
</DropdownMenuContent>
```

---

## 🎬 动画效果

### 按钮悬停动画

```typescript
// 默认已包含的过渡效果
className="transition-all duration-200 hover:bg-accent/10"
```

### 头像旋转效果（可选）

```typescript
<Avatar className="h-10 w-10 transition-transform hover:scale-110">
  {/* ... */}
</Avatar>
```

### 下拉菜单动画

```typescript
// Radix UI 自动提供的动画
// 可以通过 CSS 自定义
.dropdown-menu-content {
  animation: slideDownAndFade 200ms ease-out;
}

@keyframes slideDownAndFade {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 📊 组件层级结构

```
UserButton (components/user-button.tsx)
├── Loading State
│   └── Button (ghost, icon)
│       └── Loader2 (spinning)
│
├── Unauthenticated State
│   └── Button (outline)
│       ├── Github Icon
│       └── Text: "Sign in with GitHub"
│
└── Authenticated State
    └── DropdownMenu
        ├── DropdownMenuTrigger
        │   └── Button (ghost, rounded)
        │       └── Avatar
        │           ├── AvatarImage (GitHub avatar)
        │           └── AvatarFallback (User icon)
        │
        └── DropdownMenuContent
            ├── DropdownMenuLabel
            │   ├── User Name
            │   └── User Email
            │
            ├── DropdownMenuSeparator
            │
            └── DropdownMenuItem (Sign out)
                ├── LogOut Icon
                └── Text: "Sign out"
```

---

## 🌟 UI 亮点

### 1. 渐进式披露
- 未登录时只显示简单的登录按钮
- 登录后才显示用户菜单
- 信息按需展示，不占用过多空间

### 2. 视觉反馈
- 悬停状态变化
- 点击后立即显示加载状态
- 成功后平滑切换到用户头像

### 3. 一致性
- 使用 Shadcn/ui 组件，与整体 UI 统一
- 遵循 Lumi 设计语言
- 图标风格一致（Lucide React）

### 4. 可访问性
- 完整的键盘支持
- 屏幕阅读器友好
- 高对比度

---

## 🎯 最佳实践

1. **保持简洁**：登录按钮不应过于显眼，但要易于找到
2. **快速反馈**：点击后立即显示加载状态
3. **信息清晰**：用户菜单清楚显示当前登录用户
4. **易于退出**：登出选项明显且易于访问
5. **优雅降级**：头像加载失败时显示后备图标

---

**参考组件**：`components/user-button.tsx`  
**使用示例**：`app/page.tsx`

**祝你设计愉快！✨**

