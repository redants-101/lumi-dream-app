# 🔍 Lumi SEO 和站点地图配置文档

本文档说明 Lumi 项目的 SEO 优化配置和动态站点地图的使用方法。

---

## 📋 目录

- [概述](#概述)
- [站点地图配置](#站点地图配置)
- [Robots.txt 配置](#robotstxt-配置)
- [Metadata 配置](#metadata-配置)
- [如何添加新页面](#如何添加新页面)
- [测试和验证](#测试和验证)
- [SEO 最佳实践](#seo-最佳实践)

---

## 🎯 概述

Lumi 项目使用 Next.js 15 的内置功能来生成动态的 sitemap 和 robots.txt，这些配置对搜索引擎优化（SEO）至关重要。

**已实现的 SEO 功能：**

- ✅ 动态 sitemap.xml 生成
- ✅ 动态 robots.txt 生成
- ✅ 完整的 Open Graph 元数据
- ✅ Twitter Card 配置
- ✅ 结构化的页面标题和描述
- ✅ SEO 友好的关键词配置

---

## 🗺️ 站点地图配置

### 文件位置

`app/sitemap.ts`

### 自动生成的 URL

- 开发环境：`http://localhost:3000/sitemap.xml`
- 生产环境：`https://your-domain.com/sitemap.xml`

### 当前包含的页面

| 页面路由     | 优先级 | 更新频率 | 说明            |
| ------------ | ------ | -------- | --------------- |
| `/` (主页) | 1.0    | weekly   | AI 解梦工具页面 |

### 代码结构

```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.lumidreams.app"
  
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

### 优先级说明

| 优先级值 | 适用页面类型               |
| -------- | -------------------------- |
| 1.0      | 主页、核心功能页           |
| 0.8      | 次要页面（关于、功能介绍） |
| 0.6      | 博客列表、分类页           |
| 0.5      | 法律条款、政策页面         |
| 0.4      | 博客文章                   |

### 更新频率说明

| 频率值  | 适用场景                 |
| ------- | ------------------------ |
| always  | 实时更新的内容           |
| hourly  | 每小时更新               |
| daily   | 每日更新（博客首页）     |
| weekly  | 每周更新（主页、产品页） |
| monthly | 每月更新（关于页面）     |
| yearly  | 年度更新（法律条款）     |
| never   | 归档内容                 |

---

## 🤖 Robots.txt 配置

### 文件位置

`app/robots.ts`

### 自动生成的 URL

- 开发环境：`http://localhost:3000/robots.txt`
- 生产环境：`https://your-domain.com/robots.txt`

### 当前配置

```typescript
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.lumidreams.app"
  
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

### 配置说明

- **允许访问**：所有页面（`/`）
- **禁止访问**：所有 API 路由（`/api/`）
- **Sitemap 链接**：指向动态生成的 sitemap.xml

---

## 📝 Metadata 配置

### 文件位置

`app/layout.tsx`

### 包含的 SEO 元素

#### 1. 基础元数据

```typescript
{
  title: {
    default: "Lumi - AI Dream Interpretation",
    template: "%s | Lumi", // 子页面标题格式
  },
  description: "Discover the hidden meanings...",
  keywords: ["dream interpretation", "AI dream analysis", ...]
}
```

#### 2. Open Graph (社交媒体分享)

```typescript
openGraph: {
  type: "website",
  locale: "en_US",
  url: "/",
  title: "Lumi - AI Dream Interpretation",
  description: "...",
  siteName: "Lumi",
  images: [{ url: "/logo/Lumi-Rectangles.png", ... }],
}
```

#### 3. Twitter Card

```typescript
twitter: {
  card: "summary_large_image",
  title: "Lumi - AI Dream Interpretation",
  description: "...",
  images: ["/logo/Lumi-Rectangles.png"],
  creator: "@lumidreams",
}
```

#### 4. 搜索引擎指令

```typescript
robots: {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
}
```

---

## ➕ 如何添加新页面

### 步骤 1: 创建页面文件

例如创建"关于"页面：

```bash
# 创建页面目录和文件
mkdir app/about
touch app/about/page.tsx
```

```typescript
// app/about/page.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us", // 自动使用模板: "About Us | Lumi"
  description: "Learn about Lumi's mission to illuminate your dreams",
}

export default function AboutPage() {
  return (
    <main>
      <h1>About Lumi</h1>
      {/* 页面内容 */}
    </main>
  )
}
```

### 步骤 2: 更新 Sitemap

编辑 `app/sitemap.ts`，添加新路由：

```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.lumidreams.app"

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    // ✅ 添加新页面
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]
}
```

### 步骤 3: 验证配置

```bash
# 启动开发服务器
npm run dev

# 访问以下 URL 验证
# - http://localhost:3000/about
# - http://localhost:3000/sitemap.xml
# - http://localhost:3000/robots.txt
```

---

## 🧪 测试和验证

### 本地测试

1. **启动开发服务器**

   ```bash
   npm run dev
   ```
2. **访问 Sitemap**

   ```
   http://localhost:3000/sitemap.xml
   ```

   应该看到 XML 格式的站点地图
3. **访问 Robots.txt**

   ```
   http://localhost:3000/robots.txt
   ```

   应该看到 robots 配置
4. **测试 Open Graph**
   使用 [OpenGraph Preview](https://www.opengraph.xyz/) 测试分享预览

### 生产环境验证

部署后，使用以下工具验证：

1. **Google Search Console**

   - 提交 sitemap: `https://your-domain.com/sitemap.xml`
   - 检查索引状态
   - 查看爬虫错误
2. **Rich Results Test**

   - URL: https://search.google.com/test/rich-results
   - 测试结构化数据
3. **PageSpeed Insights**

   - URL: https://pagespeed.web.dev/
   - 检查 SEO 得分
4. **Social Media Debuggers**

   - Facebook: https://developers.facebook.com/tools/debug/
   - Twitter: https://cards-dev.twitter.com/validator
   - LinkedIn: https://www.linkedin.com/post-inspector/

---

## 🚀 SEO 最佳实践

### 1. 内容优化

- ✅ 使用描述性的页面标题（50-60 字符）
- ✅ 编写独特的 meta description（150-160 字符）
- ✅ 包含相关关键词，但避免堆砌
- ✅ 使用语义化的 HTML 标签（h1, h2, article, nav）

### 2. 技术优化

- ✅ 确保所有页面都在 sitemap 中
- ✅ 设置合理的 robots.txt 规则
- ✅ 使用 HTTPS（生产环境）
- ✅ 优化页面加载速度
- ✅ 确保移动端友好

### 3. 图片优化

```typescript
// 使用 Next.js Image 组件
import Image from "next/image"

<Image 
  src="/logo/Lumi-Rectangles.png"
  alt="Lumi - AI Dream Interpretation Logo"
  width={1200}
  height={630}
  priority // 首屏重要图片
/>
```

### 4. 结构化数据（未来扩展）

可以添加 JSON-LD 结构化数据：

```typescript
// app/layout.tsx 或页面组件
export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Lumi",
    description: "AI-powered dream interpretation",
    url: "https://www.lumidreams.app",
    applicationCategory: "UtilitiesApplication",
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 页面内容 */}
    </>
  )
}
```

---

## 📊 监控和分析

### 已集成的分析工具

1. **Vercel Analytics**

   - 位置：`app/layout.tsx`
   - 自动追踪页面浏览
2. **Vercel Speed Insights**

   - 位置：`app/layout.tsx`
   - 监控性能指标

### 推荐的额外工具

- **Google Analytics 4**
- **Google Search Console**
- **Bing Webmaster Tools**
- **Ahrefs / SEMrush**（付费）

---

## 🔄 动态内容的 Sitemap

如果未来需要添加博客等动态内容：

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.lumidreams.app"
  
  // 静态页面
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
  ]
  
  // 动态获取博客文章
  // const posts = await fetchBlogPosts()
  // const postUrls = posts.map(post => ({
  //   url: `${baseUrl}/blog/${post.slug}`,
  //   lastModified: new Date(post.updatedAt),
  //   changeFrequency: "monthly" as const,
  //   priority: 0.6,
  // }))
  
  // return [...routes, ...postUrls]
  return routes
}
```

---

## 🌍 多语言 SEO（未来扩展）

如果未来需要支持多语言：

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  // ...
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en",
      "zh-CN": "/zh",
    },
  },
}
```

---

## ✅ 检查清单

部署前的 SEO 检查清单：

- [ ] `NEXT_PUBLIC_APP_URL` 环境变量已设置为生产域名
- [ ] Sitemap 包含所有公开页面
- [ ] Robots.txt 正确配置
- [ ] 所有页面都有唯一的 title 和 description
- [ ] Open Graph 图片已准备（1200x630px）
- [ ] Twitter Card 配置正确
- [ ] 页面加载速度优化
- [ ] 移动端响应式设计完成
- [ ] 已在 Google Search Console 提交 sitemap
- [ ] 已验证 robots.txt 无误

---

## 📚 参考资源

- [Next.js Metadata 文档](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js Sitemap 文档](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js Robots.txt 文档](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Google Search Central](https://developers.google.com/search/docs)
- [Schema.org](https://schema.org/)

---

## 🤝 贡献

如果发现 SEO 优化问题或有改进建议，请：

1. 查看此文档确认最佳实践
2. 测试提议的更改
3. 更新相关配置文件
4. 同步更新此文档

---

**最后更新**: 2025-10-16
**维护者**: Lumi Development Team
