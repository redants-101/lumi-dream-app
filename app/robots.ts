import { MetadataRoute } from "next"

/**
 * 动态生成 robots.txt
 * 告诉搜索引擎爬虫哪些页面可以访问
 */

// 强制动态生成，不在构建时静态化
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  // 从环境变量读取网站 URL
  // 确保生产环境使用正确的域名
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://www.lumidreams.app")

  return {
    rules: [
      {
        userAgent: "*", // 所有搜索引擎
        allow: "/", // 允许访问所有页面
        disallow: [
          "/api/", // 禁止爬取 API 路由
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`, // 指向 sitemap 位置
  }
}

