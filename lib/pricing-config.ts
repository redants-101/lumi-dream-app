/**
 * 产品定价配置
 * 集中管理订阅层级、价格和功能限制
 */

import { AI_MODELS } from "./ai-config"

// ===================================
// 订阅层级定义
// ===================================

export type SubscriptionTier = "free" | "basic" | "pro"

export type BillingCycle = "monthly" | "yearly"

// ===================================
// 定价配置
// ===================================

export const PRICING = {
  FREE: {
    tier: "free" as const,
    name: "Free",
    displayName: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "USD",
    
    // 功能限制
    limits: {
      monthlyInterpretations: 10,        // 每月解梦次数
      maxDreamLength: 500,              // 梦境描述最大字符数
      historyRetention: 0,              // 历史记录保留天数 (0=不保存)
      exportEnabled: false,             // 导出功能
      prioritySupport: false,           // 优先支持
    },
    
    // AI 模型配置
    aiModel: AI_MODELS.STANDARD,  // ⚠️ 策略变更：免费用户也用 Claude Haiku
    
    // 功能列表（用于展示）
    features: [
      "10 dream interpretations/month",
      "Up to 500 characters per dream",
      "Claude Haiku AI (warm & empathetic)",
      "Fast response speed",
    ],
    
    // 成本分析（每月每用户）
    costs: {
      ai: 0.0215,              // AI 模型成本 (10 次 × $0.00215)
      infrastructure: 0.02,     // 基础设施成本
      total: 0.0415,           // 总成本 ⚠️ 免费用户现在亏损
    },
  },
  
  BASIC: {
    tier: "basic" as const,
    name: "Basic",
    displayName: "Basic",
    monthlyPrice: 4.99,
    yearlyPrice: 49,            // 节省 $10.88 (18% OFF)
    currency: "USD",
    
    // 功能限制
    limits: {
      monthlyInterpretations: 50,
      maxDreamLength: 1000,
      historyRetention: 365,    // 1 年
      exportEnabled: true,
      prioritySupport: false,
    },
    
    // AI 模型配置
    aiModel: AI_MODELS.STANDARD,
    
    // 功能列表
    features: [
      "50 dream interpretations/month",
      "Up to 1,000 characters per dream",
      "Claude Haiku AI (warm & empathetic)",
      "Fast response",
      "Interpretation history saved",
      "Export to PDF/Text",
    ],
    
    // 成本分析
    costs: {
      ai: 0.1075,              // 50 次 × $0.00215
      infrastructure: 0.30,
      total: 0.41,
    },
    
    // 盈利分析
    profit: {
      monthly: 4.58,           // $4.99 - $0.41
      yearly: 3.67,            // $4.08 - $0.41 (年付月均)
      marginMonthly: 0.918,    // 91.8%
      marginYearly: 0.899,     // 89.9%
    },
  },
  
  PRO: {
    tier: "pro" as const,
    name: "Pro",
    displayName: "Pro",
    monthlyPrice: 9.99,
    yearlyPrice: 99,            // 节省 $20.88 (17% OFF)
    currency: "USD",
    
    // 功能限制
    limits: {
      monthlyInterpretations: 200,  // 软限制，超过后降级
      maxDreamLength: 2000,
      historyRetention: -1,     // 永久保存
      exportEnabled: true,
      prioritySupport: true,
    },
    
    // AI 模型配置
    aiModel: AI_MODELS.PREMIUM,
    fallbackModel: AI_MODELS.STANDARD,  // 超量后降级
    
    // 功能列表
    features: [
      "200 dream interpretations/month",
      "Up to 2,000 characters per dream",
      "Claude Sonnet AI (deepest empathy)",
      "Deep psychological insights",
      "Priority response speed",
      "Permanent history storage",
      "Advanced export features",
      "Dedicated email support",
    ],
    
    // 成本分析
    costs: {
      ai: 1.29,                // 200 次 × $0.00645
      infrastructure: 0.50,
      total: 1.79,
    },
    
    // 盈利分析
    profit: {
      monthly: 8.20,           // $9.99 - $1.79
      yearly: 6.46,            // $8.25 - $1.79
      marginMonthly: 0.821,    // 82.1%
      marginYearly: 0.783,     // 78.3%
    },
  },
} as const

// ===================================
// 辅助函数
// ===================================

/**
 * 获取指定层级的配置
 */
export function getPricingConfig(tier: SubscriptionTier) {
  const tierMap = {
    free: PRICING.FREE,
    basic: PRICING.BASIC,
    pro: PRICING.PRO,
  }
  
  return tierMap[tier] || PRICING.FREE
}

/**
 * 计算年付节省金额
 */
export function calculateYearlySavings(tier: SubscriptionTier): number {
  const config = getPricingConfig(tier)
  if (config.monthlyPrice === 0) return 0
  
  const monthlyTotal = config.monthlyPrice * 12
  const yearlySavings = monthlyTotal - config.yearlyPrice
  
  return parseFloat(yearlySavings.toFixed(2))
}

/**
 * 计算年付折扣百分比
 */
