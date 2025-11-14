## 目标与范围
- 补齐 Creem 审核必须项：Terms of Service、客服邮箱可达性、价格与政策展示一致性
- 不变更业务模型与支付流程，仅完善合规页面、邮件与链接展示
- 严守禁止类目与合规审核标准，避免在非生产环境暴露生产域名

## 具体改动
1. 新增 Terms of Service 页面
- 路由：`app/terms/page.tsx`
- 结构：
  - Introduction（服务简介与适用性）
  - Subscription & Billing（订阅与计费规则、自动续费）
  - Cancellations & Refunds（取消与退款政策，含 14-day money-back 说明）
  - Chargebacks & Disputes（拒付与争议处理流程）
  - Acceptable Use（合规使用与禁止行为，承诺不涉及 Creem 禁止清单）
  - Intellectual Property（内容与商标权利）
  - Limitation of Liability（责任限制与免责声明）
  - Contact（客服邮箱 `support@lumidreams.app` 与网站）
- 样式与语气参考：`app/privacy/page.tsx`

2. 更新定价与成功页面的政策展示
- 在 `app/pricing/page.tsx` 页脚新增到 `/terms` 的链接；保证 `/privacy` 与 `/terms` 同时可见
- 在 `app/pricing/success/page.tsx` 的提示区加入“退款/取消说明”文案，链接到 `/terms`

3. 邮件模板与发件配置
- 在订阅确认邮件与续费失败邮件页脚添加：`Privacy Policy` 与 `Terms of Service` 链接，以及客服邮箱（`support@lumidreams.app`）
  - 位置参考：`components/emails/renewal-reminder.tsx`、`components/emails/renewal-failed.tsx`
- 通过环境变量注入支持邮箱：`SUPPORT_EMAIL`（生产由 Vercel 环境变量提供），`RESEND_FROM_EMAIL` 保持现有默认值
- 邮件服务读取并回退策略：优先 `SUPPORT_EMAIL` → 回退 `privacy@lumidreams.app`

4. 环境变量与校验
- Vercel 三套环境：
  - Development：示例值
  - Preview：示例或临时值（禁止生产域名进入 APP_URL）
  - Production：正式域名与正式密钥
- 新增校验：在现有 `scripts/check-env.js` 基础上增加 `SUPPORT_EMAIL` 检查（仅提示，生产必须）
- 继续使用现有的 `validate:config` 与域名隔离守卫，避免生产域名在非生产环境使用

5. SEO 与可见性
- 新增 `/terms` 页面后，`next-sitemap` 构建会自动包含路由；生产环境生成 sitemap/robots
- 开发/预览环境维持静态 `public/robots.txt` 与 `public/sitemap.xml`，避免把临时域名写入搜索引擎
- 使用 `scripts/validate-seo.js` 校验 `/robots.txt` 与 `/sitemap.xml` 的可用性

6. 申请材料打包（不创建仓库文档，先以交付文本提供）
- 商业主体与产品基本信息（名称、URL、描述）
- 产品类型：SaaS（数字服务，非实物）
- 政策链接：`/privacy` 与 `/terms`
- 客服邮箱：`support@lumidreams.app`（可达性说明）
- 价格展示：`/pricing`（截图与文字说明）
- 合规声明：不涉及 Creem 禁止清单中的任何内容；用途为自我探索与娱乐
- 风控说明：
  - Webhook 签名校验与幂等处理（避免重复事件）
  - 升级/降级自动取消旧订阅（防双重续费）
  - 失败降级与邮件通知

## 验证与发布
- 本地：
  - 设置 `SUPPORT_EMAIL`（开发示例）
  - 运行 `pnpm validate:config`、`node scripts/check-env.js`
  - 启动后访问 `/terms`、`/pricing`、`/pricing/success`
  - 执行 `pnpm validate:seo` 校验 SEO 文件
- Vercel：
  - 配置 Development/Preview/Production 三套环境变量（含 `SUPPORT_EMAIL`）
  - 生产构建生成 sitemap/robots，预览/开发不生成或使用固定生产域名

## 时间规划
- Day 1：实现 `/terms` 与页面链接调整；邮件模板页脚补齐
- Day 2：环境变量校验与 SEO 验证；整理申请材料文本并提交审核

## 依据（Creem 文档）
- Prohibited Products：确认产品类型为 SaaS，非禁止类目
- Account Reviews：
  - Privacy Policy & Terms of Service 必需
  - Product visibility 与 Pricing display 明确
  - Reachable customer support email 必需
  - 合规声明与风控监控（避免欺诈与高风险）

请确认以上方案，我将按该计划开始实施并提交改动。