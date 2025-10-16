import { MetadataRoute } from "next"

/**
 * 动态生成站点地图
 * 自动生成 /sitemap.xml 路由，用于 SEO 优化
 */

// 强制动态生成，不在构建时静态化
export const dynamic = 'force-dynamic'

export default function sitemap(): MetadataRoute.Sitemap {
  // 从环境变量读取网站 URL，生产环境必须设置
  // 确保生产环境使用正确的域名
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://www.lumidreams.app")

  // 定义所有公开页面
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0, // 主页最高优先级
    },
    // 未来可以添加更多页面，例如：
    // {
    //   url: `${baseUrl}/about`,
    //   lastModified: new Date(),
    //   changeFrequency: "monthly",
    //   priority: 0.8,
    // },
    // {
    //   url: `${baseUrl}/privacy`,
    //   lastModified: new Date(),
    //   changeFrequency: "yearly",
    //   priority: 0.5,
    // },
    // {
    //   url: `${baseUrl}/terms`,
    //   lastModified: new Date(),
    //   changeFrequency: "yearly",
    //   priority: 0.5,
    // },
  ]

  return routes
}

