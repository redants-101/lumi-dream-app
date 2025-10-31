# 🧪 Anonymous 用户限制测试指南

## 快速测试新的日限制（2次）和月限制（4次）

---

## 🎯 测试目标

验证 Anonymous 用户的新限制是否正常工作：
- ✅ 日限制：2 次/天
- ✅ 月限制：4 次/月
- ✅ 前端提示正确显示

---

## 🚀 测试步骤

### 方法 1：浏览器测试（推荐）

#### 1️⃣ 清除浏览器状态
```
1. 打开浏览器无痕/隐私模式
2. 访问：http://localhost:3000
3. 确保未登录状态
```

#### 2️⃣ 第一次使用
```
输入梦境 → 点击解析
✅ 预期：成功解析
✅ 前端显示：剩余 1 次（今日）
```

#### 3️⃣ 第二次使用
```
输入梦境 → 点击解析
✅ 预期：成功解析
⚠️ 前端显示：今日已用完（2/2）
⚠️ 提示：Create account for more!
```

#### 4️⃣ 第三次使用
```
输入梦境 → 点击解析
❌ 预期：被拦截
❌ 错误消息：Daily limit reached. Please sign in for more interpretations.
```

---

### 方法 2：API 直接测试

#### 准备工作
```bash
# 打开 PowerShell
cd d:\CursorWorkspace\lumi-dream-app
```

#### 测试脚本
```powershell
# 测试变量
$baseUrl = "http://localhost:3000"
$apiUrl = "$baseUrl/api/interpret"

# 测试梦境内容
$dream = "I was flying over a beautiful ocean with dolphins swimming below me"

# 请求体
$body = @{
    dream = $dream
} | ConvertTo-Json

# 发送第 1 次请求
Write-Host "=== 测试 1：第一次请求 ===" -ForegroundColor Cyan
$response1 = Invoke-WebRequest -Uri $apiUrl -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
$result1 = $response1.Content | ConvertFrom-Json
Write-Host "状态：$($response1.StatusCode)" -ForegroundColor Green
Write-Host "使用次数：$($result1.metadata.currentUsage.daily)/$($result1.metadata.currentUsage.limits.daily)" -ForegroundColor Yellow

Start-Sleep -Seconds 2

# 发送第 2 次请求
Write-Host "`n=== 测试 2：第二次请求 ===" -ForegroundColor Cyan
$response2 = Invoke-WebRequest -Uri $apiUrl -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
$result2 = $response2.Content | ConvertFrom-Json
Write-Host "状态：$($response2.StatusCode)" -ForegroundColor Green
Write-Host "使用次数：$($result2.metadata.currentUsage.daily)/$($result2.metadata.currentUsage.limits.daily)" -ForegroundColor Yellow

Start-Sleep -Seconds 2

# 发送第 3 次请求（应该被拒绝）
Write-Host "`n=== 测试 3：第三次请求（应该被拒绝）===" -ForegroundColor Cyan
try {
    $response3 = Invoke-WebRequest -Uri $apiUrl -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "⚠️ 警告：请求未被拒绝！" -ForegroundColor Red
} catch {
    $errorResponse = $_.Exception.Response
    $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
    $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
    
    Write-Host "状态：$($errorResponse.StatusCode)" -ForegroundColor Red
    Write-Host "错误消息：$($errorBody.error.message)" -ForegroundColor Red
    Write-Host "使用次数：$($errorBody.error.details.currentUsage.daily)/$($errorBody.error.details.limits.daily)" -ForegroundColor Yellow
    Write-Host "✅ 日限制正常工作！" -ForegroundColor Green
}
```

---

### 方法 3：数据库验证

#### 查看使用记录
```sql
-- 查看今日 IP 使用情况
SELECT 
  ip_address,
  date,
  hour,
  count,
  updated_at
FROM anonymous_usage
WHERE date = '2025-10-30'  -- 改为当前日期
ORDER BY ip_address, hour;

-- 统计每个 IP 的日总数
SELECT 
  ip_address,
  date,
  SUM(count) as daily_total
FROM anonymous_usage
WHERE date = '2025-10-30'
GROUP BY ip_address, date;

-- 统计每个 IP 的月总数
SELECT 
  ip_address,
  COUNT(DISTINCT date) as active_days,
  SUM(count) as monthly_total
