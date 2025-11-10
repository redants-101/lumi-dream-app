-- 🔧 Total Spent 计算修复
-- 问题：首次购买（subscription_created）未被统计
-- 修复：更新 SQL 函数，包含所有支付事件类型

-- ===================================
-- 修复 get_user_total_spent 函数
-- ===================================

CREATE OR REPLACE FUNCTION get_user_total_spent(p_user_id UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  total DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total
  FROM subscription_history
  WHERE user_id = p_user_id
    -- ✅ 包含所有支付相关的事件类型
    AND event_type IN (
      'subscription_created',      -- ✅ 首次购买
      'subscription_renewed',      -- ✅ 续费
      'subscription_upgraded',     -- ✅ 升级
      'subscription_downgraded',   -- ✅ 降级
      'subscription_cycle_changed',-- ✅ 换周期
      'payment_succeeded'          -- ✅ 支付成功（通用）
    )
    AND status = 'completed'       -- 只统计已完成的
    AND amount > 0;                -- 只统计有金额的
  
  RETURN total;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ===================================
-- 验证修复
-- ===================================

-- 测试查询
-- SELECT get_user_total_spent('88dd0f65-b513-48c6-8c9a-e217147a2b6f');
-- 预期：4.99（不是 0）

-- 查看用户的历史记录
-- SELECT event_type, amount, status FROM subscription_history 
-- WHERE user_id = '88dd0f65-b513-48c6-8c9a-e217147a2b6f';

-- ===================================
-- 说明
-- ===================================

/*
修复前：
只统计 payment_succeeded 和 subscription_renewed
→ 首次购买（subscription_created）不计入
→ Total Spent = 0 ❌

修复后：
统计所有支付事件：
- subscription_created（首次购买）✅
- subscription_renewed（续费）✅
- subscription_upgraded（升级）✅
- subscription_downgraded（降级）✅
- subscription_cycle_changed（换周期）✅
- payment_succeeded（通用支付）✅

→ Total Spent = 正确金额 ✅
*/

