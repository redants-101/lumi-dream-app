#!/usr/bin/env node

/**
 * SEO 文件验证脚本
 * 自动验证 robots.txt 和 sitemap.xml 的格式和内容
 * 
 * 使用方法:
 *   node scripts/validate-seo.js
 * 
 * 或添加到 package.json:
 *   "scripts": {
 *     "validate:seo": "node scripts/validate-seo.js"
 *   }
 */

const http = require('http');

// 配置
const BASE_URL = process.env.VALIDATE_URL || 'http://localhost:3001';
const TIMEOUT = 5000; // 5秒超时

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP 请求封装
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('请求超时'));
    }, TIMEOUT);

    http.get(url, (res) => {
      clearTimeout(timeout);
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ data, statusCode: res.statusCode, headers: res.headers }));
    }).on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// 验证 robots.txt
async function validateRobots() {
  log('\n📄 Robots.txt 验证:', 'cyan');
  log('─'.repeat(60));
  
  try {
    const { data, statusCode, headers } = await httpGet(`${BASE_URL}/robots.txt`);
    
    const checks = [
      { 
        name: 'HTTP 状态码 200', 
        pass: statusCode === 200,
        actual: `状态码: ${statusCode}`
      },
      { 
        name: 'Content-Type 正确', 
        pass: headers['content-type']?.includes('text/plain') || headers['content-type']?.includes('text'),
        actual: `Content-Type: ${headers['content-type']}`
      },
      { 
        name: 'User-Agent 指令存在', 
        pass: data.includes('User-Agent:'),
        actual: data.includes('User-Agent:') ? '✓ 找到' : '✗ 未找到'
      },
      { 
        name: 'Allow 指令存在', 
        pass: data.includes('Allow:'),
        actual: data.includes('Allow:') ? '✓ 找到' : '✗ 未找到'
      },
      { 
        name: 'Disallow 指令存在', 
        pass: data.includes('Disallow:'),
        actual: data.includes('Disallow:') ? '✓ 找到' : '✗ 未找到'
      },
      { 
        name: 'API 路由被禁止', 
        pass: data.includes('Disallow: /api/'),
        actual: data.includes('Disallow: /api/') ? '✓ /api/ 已禁止' : '✗ /api/ 未禁止'
      },
      { 
        name: 'Sitemap 引用存在', 
        pass: data.includes('Sitemap:'),
        actual: data.includes('Sitemap:') ? '✓ 找到' : '✗ 未找到'
      },
      { 
        name: 'Sitemap URL 格式正确', 
        pass: /Sitemap:\s*https?:\/\/.+\/sitemap\.xml/.test(data),
        actual: data.match(/Sitemap:\s*(.+)/)?.[1] || '未找到'
      },
    ];
    
    let passCount = 0;
    checks.forEach(check => {
      const symbol = check.pass ? '✅' : '❌';
      const color = check.pass ? 'green' : 'red';
      log(`${symbol} ${check.name}`, color);
      if (!check.pass) {
        log(`   └─ ${check.actual}`, 'yellow');
      }
      if (check.pass) passCount++;
    });
    
    log(`\n📊 通过率: ${passCount}/${checks.length} (${Math.round(passCount/checks.length*100)}%)`, 
        passCount === checks.length ? 'green' : 'yellow');
    
    // 显示内容预览
    log('\n📄 内容预览:', 'blue');
    log('─'.repeat(60));
    log(data.split('\n').slice(0, 10).join('\n'), 'reset');
    if (data.split('\n').length > 10) {
      log('...', 'reset');
    }
    
    return passCount === checks.length;
  } catch (error) {
    log(`❌ 验证失败: ${error.message}`, 'red');
    return false;
  }
}

