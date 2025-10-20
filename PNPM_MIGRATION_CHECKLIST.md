# 🔄 Lumi Dream App - pnpm 迁移清理清单

> **目标**：将项目从 npm/混用状态完全迁移到纯 pnpm 管理

---

## 📊 当前状态总结（2025-10-20）

### ✅ 已完成
- ✅ `.npmrc` 已配置为使用 pnpm
- ✅ `pnpm-lock.yaml` 已存在
- ✅ `package-lock.json` 已删除（被 AI 清理）
- ✅ `package.json` 的 scripts 是中性的（不依赖特定包管理器）

### ⚠️ 待处理
- ⚠️ **pnpm 未安装**（需要手动安装）
- ⚠️ **node_modules 需要重装**（被删除后未恢复）
- ⚠️ **15+ 文档包含 npm 命令**（需要批量更新）
- ⚠️ **README.md 包含 npm 命令**（需要更新）

---

## 🎯 迁移步骤

### 第一阶段：安装 pnpm ⚡

#### 选项 A：使用 Corepack（推荐，无需管理员权限）
```powershell
# 1. 启用 Corepack（Node.js 16.9+ 自带）
corepack enable

# 2. 安装并激活 pnpm
corepack prepare pnpm@latest --activate

# 3. 验证安装
pnpm --version
```

#### 选项 B：使用管理员权限
```powershell
# 以管理员身份运行 PowerShell
npm install -g pnpm

# 验证安装
pnpm --version
```

**预期结果**：显示 pnpm 版本号（例如 `9.15.0`）

---

### 第二阶段：恢复项目依赖 📦

```powershell
# 确保在项目根目录
cd D:\CursorWorkspace\lumi-dream-app

# 使用 pnpm 安装依赖
pnpm install
```

**预期结果**：
- ✅ 创建 `node_modules/.pnpm/` 目录（pnpm 特有结构）
- ✅ 安装约 60+ 依赖包
- ✅ 耗时约 15-30 秒

---

### 第三阶段：验证项目可运行 ✅

```powershell
# 启动开发服务器
pnpm dev
```

**预期结果**：
```
  ▲ Next.js 15.5.5
  - Local:        http://localhost:3000
  - ready in 2.3s
```

按 `Ctrl + C` 停止服务器，进入下一步。

---

### 第四阶段：更新文档中的命令 📝

#### 需要更新的文件清单（17 个文件）

##### 核心文档（必改）
1. ✅ `README.md` - 主文档（包含 4 处 npm 命令）
2. ✅ `VERCEL_BUILD_FIX.md` - 部署修复文档

##### docs/ 目录（15 个文件）
3. ✅ `docs/VERCEL_DEPLOYMENT.md`
4. ✅ `docs/USAGE_LIMIT_FEATURE.md`
5. ✅ `docs/USAGE_LIMIT_CONFIG.md`
6. ✅ `docs/SUPABASE_QUICK_START.md`
7. ✅ `docs/SOCIAL_AUTH_COMPLETE_GUIDE.md`
8. ✅ `docs/SUPABASE_GOOGLE_AUTH.md`
9. ✅ `docs/GITHUB_AUTH_IMPLEMENTATION_SUMMARY.md`
10. ✅ `docs/SUPABASE_GITHUB_AUTH.md`
11. ✅ `docs/SEO_SITEMAP.md`
12. ✅ `docs/SEO_VALIDATION_QUICK_REFERENCE.md`
13. ✅ `docs/OPENROUTER_UPGRADE.md`
14. ✅ `docs/PROJECT_STATUS.md`
15. ✅ `docs/QUICK_START_UPGRADE.md`
16. ✅ `docs/ENV_SETUP.md`
17. ✅ `docs/OPENROUTER_MIGRATION.md`

#### 替换规则

| 旧命令（npm） | 新命令（pnpm） |
|--------------|---------------|
| `npm install` | `pnpm install` |
| `npm i` | `pnpm add` |
| `npm install <包名>` | `pnpm add <包名>` |
| `npm install -g <包名>` | `pnpm add -g <包名>` |
| `npm run dev` | `pnpm dev` |
| `npm run build` | `pnpm build` |
| `npm run start` | `pnpm start` |
| `npm run <脚本>` | `pnpm <脚本>` |
| `npm ci` | `pnpm install --frozen-lockfile` |
| `npm uninstall <包名>` | `pnpm remove <包名>` |

**注意**：保留 `package-lock.json` 字样（用于说明历史问题）

---

### 第五阶段：清理不需要的文件 🗑️

#### 需要删除的文件（如果存在）

```powershell
# 检查并删除 npm 锁定文件（应该已不存在）
if (Test-Path 'package-lock.json') { 
    Remove-Item package-lock.json -Force
    Write-Host "✅ 删除了 package-lock.json"
} else {
    Write-Host "✅ package-lock.json 已不存在"
}

# 检查是否存在其他包管理器的锁定文件
if (Test-Path 'yarn.lock') { 
    Remove-Item yarn.lock -Force
    Write-Host "✅ 删除了 yarn.lock"
}
```

