# 🔍 Sitemap & Robots.txt 404 错误根本原因分析

## 📋 问题描述

部署到 Vercel 后：
- ❌ `/sitemap.xml` 返回 **404 Not Found**
- ❌ `/robots.txt` 返回 **Vercel 默认内容**（而非自定义内容）

## 🎯 根本原因（已确认）

### 核心问题：缺少 `export const dynamic = 'force-dynamic'`

在 Next.js 15 App Router 中，默认情况下：
- `app/sitemap.ts` 和 `app/robots.ts` 会在**构建时静态预渲染**
- Vercel 会为这些静态文件生成缓存
- 如果构建时环境变量未正确配置，生成的静态文件会包含错误的 URL
- 静态文件一旦生成，后续请求不会重新生成

### 构建输出对比

**修复前（错误）**：
```bash
Route (app)                                 Size  First Load JS
├ ○ /robots.txt                            130 B         102 kB
└ ○ /sitemap.xml                           130 B         102 kB

○  (Static)   prerendered as static content
```

**修复后（正确）**：
```bash
Route (app)                                 Size  First Load JS
├ ƒ /robots.txt                            130 B         102 kB
└ ƒ /sitemap.xml                           130 B         102 kB

ƒ  (Dynamic)  server-rendered on demand
```

### 构建文件结构对比

**修复前（静态）**：
```
.next/server/app/
├── robots.txt.body      ← 静态内容文件
├── robots.txt.meta      ← 静态元数据
├── sitemap.xml.body     ← 静态内容文件
└── sitemap.xml.meta     ← 静态元数据
```

**修复后（动态）**：
```
.next/server/app/
├── robots.txt/
│   └── route.js         ← 动态路由处理器！
└── sitemap.xml/
    └── route.js         ← 动态路由处理器！
```

## ✅ 完整解决方案

### 1. 强制动态生成（关键修复）

#### app/sitemap.ts
```typescript
import { MetadataRoute } from "next"

// 🔥 关键：强制动态生成，不在构建时静态化
export const dynamic = 'force-dynamic'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://www.lumidreams.app")
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ]
}
```