FROM anonymous_usage
WHERE date LIKE '2025-10%'  -- 当前月份
GROUP BY ip_address;
```

---

## 🔍 验证点

### ✅ 日限制验证
- [ ] 第 1 次请求成功（1/2）
- [ ] 第 2 次请求成功（2/2）
- [ ] 第 3 次请求被拒绝（429 状态码）
- [ ] 错误消息包含 "Daily limit reached"
- [ ] 前端显示正确的剩余次数

### ✅ 月限制验证
- [ ] 跨天后日限制重置（可以继续用 2 次）
- [ ] 本月累计 4 次后被拦截
- [ ] 错误消息包含 "Monthly limit reached"
- [ ] 下月 1 号自动重置

### ✅ 错误响应格式
```json
{
  "success": false,
  "error": {
    "message": "Daily limit reached. Please sign in for more interpretations.",
    "code": "RATE_LIMIT_EXCEEDED",
    "details": {
      "currentUsage": {
        "daily": 2,
        "monthly": 3
      },
      "limits": {
        "daily": 2,
        "monthly": 4
      },
      "resetTime": {
        "daily": "2025-10-31T00:00:00.000Z",
        "monthly": "2025-11-01T00:00:00.000Z"
      },
      "userTier": "anonymous"
    }
  }
}
```

---

## 🧪 高级测试场景

### 场景 1：跨天测试
```
步骤：
1️⃣ 今天使用 2 次（达到日限制）
2️⃣ 修改系统时间到明天（或等到第二天）
3️⃣ 再次使用 2 次

预期：
- 日限制重置 ✅
- 月累计变为 4 次 ✅
- 第 5 次使用时触发月限制 ❌
```

### 场景 2：多 IP 测试
```
步骤：
1️⃣ 正常浏览器使用 2 次
2️⃣ 切换到无痕模式（不同 IP 或使用 VPN）
3️⃣ 再次使用

预期：
- 不同 IP 独立计数 ✅
- 每个 IP 都有 2 次日限制 ✅
```

### 场景 3：注册转化测试
```
步骤：
1️⃣ 匿名使用 2 次（达到日限制）
2️⃣ 点击注册按钮
3️⃣ 注册并登录
4️⃣ 继续使用

预期：
- 注册后获得 10 次/月额度 ✅
- 提示显示 "0/10" ✅
```

---

## 📊 预期日志输出

### 成功请求
```
[UsageService] ✅ IP limit check passed: 123.456.789.0 (daily: 1/2, monthly: 2/4)
[Interpret API] ✅ Dream interpretation completed
```

### 日限制触发
```
[UsageService] ❌ IP daily limit reached: 123.456.789.0 (2/2)
[Interpret API] Usage limit exceeded (anonymous)
```

### 月限制触发
```
[UsageService] ❌ IP monthly limit reached: 123.456.789.0 (4/4)
[Interpret API] Usage limit exceeded (anonymous)
```

---

## 🐛 常见问题排查

### 问题 1：限制没有生效
```bash
# 检查配置
cat lib/usage-limits.ts | grep "anonymous:" -A 5

# 检查数据库连接
# 在 Supabase Dashboard 查看 anonymous_usage 表
```

### 问题 2：IP 获取失败
```typescript
// 检查 getUserIP() 函数
// 应该返回真实 IP 而不是 'unknown'
```

### 问题 3：计数不准确
```sql
-- 清空测试数据
DELETE FROM anonymous_usage WHERE ip_address = '你的测试IP';

-- 重新开始测试
```

---

## 🔄 重置测试环境

### 清空今日数据
```sql
DELETE FROM anonymous_usage 
WHERE date = '2025-10-30';  -- 当前日期
```

### 清空特定 IP 数据
```sql
DELETE FROM anonymous_usage 
WHERE ip_address = '你的IP地址';
```

### 清空所有匿名数据
```sql
TRUNCATE TABLE anonymous_usage;
```

---

## ✅ 测试完成清单

- [ ] 日限制（2次）正常工作
- [ ] 月限制（4次）正常工作
- [ ] 错误消息正确显示
- [ ] 前端提示正确更新
- [ ] 数据库记录正确
- [ ] 日志输出清晰
- [ ] 重置时间正确
- [ ] 注册转化流程顺畅

---

## 🎯 性能验证

### 查询性能
```sql
-- 检查是否有索引
EXPLAIN ANALYZE
SELECT count FROM anonymous_usage
WHERE ip_address = '123.456.789.0'
  AND date >= '2025-10-01'
  AND date <= '2025-10-31';
```

### 建议索引
```sql
-- 如果查询慢，创建复合索引
CREATE INDEX idx_anonymous_usage_ip_date 
ON anonymous_usage(ip_address, date);
```

---

## 📝 测试报告模板

```markdown
## Anonymous 限制测试报告

**测试日期**：2025-10-30  
**测试人**：[你的名字]

### 功能测试
- [x] 日限制（2次）：✅ 通过
- [x] 月限制（4次）：✅ 通过
- [x] 错误处理：✅ 通过
- [x] 前端提示：✅ 通过

### 性能测试
- API 响应时间：< 500ms
- 数据库查询：< 100ms

### 发现的问题
1. [如有问题，在此列出]

### 总结
✅ 所有测试通过，可以部署到生产环境
```

---

## 🚀 下一步

测试通过后：
1. ✅ 提交代码到 Git
2. ✅ 部署到 Vercel
3. ✅ 监控生产环境数据
4. ✅ 观察用户注册转化率

---

**祝测试顺利！** 🎉