// 验证 sitemap.xml
async function validateSitemap() {
  log('\n\n🗺️  Sitemap.xml 验证:', 'cyan');
  log('─'.repeat(60));
  
  try {
    const { data, statusCode, headers } = await httpGet(`${BASE_URL}/sitemap.xml`);
    
    // 统计信息
    const urlCount = (data.match(/<url>/g) || []).length;
    const locCount = (data.match(/<loc>/g) || []).length;
    const urls = [...data.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    
    const checks = [
      { 
        name: 'HTTP 状态码 200', 
        pass: statusCode === 200,
        actual: `状态码: ${statusCode}`
      },
      { 
        name: 'Content-Type 为 XML', 
        pass: headers['content-type']?.includes('xml'),
        actual: `Content-Type: ${headers['content-type']}`
      },
      { 
        name: 'XML 声明存在', 
        pass: data.includes('<?xml version="1.0"'),
        actual: data.includes('<?xml version="1.0"') ? '✓ 找到' : '✗ 未找到'
      },
      { 
        name: '编码为 UTF-8', 
        pass: data.includes('encoding="UTF-8"'),
        actual: data.includes('encoding="UTF-8"') ? '✓ UTF-8' : '✗ 非 UTF-8'
      },
      { 
        name: 'urlset 根元素存在', 
        pass: data.includes('<urlset'),
        actual: data.includes('<urlset') ? '✓ 找到' : '✗ 未找到'
      },
      { 
        name: '命名空间正确', 
        pass: data.includes('http://www.sitemaps.org/schemas/sitemap/0.9'),
        actual: data.includes('http://www.sitemaps.org/schemas/sitemap/0.9') ? '✓ 正确' : '✗ 错误'
      },
      { 
        name: '包含 URL 条目', 
        pass: urlCount > 0,
        actual: `${urlCount} 个 URL`
      },
      { 
        name: 'URL 和 loc 数量匹配', 
        pass: urlCount === locCount,
        actual: `URL: ${urlCount}, loc: ${locCount}`
      },
      { 
        name: 'lastmod 存在', 
        pass: data.includes('<lastmod>'),
        actual: data.includes('<lastmod>') ? '✓ 找到' : '✗ 未找到'
      },
      { 
        name: 'changefreq 存在', 
        pass: data.includes('<changefreq>'),
        actual: data.includes('<changefreq>') ? '✓ 找到' : '✗ 未找到'
      },
      { 
        name: 'priority 存在', 
        pass: data.includes('<priority>'),
        actual: data.includes('<priority>') ? '✓ 找到' : '✗ 未找到'
      },
      { 
        name: 'URL 使用绝对路径', 
        pass: urls.every(url => url.startsWith('http://') || url.startsWith('https://')),
        actual: urls.every(url => url.startsWith('http://') || url.startsWith('https://')) 
          ? '✓ 所有 URL 都是绝对路径' 
          : '✗ 存在相对路径'
      },
      { 
        name: 'XML 基本格式正确', 
        pass: data.includes('</urlset>') && !data.includes('<<') && !data.includes('>>'),
        actual: data.includes('</urlset>') ? '✓ 格式正确' : '✗ 格式错误'
      },
    ];
    
    let passCount = 0;
    checks.forEach(check => {
      const symbol = check.pass ? '✅' : '❌';
      const color = check.pass ? 'green' : 'red';
      log(`${symbol} ${check.name}`, color);
      if (!check.pass) {
        log(`   └─ ${check.actual}`, 'yellow');
      }
      if (check.pass) passCount++;
    });
    
    log(`\n📊 通过率: ${passCount}/${checks.length} (${Math.round(passCount/checks.length*100)}%)`, 
        passCount === checks.length ? 'green' : 'yellow');
    
    // URL 统计
    log(`\n📊 URL 统计:`, 'blue');
    log('─'.repeat(60));
    log(`总数: ${urlCount}`, 'reset');
    
    if (urls.length > 0) {
      log('\n🔗 包含的 URL:', 'blue');
      urls.forEach((url, i) => {
        log(`  ${i + 1}. ${url}`, 'reset');
      });
    }
    
    // 检查 changefreq 值
    const changefreqs = [...data.matchAll(/<changefreq>([^<]+)<\/changefreq>/g)].map(m => m[1]);
    const validFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
    const invalidFreqs = changefreqs.filter(f => !validFreqs.includes(f));
    
    if (invalidFreqs.length > 0) {
      log(`\n⚠️  无效的 changefreq 值: ${invalidFreqs.join(', ')}`, 'yellow');
      log(`   有效值: ${validFreqs.join(', ')}`, 'yellow');
    }
    
    // 检查 priority 值
    const priorities = [...data.matchAll(/<priority>([^<]+)<\/priority>/g)].map(m => parseFloat(m[1]));
    const invalidPriorities = priorities.filter(p => isNaN(p) || p < 0 || p > 1);
    
    if (invalidPriorities.length > 0) {
      log(`\n⚠️  无效的 priority 值: ${invalidPriorities.join(', ')}`, 'yellow');
      log(`   有效范围: 0.0 - 1.0`, 'yellow');
    }
    
    return passCount === checks.length;
  } catch (error) {
    log(`❌ 验证失败: ${error.message}`, 'red');
    return false;
  }
}

// 主函数
async function main() {
  log('═'.repeat(60), 'cyan');
  log('🚀 Lumi SEO 文件验证工具', 'cyan');
  log('═'.repeat(60), 'cyan');
  log(`\n📍 目标 URL: ${BASE_URL}`, 'blue');
  log(`⏱️  超时设置: ${TIMEOUT}ms`, 'blue');
  
  try {
    // 先测试服务器是否可访问
    log('\n🔍 检查服务器状态...', 'blue');
    await httpGet(BASE_URL);
    log('✅ 服务器正在运行', 'green');
    
    // 验证 robots.txt
    const robotsOk = await validateRobots();
    
    // 验证 sitemap.xml
    const sitemapOk = await validateSitemap();
    
    // 总结
    log('\n\n' + '═'.repeat(60), 'cyan');
    log('📋 验证总结', 'cyan');
    log('═'.repeat(60), 'cyan');
    
    log(`\n📄 Robots.txt: ${robotsOk ? '✅ 通过' : '❌ 失败'}`, robotsOk ? 'green' : 'red');
    log(`🗺️  Sitemap.xml: ${sitemapOk ? '✅ 通过' : '❌ 失败'}`, sitemapOk ? 'green' : 'red');
    
    if (robotsOk && sitemapOk) {
      log('\n🎉 所有验证通过！SEO 配置正确！', 'green');
      log('\n📝 下一步:', 'blue');
      log('  1. 部署到生产环境', 'reset');
      log('  2. 访问 https://www.lumidreams.app/robots.txt', 'reset');
      log('  3. 访问 https://www.lumidreams.app/sitemap.xml', 'reset');
      log('  4. 提交到 Google Search Console', 'reset');
      log('  5. 提交到 Bing Webmaster Tools', 'reset');
      process.exit(0);
    } else {
      log('\n⚠️  部分验证失败，请检查上述错误项目', 'yellow');
      log('\n💡 提示:', 'blue');
      log('  • 确保开发服务器正在运行: npm run dev', 'reset');
      log('  • 检查文件: app/sitemap.ts 和 app/robots.ts', 'reset');
      log('  • 清除缓存后重试: rm -rf .next && npm run dev', 'reset');
      log('  • 查看完整文档: docs/SITEMAP_ROBOTS_VALIDATION_GUIDE.md', 'reset');
      process.exit(1);
    }
  } catch (error) {
    log('\n\n❌ 验证过程出错:', 'red');
    log(`   ${error.message}`, 'red');
    log('\n💡 可能的原因:', 'yellow');
    log('  • 开发服务器未运行', 'reset');
    log('  • 端口不正确（当前默认: 3001）', 'reset');
    log('  • 网络连接问题', 'reset');
    log('\n🔧 解决方案:', 'blue');
    log('  1. 运行: npm run dev', 'reset');
    log('  2. 确认端口号并重试: VALIDATE_URL=http://localhost:YOUR_PORT node scripts/validate-seo.js', 'reset');
    process.exit(1);
  }
}

// 捕获未处理的错误
process.on('unhandledRejection', (error) => {
  log(`\n❌ 未处理的错误: ${error.message}`, 'red');
  process.exit(1);
});

// 运行
if (require.main === module) {
  main();
}

module.exports = { validateRobots, validateSitemap };


