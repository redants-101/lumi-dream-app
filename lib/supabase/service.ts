/**
 * Supabase 服务端客户端（使用 Service Role Key）
 * 专门用于 Webhook 和需要绕过 RLS 的服务端操作
 * 
 * ⚠️ 注意：此客户端拥有超级管理员权限，仅在服务端使用
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * 创建具有 Service Role 权限的 Supabase 客户端
 * 用于 Webhook 处理和其他需要绕过 RLS 的服务端操作
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase environment variables")
    console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅" : "❌")
    console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✅" : "❌")
    throw new Error("Missing Supabase Service Role configuration")
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

