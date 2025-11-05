# 🔧 ngrok 重定向问题修复

## 🐛 问题描述

**现象**：
- 用户通过 ngrok URL 访问：`https://unpatentable-unrepudiable-marget.ngrok-free.dev/pricing`
- 点击登录并授权成功
- **错误**：重定向到了 `https://localhost:3000/pricing`（而不是 ngrok URL）

**预期行为**：
- 应该重定向回：`https://unpatentable-unrepudiable-marget.ngrok-free.dev/pricing` ✅

## 🔍 根本原因分析

### ngrok 工作原理

```
用户浏览器
    ↓ 访问 https://...ngrok-free.dev
ngrok 服务器（云端）
    ↓ 建立隧道转发
localhost:3000（你的 Next.js 服务器）
```

**关键点**：
- ngrok 是一个**反向代理隧道**
- 外部请求看到的是 ngrok URL
- 但服务器内部看到的可能是 localhost URL

### 原代码的问题

```typescript
// ❌ 旧代码（app/api/auth/callback/route.ts）
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  //                    ↑ 问题！request.url 可能是 localhost URL
  
  // ...
  
  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`)
    //                             ↑ origin = "http://localhost:3000"
    //                               导致重定向错误！
  }
}
```

**问题流程**：

```
1. GitHub 回调到:
   https://...ngrok-free.dev/api/auth/callback?code=xxx&next=/pricing

2. ngrok 转发到:
   http://localhost:3000/api/auth/callback?code=xxx&next=/pricing
   （内部转发）

3. Next.js 服务器接收到:
   request.url = "http://localhost:3000/api/auth/callback?code=xxx&next=/pricing"
                  ↑ 可能是 localhost！

4. 解析 origin:
   origin = "http://localhost:3000"  ❌ 错误！

5. 重定向到:
   http://localhost:3000/pricing  ❌ 用户无法访问！
```

### HTTP Headers 的解决方案

ngrok（和其他反向代理）会设置特殊的 HTTP Headers：

```http
GET /api/auth/callback?code=xxx&next=/pricing HTTP/1.1
Host: localhost:3000
X-Forwarded-Host: unpatentable-unrepudiable-marget.ngrok-free.dev  ← 真实主机名
X-Forwarded-Proto: https  ← 真实协议
X-Forwarded-For: 1.2.3.4  ← 用户真实 IP
```

这些 headers 告诉服务器：
- 用户实际访问的主机名是什么
- 使用的是 HTTP 还是 HTTPS

## ✅ 修复方案

### 修复后的代码

```typescript
// ✅ 新代码（app/api/auth/callback/route.ts）
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  
  // ✅ 获取真实的主机名
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto")
  
  // ✅ 智能选择 baseUrl（优先级顺序）
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL  // 1. 环境变量（最高优先级）
  if (!baseUrl) {
    if (forwardedHost) {
      // 2. 使用 forwarded headers（ngrok/Vercel/Netlify）
      const protocol = forwardedProto || "https"
      baseUrl = `${protocol}://${forwardedHost}`
    } else {
      // 3. 后备方案：使用 request URL
      baseUrl = requestUrl.origin
    }
  }
  
  // ✅ 使用正确的 baseUrl 重定向
  const redirectUrl = `${baseUrl}${next}`
  return NextResponse.redirect(redirectUrl)
}
```

### 修复后的流程

```
1. GitHub 回调到:
   https://...ngrok-free.dev/api/auth/callback?code=xxx&next=/pricing

2. ngrok 转发并添加 headers:
   X-Forwarded-Host: unpatentable-unrepudiable-marget.ngrok-free.dev
   X-Forwarded-Proto: https

3. Next.js 服务器:
   forwardedHost = "unpatentable-unrepudiable-marget.ngrok-free.dev"
   forwardedProto = "https"
   
4. 构建 baseUrl:
   baseUrl = "https://unpatentable-unrepudiable-marget.ngrok-free.dev"  ✅

5. 重定向到:
   https://unpatentable-unrepudiable-marget.ngrok-free.dev/pricing  ✅ 正确！
```

## 🎯 优先级策略

修复后的代码使用**三级优先级**：

### 优先级 1：环境变量（推荐）

```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://unpatentable-unrepudiable-marget.ngrok-free.dev
```

**优点**：
- ✅ 明确控制
- ✅ 适用于所有环境（本地/ngrok/生产）
- ✅ 不依赖 headers

**缺点**：
- ⚠️ ngrok URL 变化时需要手动更新

### 优先级 2：Forwarded Headers（自动）

```http
X-Forwarded-Host: unpatentable-unrepudiable-marget.ngrok-free.dev
X-Forwarded-Proto: https
```

**优点**：
- ✅ 自动检测
- ✅ 适用于 ngrok、Vercel、Netlify
- ✅ ngrok URL 变化时自动适配

**缺点**：
- ⚠️ 依赖反向代理正确设置 headers

### 优先级 3：Request URL（后备）

```typescript
baseUrl = requestUrl.origin  // "http://localhost:3000"
```

**优点**：
- ✅ 总是有值
- ✅ 纯本地开发时正确

**缺点**：
- ⚠️ 通过 ngrok 访问时错误

## 🧪 测试验证

### 测试 1：使用环境变量（推荐）

**配置**：
```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://unpatentable-unrepudiable-marget.ngrok-free.dev
```

**步骤**：
1. 重启服务器：`pnpm dev`
2. 访问：`https://unpatentable-unrepudiable-marget.ngrok-free.dev/pricing`
3. 点击 "Subscribe Now"
4. 登录

