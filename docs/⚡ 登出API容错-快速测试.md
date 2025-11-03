# ⚡ 登出 API 容错 - 快速测试

## 🎯 30 秒测试

### ✅ 测试：后端 API 失败时仍能登出

#### 步骤：
1. **登录账号**

2. **模拟网络故障**
   - 打开 Chrome DevTools (F12)
   - 切换到 **Network** 标签
   - **勾选 "Offline"** 或设置为 "Slow 3G"

3. **尝试登出**
   - 点击用户头像 → "Sign out"
   - 观察 Console 日志

#### ✅ 预期结果：

**Console 显示**：
```
[Auth] 🚪 Starting sign out process...
[Auth] ⚠️ Backend logout API error: TypeError: Failed to fetch - continuing with local cleanup
[Auth] ✅ User signed out successfully (local state cleared)
```

**UI 表现**：
- ✅ 用户成功登出（看到 "Sign In" 按钮）
- ✅ 无错误提示弹窗
- ✅ 流程流畅，无卡顿

**localStorage 检查**：
```javascript
// 应该被清空
localStorage.getItem('lumi_auth_cache')  // → null
localStorage.getItem('lumi_user_tier')   // → null
```

---

## ❌ 如果失败

### 现象 1：卡在登出页面
```
用户点击登出 → 页面卡住 → 用户仍显示为已登录
```

**原因**：代码未更新或浏览器缓存

**解决**：
```bash
# 1. 硬刷新
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# 2. 清除缓存
Chrome → Settings → Privacy → Clear browsing data

# 3. 重启服务器
npm run dev
```

---

### 现象 2：弹出错误提示

**原因**：错误未被正确捕获

**检查代码**：
```typescript
// hooks/use-auth.ts 应该有这段代码
try {
  const response = await fetch("/api/auth/logout", { method: "POST" })
  // ...
} catch (fetchError) {
  console.warn("[Auth] ⚠️ Backend logout API error - continuing...")
  // ✅ 不应该 throw，而是继续执行
}
```

---

## 🔍 详细检查

### 检查 1：代码是否正确更新

```typescript
// 打开 hooks/use-auth.ts，搜索 signOut 函数
// 应该看到：

const signOut = async () => {
  try {
    console.log("[Auth] 🚪 Starting sign out process...")
    
    // ✅ 这里应该有独立的 try-catch
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })
      
      if (!response.ok) {
        console.warn("[Auth] ⚠️ Backend logout failed but continuing...")
      }
    } catch (fetchError) {
      // ✅ 关键：捕获错误但继续执行
      console.warn("[Auth] ⚠️ Backend logout API error - continuing...")
    }
    
    // ✅ 后续清理代码必须执行
    setUser(null)
    clearAllUserData()
    await syncAnonymousUsageOnSignOut()
    
  } catch (error) {
    // ...
  }
}
```

---

### 检查 2：浏览器 Console 日志

**正确的日志顺序**：
```
1. [Auth] 🚪 Starting sign out process...
2. [Auth] ⚠️ Backend logout API error: ... - continuing with local cleanup
3. [Auth] 💾 User data cleared (except usage data)
4. [Auth] 📊 Fetching anonymous usage from database...
5. [Auth] ✅ User signed out successfully (local state cleared)
```

**如果缺少步骤 2**：
- 说明 fetch 没有失败（网络正常）
- 或者你没有勾选 "Offline"

**如果卡在步骤 2 后**：
- 说明后续清理代码没有执行
- 检查代码是否正确更新

---

## 📊 完整测试流程

### 1. 正常登出（后端成功）

```
取消 Offline 勾选
  ↓
登出
  ↓
Console: ✅ Backend logout successful
Console: ✅ User signed out successfully
```

### 2. 离线登出（后端失败）

```
勾选 Offline
  ↓
登出
  ↓
Console: ⚠️ Backend logout API error - continuing...
Console: ✅ User signed out successfully (local state cleared)
```

### 3. 慢网络登出（后端超时）

```
设置 Network 为 Slow 3G
  ↓
登出
  ↓
（等待几秒）
  ↓
Console: ⚠️ Backend logout failed (status: xxx) but continuing...
或
Console: ⚠️ Backend logout API error - continuing...
```

---

## ✅ 验证通过标准

**必须满足（全部）**：

- [x] 离线模式下能成功登出
- [x] Console 显示 `⚠️ Backend logout API error - continuing...`
- [x] Console 显示 `✅ User signed out successfully`
- [x] 用户被登出（UI 显示 "Sign In"）
- [x] localStorage 被清理
- [x] 无错误弹窗

---

## 🚀 上线前检查

```bash
# 1. 确认代码已更新
git diff hooks/use-auth.ts

# 2. 运行 Linter
npm run lint

# 3. 测试正常登出
# （正常网络下登出）

# 4. 测试容错登出
# （离线模式下登出）

# 5. 确认无错误
# （查看 Console 无红色错误）
```

---

**测试人**：___________  
**测试时间**：___________  
**测试结果**：✅ 通过 / ❌ 失败

**备注**：
___________________________________________

---

## 📚 相关文档

- [详细修复说明](./🔧%20登出API容错修复.md)
- [匿名用户数据同步测试](./🧪%20匿名用户数据同步测试指南.md)
- [跨标签页同步测试](./🧪%20跨标签页认证同步测试指南.md)

