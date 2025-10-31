# 🚨 Vercel 部署故障排除指南

## 当前问题：部署输出阶段失败

### 错误信息
```
Deploying outputs...
An unexpected error happened when running this build.
```

---

## 🎯 解决方案（按顺序尝试）

### 方案 1：立即重新部署 ⚡（推荐）

**原因**：这通常是 Vercel 平台的临时问题（网络波动、服务器忙碌等）

**操作步骤**：

1. **访问 Vercel Dashboard**  
   https://vercel.com/dashboard

2. **找到失败的部署**  
   - 进入你的项目
   - 点击 "Deployments" 标签
   - 找到标记为 "Failed" 的部署

3. **重新部署**  
   - 点击失败部署右侧的 **"⋯"** 菜单
   - 选择 **"Redeploy"**
   - 等待 1-2 分钟

**成功率**：90%

---

### 方案 2：推送新提交触发部署

如果方案 1 不行，创建一个空提交触发新部署：

```bash
# 在项目根目录执行
git commit --allow-empty -m "触发 Vercel 重新部署"
git push origin main
```

Vercel 会自动检测到新提交并开始部署。

---

### 方案 3：检查 Vercel 配置

#### 3.1 验证环境变量（必需）

在 Vercel Dashboard 中检查：

**Settings** → **Environment Variables**

必需的环境变量：

| 变量名 | 示例值 | 环境 |
|--------|--------|------|
| `OPENROUTER_API_KEY` | `sk-or-v1-xxxxxxxxxx` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Production, Preview, Development |

#### 3.2 验证构建设置

**Settings** → **General** → **Build & Development Settings**

确认配置：

```plaintext
Framework Preset: Next.js
Build Command: pnpm build (或留空，自动检测)
Output Directory: .next (或留空，自动检测)
Install Command: pnpm install (或留空，自动检测)
```

---

### 方案 4：检查 Vercel 服务状态

访问 Vercel 状态页面：  
🔗 https://www.vercel-status.com/

如果显示 "Incident" 或 "Degraded Performance"，等待 Vercel 修复后再部署。

---

### 方案 5：检查项目大小限制

Vercel 免费计划限制：
- **构建输出大小**：< 100 MB
- **Serverless Function 大小**：< 50 MB

检查你的项目：

```bash
# 检查 .next 文件夹大小
Get-ChildItem .next -Recurse | Measure-Object -Property Length -Sum

# 如果输出超过 100 MB，需要优化
```

**优化建议**：
- 删除未使用的依赖
- 启用 Next.js Image Optimization
- 使用动态导入减少初始包大小

---

### 方案 6：清理 Vercel 缓存

有时 Vercel 的缓存会导致问题：

1. 进入 Vercel Dashboard
2. 选择你的项目
3. **Settings** → **General**
4. 滚动到最下方
5. 点击 **"Clear Build Cache"**
6. 重新部署

---

### 方案 7：联系 Vercel 支持

如果以上方法都不行：

1. **收集信息**：
   - 失败部署的 URL
   - 完整的构建日志（复制全部）
   - 错误发生的时间

2. **联系支持**：
   - 免费计划：https://vercel.com/help
   - 付费计划：Dashboard → Support → New Ticket

---

## 🔍 常见原因分析

### 1. Vercel 平台临时问题（最常见）
- **症状**：构建成功，部署输出失败
- **解决**：重新部署即可
- **概率**：70%

### 2. 网络波动
- **症状**：部署时间异常长或突然中断
- **解决**：等待几分钟后重试
- **概率**：15%

### 3. 环境变量缺失
- **症状**：构建成功但运行时错误
- **解决**：检查并补充环境变量
- **概率**：10%

### 4. 依赖安装问题
- **症状**：pnpm-lock.yaml 损坏或版本冲突
- **解决**：本地删除 node_modules 和 pnpm-lock.yaml，重新 `pnpm install`
- **概率**：3%

### 5. 项目配置问题
- **症状**：next.config.mjs 配置错误
- **解决**：检查配置文件语法
- **概率**：2%

---

## ✅ 成功部署检查清单

部署成功后，验证以下功能：

### 基础功能
- [ ] 访问应用 URL（https://你的项目.vercel.app）
- [ ] 首页正常显示
- [ ] 输入梦境描述
- [ ] 点击 "Illuminate My Dream"
- [ ] 查看 AI 解析结果

### 社交登录（如已配置）
- [ ] GitHub 登录正常
- [ ] Google 登录正常
- [ ] 用户信息正确显示
- [ ] 登出功能正常

### 其他页面
- [ ] /privacy 隐私政策页面
- [ ] /auth/auth-code-error 错误页面

---

## 📊 Vercel 部署时间参考

正常情况下：

| 阶段 | 耗时 |
|------|------|
| 克隆仓库 | 5-10 秒 |
| 安装依赖（pnpm） | 15-30 秒 |
| 构建 Next.js | 20-40 秒 |
| 部署输出 | 5-15 秒 |
| **总计** | **1-2 分钟** |

如果超过 5 分钟，可能有问题。

---

## 🆘 快速诊断命令

### 检查本地构建
```bash
# 确保本地可以成功构建
pnpm build

# 检查构建输出
ls -lh .next
```

### 检查 Git 状态
```bash
# 确保所有更改已提交
git status

# 确保已推送到远程
git log origin/main..HEAD
```

### 检查 pnpm 锁定文件
```bash
# 确保 pnpm-lock.yaml 存在
Test-Path pnpm-lock.yaml

# 确保 package-lock.json 不存在
Test-Path package-lock.json  # 应返回 False
```

---

## 💡 预防措施

### 1. 本地测试生产构建
```bash
pnpm build
pnpm start
```

访问 http://localhost:3000 确保生产版本运行正常。

### 2. 使用 Vercel CLI 本地测试
```bash
# 安装 Vercel CLI
pnpm add -g vercel

# 本地测试部署
vercel dev
```

### 3. 启用 Vercel 预览部署
每次推送到分支时，Vercel 会创建预览部署，方便测试。

---

## 🎯 下一步行动

### 立即执行（5 分钟内）

1. ✅ 在 Vercel Dashboard 找到失败的部署
2. ✅ 点击 "Redeploy" 重新部署
3. ✅ 等待 1-2 分钟查看结果

### 如果重新部署成功

- 🎉 恭喜！问题已解决
- 📝 这是 Vercel 平台的临时问题
- ✅ 未来遇到类似情况，直接重新部署即可

### 如果重新部署仍失败

1. 检查 Vercel 服务状态
2. 验证环境变量配置
3. 清理 Vercel 缓存
4. 推送新提交触发部署
5. 联系 Vercel 支持

---

## 📚 相关文档

- [Vercel 部署完整指南](./VERCEL_DEPLOYMENT.md)
- [环境变量配置](./ENV_SETUP.md)
- [Supabase 快速开始](./SUPABASE_QUICK_START.md)

---

**祝你部署顺利！🚀**

_最后更新：2025-10-20_

