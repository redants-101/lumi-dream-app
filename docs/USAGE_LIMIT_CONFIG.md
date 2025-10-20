# 🔧 使用次数限制配置指南

本文档说明如何通过环境变量灵活配置 Lumi Dream App 的使用次数限制。

---

## 📋 配置概览

### 可配置参数

| 环境变量 | 说明 | 默认值 | 建议范围 |
|---------|------|-------|---------|
| `NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT` | 未登录用户每日限制 | 5 | 0-10 |
| `NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT` | 已登录用户每日限制 | 10 | 5-50 |

---

## 🚀 快速配置

### 步骤 1：编辑环境变量文件

打开或创建 `.env.local` 文件，添加以下配置：

```bash
# 使用次数限制配置
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=5
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=10
```

### 步骤 2：重启开发服务器

```bash
pnpm dev
```

### 步骤 3：验证配置

访问应用，检查剩余次数显示是否符合你的配置。

---

## 📝 配置示例

### 示例 1：默认配置（当前）

```bash
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=5
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=10
```

**效果**：
- 未登录用户：5 次/天
- 已登录用户：10 次/天

---

### 示例 2：更宽松的限制

```bash
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=10
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=20
```

**效果**：
- 未登录用户：10 次/天
- 已登录用户：20 次/天

**适用场景**：
- 测试阶段
- 用户基数小
- 服务器资源充足

---

### 示例 3：更严格的限制

```bash
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=3
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=5
```

**效果**：
- 未登录用户：3 次/天
- 已登录用户：5 次/天

**适用场景**：
- 降低服务器成本
- API 调用成本高
- 强制用户登录

---

### 示例 4：仅限已登录用户

```bash
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=0
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=10
```

**效果**：
- 未登录用户：0 次（必须登录）
- 已登录用户：10 次/天

**适用场景**：
- 完全的用户管理
- 付费服务
- 需要用户追踪

---

### 示例 5：无限制模式（测试用）

```bash
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=999
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=999
```

**效果**：
- 未登录用户：999 次/天（几乎无限制）
- 已登录用户：999 次/天

**适用场景**：
- 开发测试
- 内部演示
- 临时解除限制

⚠️ **不建议在生产环境使用！**

---

## 🎯 推荐配置策略

### 策略 1：标准免费增值模式

```bash
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=5
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=10
```

**目标**：鼓励用户注册

**优点**：
- ✅ 给予免费试用机会
- ✅ 激励用户注册
- ✅ 平衡用户体验和成本

---

### 策略 2：强注册模式

```bash
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=1
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=15
```

**目标**：快速获取注册用户

**优点**：
- ✅ 只允许试用 1 次
- ✅ 强制用户注册
- ✅ 已登录用户获得更多权益

---

### 策略 3：开放试用模式

```bash
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=10
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=20
```

**目标**：优先用户体验

**优点**：
- ✅ 充分试用机会
- ✅ 降低注册门槛
- ✅ 注册仍有明显优势

---

### 策略 4：成本控制模式

```bash
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=3
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=8
```

**目标**：控制 API 调用成本

**优点**：
- ✅ 减少免费使用量
- ✅ 降低运营成本
- ✅ 保持基本可用性

---

## 🔍 配置最佳实践

### 1. 根据成本计算

**计算公式**：
```
每日 API 成本 = 
  (未登录用户数 × 未登录限制 + 登录用户数 × 登录限制) × 单次成本
```

**示例**：
- 假设单次 API 调用成本：$0.01
- 每日未登录用户：1000 人
- 每日登录用户：100 人

**配置 1**（5/10）：
```
成本 = (1000 × 5 + 100 × 10) × 0.01 = $60/天
```

**配置 2**（3/8）：
```
成本 = (1000 × 3 + 100 × 8) × 0.01 = $38/天
```

### 2. A/B 测试

**测试不同配置对注册率的影响**：

```bash
# 测试组 A（宽松）
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=7
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=15

# 测试组 B（标准）
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=5
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=10

# 测试组 C（严格）
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=3
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=8
```

观察哪个配置的注册转化率最高。

### 3. 分阶段调整

**第一阶段**：产品发布（宽松）
```bash
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=10
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=20
```