export function calculateYearlyDiscount(tier: SubscriptionTier): number {
  const config = getPricingConfig(tier)
  if (config.monthlyPrice === 0) return 0
  
  const savings = calculateYearlySavings(tier)
  const monthlyTotal = config.monthlyPrice * 12
  const discount = (savings / monthlyTotal) * 100
  
  return parseFloat(discount.toFixed(1))
}

/**
 * 获取显示价格（格式化）
 */
export function getFormattedPrice(
  tier: SubscriptionTier, 
  cycle: BillingCycle = "monthly"
): string {
  const config = getPricingConfig(tier)
  const price = cycle === "monthly" ? config.monthlyPrice : config.yearlyPrice
  
  if (price === 0) return "Free"
  
  return `$${price.toFixed(2)}`
}

/**
 * 获取月均价格（用于年付对比）
 */
export function getMonthlyEquivalent(tier: SubscriptionTier): number {
  const config = getPricingConfig(tier)
  if (config.yearlyPrice === 0) return 0
  
  return parseFloat((config.yearlyPrice / 12).toFixed(2))
}

/**
 * 检查用户是否可以使用某个功能
 */
export function hasFeature(
  tier: SubscriptionTier, 
  feature: keyof typeof PRICING.FREE.limits
): boolean {
  const config = getPricingConfig(tier)
  const limit = config.limits[feature]
  
  if (typeof limit === "boolean") return limit
  if (typeof limit === "number") return limit > 0
  
  return false
}

/**
 * 获取用户剩余次数
 */
export function getRemainingInterpretations(
  tier: SubscriptionTier,
  usedCount: number
): number {
  const config = getPricingConfig(tier)
  const limit = config.limits.monthlyInterpretations
  
  return Math.max(0, limit - usedCount)
}

/**
 * 检查是否应该降级模型（Pro 用户超量）
 */
export function shouldDowngradeModel(
  tier: SubscriptionTier,
  usedCount: number
): boolean {
  if (tier !== "pro") return false
  
  const config = getPricingConfig("pro")
  return usedCount >= config.limits.monthlyInterpretations
}

// ===================================
// Stripe 价格 ID 配置（生产环境使用）
// ===================================

export const STRIPE_PRICE_IDS = {
  BASIC_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID,
  BASIC_YEARLY: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID,
  PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
  PRO_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
} as const

// ===================================
// 定价展示数据（用于定价页面）
// ===================================

export const PRICING_PAGE_DATA = {
  tiers: [
    {
      ...PRICING.FREE,
      recommended: false,
      ctaText: "Get Started",
      ctaVariant: "outline" as const,
    },
    {
      ...PRICING.BASIC,
      recommended: true,  // 推荐标签
      ctaText: "Subscribe Now",
      ctaVariant: "default" as const,
      badge: "Most Popular",
    },
    {
      ...PRICING.PRO,
      recommended: false,
      ctaText: "Upgrade to Pro",
      ctaVariant: "default" as const,
      badge: "Best Experience",
    },
  ],
  
  // FAQ 数据
  faqs: [
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time. After cancellation, you can still use the service until the end of your current billing period."
    },
    {
      question: "What's your refund policy for annual plans?",
      answer: "We offer a 14-day money-back guarantee. After 14 days, we provide prorated refunds based on the remaining months."
    },
    {
      question: "Can I upgrade or downgrade my plan?",
      answer: "Yes. Upgrades take effect immediately. Downgrades will take effect at the start of your next billing cycle."
    },
    {
      question: "Does the free tier expire?",
      answer: "No. The free tier is available forever, with 10 interpretations automatically reset each month."
    },
    {
      question: "What happens if I exceed 200 interpretations on Pro?",
      answer: "After 200 interpretations, we'll automatically use the Basic tier's Claude Haiku model, ensuring you can continue using the service with slightly reduced quality."
    },
  ],
  
  // 对比表格
  comparisonFeatures: [
    {
      category: "使用限制",
      items: [
        { name: "每月解梦次数", free: "10 次", basic: "50 次", pro: "200 次" },
        { name: "梦境描述长度", free: "500 字符", basic: "1000 字符", pro: "2000 字符" },
      ]
    },
    {
      category: "AI 功能",
      items: [
        { name: "AI 模型", free: "Claude Haiku", basic: "Claude Haiku", pro: "Claude Sonnet" },
        { name: "响应速度", free: "标准", basic: "<1 秒", pro: "优先" },
        { name: "解析深度", free: "基础", basic: "深入", pro: "最深入" },
      ]
    },
    {
      category: "数据管理",
      items: [
        { name: "历史记录", free: "❌", basic: "✅ 1 年", pro: "✅ 永久" },
        { name: "导出功能", free: "❌", basic: "✅ PDF/Text", pro: "✅ PDF/JSON" },
      ]
    },
    {
      category: "客户支持",
      items: [
        { name: "邮件支持", free: "❌", basic: "✅", pro: "✅ 优先" },
        { name: "响应时间", free: "-", basic: "24 小时", pro: "12 小时" },
      ]
    },
  ],
}

// ===================================
// 类型导出
// ===================================

export type PricingConfig = typeof PRICING.FREE
export type PricingTier = typeof PRICING_PAGE_DATA.tiers[number]