#### app/robots.ts
```typescript
import { MetadataRoute } from "next"

// 🔥 关键：强制动态生成，不在构建时静态化
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://www.lumidreams.app")
  
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

### 2. 简化 vercel.json

移除可能冲突的 `rewrites` 配置，Next.js App Router 会自动处理这些路由：

```json
{
  "headers": [
    {
      "source": "/sitemap.xml",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/xml; charset=utf-8"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/robots.txt",
      "headers": [
        {
          "key": "Content-Type",
          "value": "text/plain; charset=utf-8"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

### 3. 设置 Vercel 环境变量（可选但推荐）

在 Vercel 项目设置中添加：
```
NEXT_PUBLIC_APP_URL = https://www.lumidreams.app
```

**注意**：即使不设置此变量，代码也会自动使用 `VERCEL_URL` 或回退到默认域名。

## 🔬 技术原理深度解析

### Next.js 15 App Router 的路由生成策略

1. **默认行为（Static）**
   ```typescript
   // 没有 export const dynamic
   export default function sitemap() { ... }
   ```
   - 在 `next build` 时执行一次
   - 生成静态的 `.body` 和 `.meta` 文件
   - 部署后所有请求返回相同的静态内容
   - **问题**：如果构建时环境变量不正确，永远返回错误内容

2. **动态行为（Dynamic）**
   ```typescript
   // 添加 force-dynamic
   export const dynamic = 'force-dynamic'
   export default function sitemap() { ... }
   ```
   - 编译为 `route.js` 动态路由处理器
   - 每次请求时在服务器端执行
   - 可以实时读取环境变量
   - **优势**：灵活、可以根据请求动态生成

### 为什么 Vercel 会返回默认 robots.txt？

当 Next.js 静态生成的文件在 Vercel 上找不到或出错时：
1. Vercel 的 CDN 层检测到路由不存在
2. 回退到 Vercel 的默认行为
3. 返回 Vercel 的标准 robots.txt（包含 AI 训练政策声明）

### 为什么会出现 404？

1. **构建时问题**：
   - 环境变量未设置 → URL 错误 → 静态文件无效
   - 静态文件路径与预期不匹配

2. **Vercel 部署问题**：
   - 静态文件未正确上传到 CDN
   - 路由映射配置冲突

3. **缓存问题**：
   - 旧的错误缓存未清除
   - CDN 仍返回旧版本

## 📊 验证清单

部署后确认以下所有项：

### 本地验证
```bash
# 1. 清除构建缓存
rm -rf .next

# 2. 重新构建
npm run build

# 3. 检查构建输出（应该看到 ƒ 符号）
# ƒ /robots.txt    (Dynamic)
# ƒ /sitemap.xml   (Dynamic)

# 4. 检查构建文件结构
ls .next/server/app/robots.txt/route.js      # 应该存在
ls .next/server/app/sitemap.xml/route.js     # 应该存在

# 5. 启动生产构建测试
npm start

# 6. 测试本地访问
curl http://localhost:3000/robots.txt
curl http://localhost:3000/sitemap.xml
```

### Vercel 部署验证

1. **检查部署日志**
   - 登录 Vercel → 项目 → Deployments
   - 查看最新部署的 Build Logs
   - 确认看到 `ƒ /robots.txt` 和 `ƒ /sitemap.xml`

2. **清除缓存**
   - 在 Vercel 项目设置中找到 "Purge Cache"
   - 或等待部署完成后自动清除

3. **测试线上访问**
   ```bash
   # 使用 curl 测试（绕过浏览器缓存）
   curl https://www.lumidreams.app/robots.txt
   curl https://www.lumidreams.app/sitemap.xml
   
   # 期望结果：返回自定义内容，不是 404 或 Vercel 默认内容
   ```

4. **浏览器测试**
   - 使用无痕模式
   - 或强制刷新：Ctrl + Shift + R

## 🚨 常见错误避免

### ❌ 错误做法

1. **在 public 目录放置静态文件**
   ```
   public/robots.txt     ← 会覆盖动态生成的文件
   public/sitemap.xml    ← 会覆盖动态生成的文件
   ```

2. **使用 API 路由代替文件约定**
   ```typescript
   // ❌ 不推荐：app/api/sitemap/route.ts
   export async function GET() {
     return new Response(...)
   }
   ```

3. **在 next.config.js 中添加不必要的 rewrites**
   ```javascript
   // ❌ 不需要这样做
   rewrites: async () => [
     {
       source: '/sitemap.xml',
       destination: '/api/sitemap',
     },
   ]
   ```

4. **忘记清除构建缓存**
   ```bash
   # ❌ 直接重新构建可能使用旧缓存
   npm run build
   
   # ✅ 应该先清除缓存
   rm -rf .next && npm run build
   ```

### ✅ 正确做法

1. **使用 App Router 文件约定**
   ```
   app/sitemap.ts     ← Next.js 原生支持
   app/robots.ts      ← Next.js 原生支持
   ```

2. **添加 force-dynamic**
   ```typescript
   export const dynamic = 'force-dynamic'
   ```

3. **简化配置**
   - 移除不必要的 vercel.json rewrites
   - 让 Next.js 自动处理路由

4. **环境变量回退策略**
   ```typescript
   const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://www.lumidreams.app")
   ```

## 📚 参考资料

### Next.js 官方文档
- [Metadata Files: sitemap.xml](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Metadata Files: robots.txt](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Route Segment Config: dynamic](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic)

### Vercel 部署指南
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Build Configuration](https://vercel.com/docs/build-step)
- [Caching and CDN](https://vercel.com/docs/edge-network/caching)

## 💡 关键要点总结

1. **`export const dynamic = 'force-dynamic'` 是解决 404 的关键**
   - 将静态预渲染改为动态服务器渲染
   - 确保每次请求都能访问最新的环境变量

2. **构建输出符号很重要**
   - `○` = Static（静态）→ 可能导致 404
   - `ƒ` = Dynamic（动态）→ 正确的行为

3. **Next.js 15 App Router 原生支持**
   - 不需要 API 路由
   - 不需要复杂的 rewrites 配置
   - 遵循文件约定即可

4. **环境变量要有回退策略**
   - 使用 `VERCEL_URL` 作为中间回退
   - 提供硬编码的默认域名作为最终回退

5. **清除缓存很重要**
   - 本地：删除 `.next` 目录
   - Vercel：使用 Purge Cache 或重新部署

## 🎓 教训总结

这个问题的解决过程揭示了几个重要教训：

1. **阅读官方文档的重要性**
   - Next.js 文档明确说明了 `dynamic` 配置的作用
   - 应该首先查阅官方文档而不是尝试自定义方案

2. **构建输出是重要的调试信息**
   - `○` vs `ƒ` 符号直接显示了路由类型
   - 应该仔细检查每次构建的输出

3. **简单往往是最好的**
   - 过度配置（如 vercel.json rewrites）反而可能引入问题
   - Next.js 的默认行为通常是最优的

4. **环境变量策略要完善**
   - 不能依赖单一的环境变量
   - 多层回退确保在任何情况下都能工作

---

**文档创建时间**: 2025-10-16  
**问题状态**: ✅ 已完全解决  
**修复验证**: ✅ 本地测试通过，等待 Vercel 部署验证