**第二阶段**：用户增长（标准）
```bash
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=5
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=10
```

**第三阶段**：成本优化（严格）
```bash
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=3
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=8
```

---

## 🚨 注意事项

### 1. 配置限制

**最小值**：0（完全禁用）
**最大值**：建议不超过 100

**原因**：
- 数字过大可能导致成本失控
- localStorage 有存储限制
- 用户体验上没有必要

### 2. 重启要求

修改环境变量后**必须重启**开发服务器：

```bash
# 停止服务器（Ctrl + C）
# 然后重新启动
pnpm dev
```

### 3. 生产环境配置

在 Vercel 或其他托管平台，需要在环境变量设置中配置：

**Vercel**：
```
Settings → Environment Variables
→ 添加 NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT
→ 添加 NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT
→ Redeploy
```

### 4. 缓存清除

修改限制后，已有用户的 localStorage 数据不会自动更新。用户需要：
- 等到第二天自动重置
- 或手动清除浏览器缓存

---

## 📊 监控建议

### 监控指标

1. **每日总使用次数**
   - 追踪实际使用量
   - 计算实际成本

2. **达到限制的用户数**
   - 未登录用户达到 5 次的数量
   - 已登录用户达到 10 次的数量

3. **注册转化率**
   - 达到免费限制后的注册率
   - 不同配置下的转化率对比

4. **成本分析**
   - API 调用总成本
   - 单个用户平均成本
   - ROI 分析

### 实现方式

在 `incrementUsage()` 函数中添加追踪：

```typescript
const incrementUsage = () => {
  const newCount = data.count + 1
  
  // 发送分析事件
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'dream_interpretation', {
      user_type: isAuthenticated ? 'authenticated' : 'anonymous',
      usage_count: newCount,
      limit_reached: newCount >= getLimit()
    })
  }
  
  // 其他代码...
}
```

---

## 🔄 动态调整策略

### 根据时间段调整

**高峰期**（降低限制）：
```bash
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=3
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=8
```

**低峰期**（提高限制）：
```bash
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=7
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=15
```

### 根据用户反馈调整

收集用户反馈后调整：
- 如果用户抱怨限制太严格 → 适当提高
- 如果成本压力大 → 适当降低
- 如果注册率低 → 调整差异化

---

## 💡 高级配置

### 未来可以考虑的配置

```bash
# 每周限制（未实现）
NEXT_PUBLIC_WEEKLY_LIMIT=30

# 每月限制（未实现）
NEXT_PUBLIC_MONTHLY_LIMIT=100

# VIP 用户限制（未实现）
NEXT_PUBLIC_VIP_USAGE_LIMIT=50

# 重置时间（未实现）
NEXT_PUBLIC_RESET_HOUR=0  # 0 = 午夜
```

### 按用户级别配置（未实现）

```typescript
// 可以扩展为
const getLimit = (userTier: 'free' | 'pro' | 'enterprise') => {
  switch(userTier) {
    case 'free': return 10
    case 'pro': return 50
    case 'enterprise': return 999
  }
}
```

---

## 📚 相关文档

- [使用限制功能文档](./USAGE_LIMIT_FEATURE.md) - 功能实现细节
- [环境变量配置](./ENV_SETUP.md) - 通用环境变量配置
- [README](../README.md) - 项目概览

---

## ✅ 配置检查清单

- [ ] 已在 `.env.local` 中配置限制值
- [ ] 已重启开发服务器
- [ ] 已测试未登录用户限制
- [ ] 已测试已登录用户限制
- [ ] 已验证警告提示显示正确
- [ ] 已验证限制达到后禁用功能
- [ ] 生产环境已配置（如需要）

---

## 🎉 总结

通过环境变量配置使用限制，你可以：

- ✅ **灵活调整**：无需修改代码
- ✅ **快速测试**：A/B 测试不同策略
- ✅ **环境隔离**：开发和生产使用不同配置
- ✅ **成本控制**：根据预算动态调整
- ✅ **用户体验**：平衡免费和付费权益

**立即配置你的使用限制策略！✨**

---

**创建日期**：2025-10-18  
**版本**：v1.0.0  
**状态**：✅ 完成

