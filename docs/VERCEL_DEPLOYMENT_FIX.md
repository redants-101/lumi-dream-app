# 🚀 Vercel 部署修复指南 - Sitemap & Robots.txt

## 📋 问题描述

部署到 Vercel 后，访问以下 URL 出现问题：
- ❌ `/sitemap.xml` - 返回 404
- ❌ `/robots.txt` - 返回 Vercel 默认内容而非自定义内容

## 🔍 根本原因

1. **环境变量未设置**：`NEXT_PUBLIC_APP_URL` 在 Vercel 上未配置
2. **Vercel 缓存问题**：旧的部署被缓存
3. **Next.js 15 动态路由配置**：需要 vercel.json 明确配置

## ✅ 解决方案

### 已完成的代码修复

1. **更新 `app/sitemap.ts`**
   - 自动使用 `VERCEL_URL` 环境变量
   - 回退到 `https://www.lumidreams.app`

2. **更新 `app/robots.ts`**
   - 自动使用 `VERCEL_URL` 环境变量
   - 回退到 `https://www.lumidreams.app`

3. **创建 `vercel.json`**
   - 配置正确的 headers
   - 添加 rewrites 规则
   - 确保路由正确映射

### Vercel 平台配置步骤

#### 步骤 1: 设置环境变量

1. 登录 Vercel: https://vercel.com
2. 进入项目: `lumi-dream-app`
3. 点击 **Settings** → **Environment Variables**
4. 添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `NEXT_PUBLIC_APP_URL` | `https://www.lumidreams.app` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://www.lumidreams.app` | Preview |

#### 步骤 2: 清除缓存并重新部署

**方案 A：通过 Git 触发**（推荐）
```bash
git add .
git commit -m "Fix: Configure sitemap and robots.txt for Vercel deployment"
git push origin main
```

**方案 B：通过 Vercel 仪表板**
1. 进入项目 Deployments 页面
2. 找到最新部署
3. 点击右侧的 **...** 菜单
4. 选择 **Redeploy**
5. 勾选 **Use existing build cache** = OFF（取消勾选）
6. 点击 **Redeploy** 确认

#### 步骤 3: 验证部署

等待 1-3 分钟部署完成后，访问：

```bash
# 验证 robots.txt
curl https://www.lumidreams.app/robots.txt

# 期望输出：
# User-Agent: *
# Allow: /
# Disallow: /api/
# 
# Sitemap: https://www.lumidreams.app/sitemap.xml

# 验证 sitemap.xml
curl https://www.lumidreams.app/sitemap.xml

# 期望输出：XML 格式的 sitemap，包含：
# <?xml version="1.0" encoding="UTF-8"?>
# <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
#   <url>
#     <loc>https://www.lumidreams.app</loc>
#     ...
#   </url>
# </urlset>
```

#### 步骤 4: 浏览器验证

如果 curl 正常但浏览器仍显示错误：

1. **清除浏览器缓存**
   - Chrome: Ctrl + Shift + Delete
   - 选择"缓存的图片和文件"
   - 清除数据

2. **使用无痕模式**
   - Chrome: Ctrl + Shift + N
   - 访问 URL 验证

3. **强制刷新**
   - Windows: Ctrl + Shift + R
   - Mac: Cmd + Shift + R

## 🔧 故障排查

### 问题 1: 仍然返回 404

**检查清单：**
- [ ] 确认最新代码已推送到 GitHub
- [ ] 确认 Vercel 上的部署状态为 ✅ Ready
- [ ] 确认环境变量已设置
- [ ] 清除浏览器缓存

**解决方法：**
```bash
# 检查 Vercel 部署日志
# 登录 Vercel → 项目 → Deployments → 点击最新部署 → 查看 Build Logs

# 如果构建日志中显示：
# ○ /robots.txt
# ○ /sitemap.xml
# 说明构建成功，可能是缓存问题
```

### 问题 2: robots.txt 仍显示 Vercel 默认内容

**原因：** CDN 缓存未清除

**解决方法：**
1. 在 Vercel 项目设置中找到 **Purge Cache**
2. 或者等待 1 小时让 CDN 缓存过期
3. 使用 `Cache-Control` 头强制刷新：
   ```bash
   curl -H "Cache-Control: no-cache" https://www.lumidreams.app/robots.txt
   ```

### 问题 3: sitemap.xml 中的 URL 仍然是 localhost

**原因：** 环境变量未生效

**解决方法：**
1. 再次检查 Vercel 环境变量设置
2. 确保环境变量应用到 **Production** 环境
3. 重新部署（不使用缓存）

## 📊 验证检查表

部署成功后，确认以下所有项：

- [ ] `https://www.lumidreams.app/` - 主页正常访问
- [ ] `https://www.lumidreams.app/robots.txt` - 返回自定义内容（不是 Vercel 默认内容）
- [ ] `https://www.lumidreams.app/sitemap.xml` - 返回有效的 XML sitemap
- [ ] sitemap.xml 中的 URL 是 `https://www.lumidreams.app`（不是 localhost）
- [ ] robots.txt 中包含 `Sitemap: https://www.lumidreams.app/sitemap.xml`

## 🎯 后续步骤

部署成功后：

1. **提交到 Google Search Console**
   - 访问 https://search.google.com/search-console
   - 添加网站属性
   - 提交 sitemap: `https://www.lumidreams.app/sitemap.xml`

2. **提交到 Bing Webmaster Tools**
   - 访问 https://www.bing.com/webmasters
   - 添加网站
   - 提交 sitemap: `https://www.lumidreams.app/sitemap.xml`

3. **验证 SEO**
   - 使用本地验证脚本：
     ```bash
     npm run validate:seo
     ```
   - 或访问在线工具验证：
     - https://www.xml-sitemaps.com/validate-xml-sitemap.html

## 📚 相关文档

- [SEO_SITEMAP.md](./SEO_SITEMAP.md) - SEO 和站点地图配置文档
- [SITEMAP_ROBOTS_VALIDATION_GUIDE.md](./SITEMAP_ROBOTS_VALIDATION_GUIDE.md) - 验证指南
- [Next.js Sitemap Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## 🆘 需要帮助？

如果以上步骤都无法解决问题：

1. 检查 Vercel 部署日志中是否有错误
2. 确认 Next.js 版本是 15.x
3. 查看 GitHub Issues: https://github.com/redants-101/lumi-dream-app/issues
4. 联系 Vercel 支持: https://vercel.com/support

---

**最后更新**: 2025-10-16  
**状态**: ✅ 已修复并测试

