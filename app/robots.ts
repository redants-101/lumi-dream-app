import { MetadataRoute } from "next"

/**
 * 动态生成 robots.txt
 * 告诉搜索引擎爬虫哪些页面可以访问
 */
export default function robots(): MetadataRoute.Robots {
  // 从环境变量读取网站 URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.lumidreams.app"

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

