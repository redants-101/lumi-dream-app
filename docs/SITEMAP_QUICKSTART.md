# 🗺️ Sitemap 快速使用指南

## ✅ 已完成配置

Lumi 项目已完成动态 sitemap 和 SEO 优化配置。

---

## 📁 新增文件

```
app/
├── sitemap.ts      ✅ 动态站点地图生成
├── robots.ts       ✅ 搜索引擎爬虫配置
└── layout.tsx      ✅ 优化后的 SEO 元数据

docs/
├── SEO_SITEMAP.md           ✅ 完整 SEO 文档
└── SITEMAP_QUICKSTART.md    ✅ 本文档
```

---

## 🔗 访问链接

### 开发环境
- 主页: http://localhost:3000
- Sitemap: http://localhost:3000/sitemap.xml
- Robots: http://localhost:3000/robots.txt

### 生产环境
- 主页: https://www.lumidreams.app
- Sitemap: https://www.lumidreams.app/sitemap.xml
- Robots: https://www.lumidreams.app/robots.txt

---

## 🧪 测试结果

### ✅ Sitemap.xml 测试成功

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>http://localhost:3000</loc>
    <lastmod>2025-10-16T04:13:09.346Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1</priority>
  </url>
</urlset>
```

### ✅ Robots.txt 测试成功

```
User-Agent: *
Allow: /
Disallow: /api/

Sitemap: http://localhost:3000/sitemap.xml
```

---

## 📊 当前站点地图

| 页面 | URL | 优先级 | 更新频率 |
|------|-----|--------|---------|
| 主页 | `/` | 1.0 | weekly |

---

## ➕ 如何添加新页面到 Sitemap

### 1️⃣ 创建页面

```bash
# 例如创建"关于"页面
mkdir app/about
```

```typescript
// app/about/page.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Lumi's mission",
}

export default function AboutPage() {
  return <main>About Content</main>
}
```

### 2️⃣ 更新 Sitemap

编辑 `app/sitemap.ts`：

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

### 3️⃣ 测试

```bash
# 访问新页面
http://localhost:3000/about

# 验证 sitemap 是否包含新页面
http://localhost:3000/sitemap.xml
```

---

## 🚀 生产环境部署

### 部署前检查清单

- [ ] 确认 `.env.local` 中设置了 `NEXT_PUBLIC_APP_URL`
- [ ] 验证所有页面都在 sitemap 中
- [ ] 测试 sitemap.xml 和 robots.txt 可访问
- [ ] 检查 Open Graph 图片是否存在

### 部署后操作

1. **提交 Sitemap 到 Google Search Console**
   - 访问: https://search.google.com/search-console
   - 添加网站
   - 提交 sitemap: `https://your-domain.com/sitemap.xml`

2. **提交到 Bing Webmaster Tools**
   - 访问: https://www.bing.com/webmasters
   - 添加网站
   - 提交 sitemap

3. **验证 Robots.txt**
   - 访问: `https://your-domain.com/robots.txt`
   - 确认内容正确

---

## 🎯 SEO 优化亮点

### ✅ 完整的 Metadata 配置

- **标题模板**: 自动为所有子页面添加 "| Lumi" 后缀
- **描述**: 包含核心关键词和价值主张
- **关键词**: 8 个精准 SEO 关键词
- **Open Graph**: 完整的社交媒体分享配置
- **Twitter Card**: 大图卡片配置
- **Canonical URL**: 防止重复内容

### ✅ 搜索引擎优化

- **robots.txt**: 允许主要页面，禁止 API 路由
- **sitemap.xml**: 自动生成，包含优先级和更新频率
- **结构化数据**: 为未来扩展预留

---

## 📈 下一步建议

### 短期（1-2 周）

1. 创建以下页面并添加到 sitemap：
   - `/about` - 关于页面
   - `/privacy` - 隐私政策
   - `/terms` - 服务条款

2. 添加 JSON-LD 结构化数据

3. 优化 Open Graph 图片（创建专用的 1200x630px 图片）

### 中期（1-2 月）

1. 添加博客功能，实现动态 sitemap
2. 集成 Google Analytics 4
3. 提交到主要搜索引擎

### 长期（3-6 月）

1. 多语言支持（en, zh）
2. 本地化 SEO
3. 内容营销策略

---

## 🔧 故障排除

### Sitemap 无法访问

```bash
# 确认开发服务器正在运行
npm run dev

# 检查端口是否被占用
netstat -ano | findstr :3000

# 清除 Next.js 缓存
rm -rf .next
npm run dev
```

### URL 显示错误的域名

```bash
# 检查环境变量
echo $NEXT_PUBLIC_APP_URL

# 确保 .env.local 文件存在且配置正确
cat .env.local
```

### 生产环境 Sitemap 不更新

```bash
# 重新构建
npm run build
npm run start

# 清除 CDN 缓存（如使用 Vercel）
vercel --prod
```

---

## 📚 相关文档

- [完整 SEO 文档](./SEO_SITEMAP.md) - 详细的 SEO 优化指南
- [项目状态](./PROJECT_STATUS.md) - 项目整体进度
- [环境变量配置](./ENV_SETUP.md) - 环境变量设置指南

---

## ✨ 总结

✅ **动态 Sitemap** - 自动生成，无需手动维护  
✅ **SEO 优化** - 完整的元数据和 Open Graph 配置  
✅ **搜索引擎友好** - Robots.txt 和优先级配置  
✅ **易于扩展** - 添加新页面只需 3 步  
✅ **已测试验证** - 本地环境测试通过  

**下一步**: 部署到生产环境后，在 Google Search Console 提交 sitemap！

---

**创建时间**: 2025-10-16  
**最后更新**: 2025-10-16  
**状态**: ✅ 完成并测试通过