**预期日志**：
```
=== [OAuth Callback] ===
Request origin: http://localhost:3000
Forwarded Host: unpatentable-unrepudiable-marget.ngrok-free.dev
Forwarded Proto: https
Base URL (final): https://unpatentable-unrepudiable-marget.ngrok-free.dev  ✅
Next param: /pricing
Redirecting to: https://unpatentable-unrepudiable-marget.ngrok-free.dev/pricing  ✅
```

**结果**：✅ 重定向到正确的 ngrok URL

### 测试 2：不使用环境变量（自动检测）

**配置**：
```bash
# .env.local
# NEXT_PUBLIC_APP_URL=https://...  ← 注释掉
```

**步骤**：同上

**预期日志**：
```
=== [OAuth Callback] ===
Request origin: http://localhost:3000
Forwarded Host: unpatentable-unrepudiable-marget.ngrok-free.dev  ✅ 从 header 获取
Forwarded Proto: https  ✅ 从 header 获取
Base URL (final): https://unpatentable-unrepudiable-marget.ngrok-free.dev  ✅
```

**结果**：✅ 自动检测 ngrok URL

### 测试 3：纯 localhost 访问

**步骤**：
1. 访问：`http://localhost:3000/pricing`（不通过 ngrok）
2. 登录

**预期日志**：
```
=== [OAuth Callback] ===
Request origin: http://localhost:3000
Forwarded Host: null  ← 没有 ngrok
Forwarded Proto: null
Base URL (final): http://localhost:3000  ✅ 使用 request origin
Redirecting to: http://localhost:3000/pricing  ✅
```

**结果**：✅ 正确处理纯本地访问

## 📊 不同场景对比

| 访问方式 | Request URL | Forwarded Host | Base URL（最终） | 结果 |
|---------|-------------|----------------|------------------|------|
| localhost | `http://localhost:3000` | `null` | `http://localhost:3000` | ✅ 正确 |
| ngrok（有环境变量） | `http://localhost:3000` | `...ngrok...` | 环境变量的值 | ✅ 正确 |
| ngrok（无环境变量） | `http://localhost:3000` | `...ngrok...` | `https://...ngrok...` | ✅ 正确 |
| Vercel 生产 | `http://...` | `yourdomain.com` | `https://yourdomain.com` | ✅ 正确 |

## 🔧 环境变量配置建议

### 开发环境

**如果主要使用 localhost**：
```bash
# .env.local
# 不设置或注释掉
# NEXT_PUBLIC_APP_URL=...
```

**如果主要使用 ngrok**：
```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://unpatentable-unrepudiable-marget.ngrok-free.dev
```

### 生产环境

```bash
# .env.production
NEXT_PUBLIC_APP_URL=https://www.lumidreams.app
```

## 💡 最佳实践

### 1. 使用固定的 ngrok 域名（付费功能）

```bash
# 固定域名，不会变化
ngrok http 3000 --domain=lumidreams.ngrok-free.app
```

### 2. 在 Supabase 中配置所有可能的 URL

```
Site URL: https://www.lumidreams.app

Redirect URLs:
- http://localhost:3000/**
- https://*.ngrok-free.dev/**  ← 通配符支持所有 ngrok subdomain
- https://www.lumidreams.app/**
```

### 3. 在 GitHub OAuth 中配置多个回调 URL

如果可能，使用多个 OAuth Apps：
- **Development App**：`http://localhost:3000/api/auth/callback`
- **Staging App**：`https://...ngrok-free.dev/api/auth/callback`
- **Production App**：`https://www.lumidreams.app/api/auth/callback`

## 📋 故障排除

### 问题：仍然重定向到 localhost

**可能原因**：
1. 环境变量未设置或拼写错误
2. ngrok 未设置 forwarded headers
3. 服务器未重启

**解决方案**：
```bash
# 1. 检查环境变量
echo $env:NEXT_PUBLIC_APP_URL  # PowerShell
# 或
cat .env.local | grep NEXT_PUBLIC_APP_URL

# 2. 删除 .next 缓存
Remove-Item -Recurse -Force .next

# 3. 重启服务器
pnpm dev
```

### 问题：环境变量不生效

**原因**：Next.js 在构建时会将 `NEXT_PUBLIC_*` 变量内联到代码中

**解决方案**：
- 修改环境变量后**必须重启**开发服务器
- 客户端组件需要重新构建

### 问题：ngrok URL 变化频繁

**免费方案**：
- 每次启动 ngrok 都会生成新的 URL
- 需要手动更新 Supabase、GitHub 配置

**付费方案**：
- 使用固定域名：`--domain=your-fixed-domain.ngrok-free.app`
- 一次配置，永久有效

## 🎉 总结

修复后的系统现在支持：
- ✅ localhost 开发
- ✅ ngrok 隧道测试
- ✅ Vercel/Netlify 部署
- ✅ 自定义域名生产环境

**关键改进**：
1. 使用 `x-forwarded-host` header 获取真实主机名
2. 三级优先级策略确保所有场景正确
3. 详细日志帮助调试

现在无论通过什么方式访问，登录后都会正确重定向到原始 URL！🚀

---

**创建时间**：2025-11-05  
**最后更新**：2025-11-05  
**状态**：✅ 已修复并测试

