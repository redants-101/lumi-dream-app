-- 🔧 禁用触发器解决重复记录问题
-- 问题：数据库触发器和 Webhook 代码都在创建历史记录，导致重复
-- 解决：禁用触发器，只使用 Webhook 代码创建记录（更完整、更准确）

-- ===================================
-- 问题分析
-- ===================================

/*
当前系统有两个地方创建历史记录：

1. Webhook 代码（app/api/webhooks/creem/route.ts）
   ✅ 完整信息（amount, payment_id, metadata）
   ✅ 准确的事件类型判断
   ✅ 幂等性检查
   
2. 数据库触发器（record_subscription_change）
   ❌ 信息不完整（无 amount, 无 payment_id）
   ❌ 简单的 tier 对比判断
   ❌ 无幂等性检查

结果：两个都执行 → 产生重复记录
*/

-- ===================================
-- 解决方案：禁用触发器
-- ===================================

-- 1. 删除触发器（推荐）
DROP TRIGGER IF EXISTS on_subscription_change ON user_subscriptions;

-- 2. 删除触发器函数
DROP FUNCTION IF EXISTS record_subscription_change();

-- ===================================
-- 验证
-- ===================================

-- 查看是否还有触发器
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_subscriptions';

-- 预期：无结果（触发器已删除）

-- ===================================
-- 清理现有的重复记录
-- ===================================

-- 1. 查看当前用户的记录
SELECT 
  id,
  event_type,
  amount,
  creem_payment_id,
  description,
  DATE(event_date) as date
FROM subscription_history
WHERE user_id = '88dd0f65-b513-48c6-8c9a-e217147a2b6f'
ORDER BY event_date ASC;

-- 2. 删除没有 payment_id 的记录（触发器生成的）
DELETE FROM subscription_history
WHERE user_id = '88dd0f65-b513-48c6-8c9a-e217147a2b6f'
  AND creem_payment_id IS NULL
  AND amount IS NULL;

-- 返回：DELETE X（X = 删除的记录数）

-- 3. 或者精确删除第二条 Upgraded 记录
DELETE FROM subscription_history
WHERE id = 'f6f59e32-89a4-4c2b-9350-6b673a6f2c5d';

-- ===================================
-- 最终验证
-- ===================================

-- 查看清理后的记录
SELECT 
  ROW_NUMBER() OVER (ORDER BY event_date ASC) as "#",
  event_type,
  tier || ' ' || billing_cycle as plan,
  COALESCE('$' || amount::text, 'No amount') as amount,
  CASE 
    WHEN creem_payment_id IS NOT NULL THEN '✅ Has payment_id'
    ELSE '❌ No payment_id'
  END as payment_status,
  description,
  DATE(event_date) as date
FROM subscription_history
WHERE user_id = '88dd0f65-b513-48c6-8c9a-e217147a2b6f'
ORDER BY event_date ASC;

-- 预期：所有记录都有 payment_id 和 amount

-- 测试统计
SELECT 
  COUNT(*) as total_records,
  SUM(amount) as total_spent
FROM subscription_history
WHERE user_id = '88dd0f65-b513-48c6-8c9a-e217147a2b6f'
  AND status = 'completed';

-- ===================================
-- 说明
-- ===================================

/*
为什么禁用触发器？

1. Webhook 提供更完整的信息
   - 包含支付 ID（幂等性）
   - 包含金额
   - 包含元数据（旧订阅信息）

2. Webhook 有更准确的判断
   - 区分续费、换周期、升级
   - 有幂等性检查

3. 避免重复
   - 一个地方创建记录
   - 逻辑清晰
   - 易于维护

结论：
✅ 使用 Webhook 代码创建记录
❌ 禁用数据库触发器
*/

-- ===================================
-- 执行顺序
-- ===================================

/*
1. 删除触发器
2. 删除重复记录
3. 验证清理结果
4. 刷新 Dashboard
*/