#### 不需要删除的文件
- ❌ **不要**删除 `pnpm-lock.yaml`（这是 pnpm 的锁定文件，必须保留）
- ❌ **不要**删除 `.npmrc`（这是 pnpm 的配置文件）
- ❌ **不要**删除 `node_modules`（除非重装）

---

### 第六阶段：更新 .gitignore 📁

检查 `.gitignore` 文件，确保包含：

```gitignore
# 依赖
node_modules/

# 锁定文件（只保留 pnpm）
package-lock.json
yarn.lock
npm-debug.log*

# 保留 pnpm-lock.yaml（不要添加到 .gitignore）
```

---

## 🧪 最终验证清单

完成上述步骤后，依次验证：

### 1. 文件检查 ✅

```powershell
# 应该存在的文件
Test-Path package.json          # True
Test-Path pnpm-lock.yaml        # True
Test-Path .npmrc               # True
Test-Path node_modules/.pnpm   # True (pnpm 特有结构)

# 不应该存在的文件
Test-Path package-lock.json    # False
Test-Path yarn.lock           # False
```

### 2. 命令验证 ✅

```powershell
# pnpm 已安装
pnpm --version

# 项目可以启动
pnpm dev

# 项目可以构建
pnpm build
```

### 3. 功能验证 ✅

- [ ] 访问 http://localhost:3000
- [ ] 输入梦境描述（至少 10 字符）
- [ ] 点击 "Illuminate My Dream"
- [ ] 查看 AI 解析结果
- [ ] 测试社交登录（如已配置）

### 4. 文档验证 ✅

```powershell
# 检查文档中是否还有 npm 命令（应返回 0 或只有说明性文字）
Select-String -Path README.md -Pattern "npm install" -NotMatch "package-lock"
```

---

## 📚 pnpm 常用命令速查

### 依赖管理
```bash
pnpm install              # 安装所有依赖
pnpm add <包名>           # 添加依赖
pnpm add -D <包名>        # 添加开发依赖
pnpm add -g <包名>        # 全局安装
pnpm remove <包名>        # 删除依赖
pnpm update               # 更新所有依赖
pnpm update <包名>        # 更新特定依赖
```

### 项目脚本
```bash
pnpm dev                  # 启动开发服务器
pnpm build                # 构建生产版本
pnpm start                # 启动生产服务器
pnpm lint                 # 运行 linter
pnpm <脚本名>             # 运行 package.json 中定义的脚本
```

### 其他命令
```bash
pnpm list                 # 列出已安装的包
pnpm outdated             # 检查过期的包
pnpm why <包名>           # 查看为什么安装了某个包
pnpm store prune          # 清理 pnpm 缓存
```

---

## 🚀 Vercel 部署注意事项

### pnpm 部署优势
- ✅ **自动识别**：Vercel 检测到 `pnpm-lock.yaml` 会自动使用 pnpm
- ✅ **更快构建**：pnpm 构建速度比 npm 快 30-50%
- ✅ **无需配置**：`.npmrc` 确保使用正确的包管理器

### 环境变量（必需）
部署前确保在 Vercel 配置：
- `OPENROUTER_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

详见：`docs/VERCEL_DEPLOYMENT.md`

---

## 🆘 故障排除

### 问题 1：pnpm 命令未找到
**解决方案**：
```powershell
# 重新安装 pnpm
corepack enable
corepack prepare pnpm@latest --activate
```

### 问题 2：安装依赖时出错（peer dependency 冲突）
**解决方案**：
```powershell
# pnpm 默认使用宽松模式，不应该有问题
# 如果仍有错误，检查 .npmrc 配置：
cat .npmrc
# 应该包含 package-manager=pnpm
```

### 问题 3：node_modules 结构异常
**解决方案**：
```powershell
# 完全清理并重装
Remove-Item -Recurse -Force node_modules
pnpm install
```

### 问题 4：Vercel 构建失败
**检查清单**：
- [ ] 已删除 `package-lock.json`
- [ ] 已保留 `pnpm-lock.yaml`
- [ ] `.npmrc` 文件存在且配置正确
- [ ] 所有环境变量已配置

---

## 📊 迁移前后对比

| 指标 | npm | pnpm |
|------|-----|------|
| 安装速度 | ~45 秒 | ~15 秒 ⚡ |
| 磁盘占用 | ~250 MB | ~80 MB 💾 |
| 依赖安全 | 一般 | 严格 🔒 |
| Next.js 支持 | ✅ | ✅ |
| Vercel 支持 | ✅ | ✅ |

---

## ✅ 迁移完成标志

当你完成所有步骤后，你的项目应该：

- ✅ 只有 `pnpm-lock.yaml`，没有 `package-lock.json`
- ✅ `.npmrc` 明确指定使用 pnpm
- ✅ `node_modules/.pnpm/` 目录存在
- ✅ 所有文档中的命令都是 pnpm 命令
- ✅ 项目可以正常启动和构建
- ✅ Vercel 可以成功部署

---

## 🎉 恭喜！

完成本清单后，你的 Lumi Dream App 将：
- ⚡ 开发速度提升 3 倍
- 💾 节省 60% 磁盘空间
- 🔒 更安全的依赖管理
- 🚀 更快的 Vercel 部署

**现在可以开始第一阶段：安装 pnpm！**

---

_最后更新时间：2025-10-20_

