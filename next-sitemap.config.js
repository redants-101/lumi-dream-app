/**
 * next-sitemap 配置
 * 自动生成 robots.txt 与 sitemap.xml
 * https://github.com/iamvishnusankar/next-sitemap
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lumidreams.app';

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl,                          // 站点主域名
  generateRobotsTxt: true,          // 同时生成 robots.txt
  generateIndexSitemap: false,     // 不生成索引级 sitemap
  changefreq: 'daily',              // 默认更新频率
  priority: 0.7,                    // 默认优先级
  exclude: ['/api/*', '/_next/*', '/admin/*', '/404'], // 排除规则
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/admin/'],
      },
    ],
    additionalSitemaps: [`${siteUrl}/sitemap.xml`],
  },
  // 如需手动追加额外路由，可在这里写 transform 函数
  // transform: async (config, path) => { /* ... */ },
};