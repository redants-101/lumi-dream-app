# 测试 Webhook 邮件发送功能
# 用法：.\scripts\test-webhook-email.ps1

Write-Host "🧪 测试 Webhook 邮件发送功能" -ForegroundColor Cyan
Write-Host ""

# 检查服务器是否运行
$port = 3000
$connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

if (-not $connection) {
    Write-Host "❌ 错误：开发服务器未运行" -ForegroundColor Red
    Write-Host "请先启动服务器：pnpm dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 服务器正在运行（端口 $port）" -ForegroundColor Green
Write-Host ""

Write-Host "📝 测试说明：" -ForegroundColor Yellow
Write-Host "1. 此脚本无法模拟真实的 Webhook（需要签名验证）"
Write-Host "2. 推荐使用以下方法测试："
Write-Host ""
Write-Host "方法 1：完整购买流程" -ForegroundColor Cyan
Write-Host "  - 访问 http://localhost:3000/pricing"
Write-Host "  - 完成支付流程"
Write-Host "  - 观察终端日志"
Write-Host ""
Write-Host "方法 2：手动重发 Webhook" -ForegroundColor Cyan
Write-Host "  - 访问 Creem Dashboard: https://creem.io/dashboard"
Write-Host "  - 找到 Webhooks 页面"
Write-Host "  - 重发最近的 checkout.completed 事件"
Write-Host ""
Write-Host "📊 预期日志（关键标记）：" -ForegroundColor Green
Write-Host "  ✅ [Webhook] Querying user info for confirmation email..."
Write-Host "  ✅ [Webhook] Sending confirmation email to: user@email.com"
Write-Host "  ✅ [Webhook] Confirmation email sent successfully"
Write-Host ""
Write-Host "📧 验证邮件发送：" -ForegroundColor Green
Write-Host "  - 访问 Resend Dashboard: https://resend.com/emails"
Write-Host "  - 查看最新发送的邮件"
Write-Host "  - 邮件主题：🎉 Welcome to Lumi Basic/Pro!"
Write-Host ""

