-- 🔧 一键清理和修复订阅历史数据
-- 用户：88dd0f65-b513-48c6-8c9a-e217147a2b6f (838493503@qq.com)
-- 执行位置：Supabase SQL Editor

-- ===================================
-- 步骤 1：查看当前所有记录
-- ===================================

SELECT 
  id,
  event_type,
  tier,
  billing_cycle,
  amount,
  description,
  creem_payment_id,
  DATE(event_date) as date,
  event_date
FROM subscription_history
WHERE user_id = '88dd0f65-b513-48c6-8c9a-e217147a2b6f'
ORDER BY event_date ASC;

-- ===================================
-- 步骤 2：删除重复记录（基于 payment_id）
-- ===================================

-- 2.1 查看哪些记录是重复的
WITH duplicates AS (
  SELECT 
    id,
    event_type,
    creem_payment_id,
    event_date,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, creem_payment_id 
      ORDER BY event_date ASC  -- 保留最早的
    ) as rn
  FROM subscription_history
  WHERE user_id = '88dd0f65-b513-48c6-8c9a-e217147a2b6f'
    AND creem_payment_id IS NOT NULL
)
SELECT 
  id,
  event_type,
  creem_payment_id,
  event_date,
  rn,
  CASE WHEN rn > 1 THEN '❌ 将被删除' ELSE '✅ 保留' END as action
FROM duplicates
ORDER BY creem_payment_id, event_date;

-- 2.2 执行删除（删除 rn > 1 的记录）
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, creem_payment_id 
      ORDER BY event_date ASC
    ) as rn
  FROM subscription_history
  WHERE user_id = '88dd0f65-b513-48c6-8c9a-e217147a2b6f'
    AND creem_payment_id IS NOT NULL
)
DELETE FROM subscription_history
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 返回：DELETE X（X = 删除的记录数）

-- ===================================
-- 步骤 3：验证清理结果
-- ===================================

-- 3.1 查看清理后的记录
SELECT 
  event_type,
  tier || ' ' || billing_cycle as plan,
  amount,
  description,
  DATE(event_date) as date
FROM subscription_history
WHERE user_id = '88dd0f65-b513-48c6-8c9a-e217147a2b6f'
ORDER BY event_date ASC;

-- 3.2 验证统计
SELECT 
  COUNT(*) as total_records,
  SUM(CASE WHEN event_type = 'subscription_created' THEN 1 ELSE 0 END) as created_count,
  SUM(CASE WHEN event_type = 'subscription_renewed' THEN 1 ELSE 0 END) as renewed_count,
  SUM(CASE WHEN event_type = 'subscription_cycle_changed' THEN 1 ELSE 0 END) as cycle_changed_count,
  SUM(CASE WHEN event_type = 'subscription_upgraded' THEN 1 ELSE 0 END) as upgraded_count,
  SUM(amount) as total_spent
FROM subscription_history
WHERE user_id = '88dd0f65-b513-48c6-8c9a-e217147a2b6f'
  AND status = 'completed';

-- 预期结果：
-- total_records: 3
-- created_count: 1 (首次购买 Basic Monthly)
-- cycle_changed_count: 1 (换到 Basic Yearly) 或 renewed_count: 1（如果是旧数据）
-- upgraded_count: 1 (升级到 Pro Yearly)
-- total_spent: 152.99

-- ===================================
-- 步骤 4：修正错误的事件类型（可选）
-- ===================================

-- 4.1 查找可能被误判为 renewal 的换周期记录
SELECT 
  id,
  event_type,
  tier,
  billing_cycle,
  description,
  metadata::json->'old_billing_cycle' as old_cycle
FROM subscription_history
WHERE user_id = '88dd0f65-b513-48c6-8c9a-e217147a2b6f'
  AND event_type = 'subscription_renewed'
  AND tier = 'basic';

-- 如果发现是换周期但被记录为 renewed，手动修正：
-- （只有当 old_cycle 和当前 cycle 不同时）

/*
UPDATE subscription_history
SET 
  event_type = 'subscription_cycle_changed',
  description = 'Changed basic from monthly to yearly'
WHERE id = 'record-id-to-fix'
  AND event_type = 'subscription_renewed';
*/

-- ===================================
-- 步骤 5：最终验证
-- ===================================

-- 5.1 测试 Total Spent 函数
SELECT get_user_total_spent('88dd0f65-b513-48c6-8c9a-e217147a2b6f');
-- 预期：152.99

-- 5.2 测试 Renewal Count 函数
SELECT get_user_renewal_count('88dd0f65-b513-48c6-8c9a-e217147a2b6f');
-- 预期：1（如果有 1 次续费）或 0

-- 5.3 查看最终清理后的完整历史
SELECT 
  ROW_NUMBER() OVER (ORDER BY event_date ASC) as "#",
  event_type,
  tier || ' ' || billing_cycle as plan,
  '$' || amount as amount,
  description,
  DATE(event_date) as date
FROM subscription_history
WHERE user_id = '88dd0f65-b513-48c6-8c9a-e217147a2b6f'
ORDER BY event_date ASC;

-- ===================================
-- 完成！刷新 Dashboard 查看效果
-- ===================================

