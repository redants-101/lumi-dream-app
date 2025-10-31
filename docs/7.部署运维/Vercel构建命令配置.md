# 🔧 Vercel 构建命令配置指南

## 🚨 问题发现

从 Vercel 设置截图看到，Build Command 仍然是 `npm run build`，但项目已经迁移到 pnpm。

---

## ✅ 正确的配置

### 方案 A：留空（最推荐）⭐

**操作**：
1. 在 Vercel Dashboard 中
2. 进入 **Settings** → **General** → **Build & Development Settings**
3. 将 **Build Command** 留空
4. 保存设置

**原因**：
- ✅ Vercel 会自动检测 `pnpm-lock.yaml` 文件
- ✅ 自动使用 `pnpm build` 命令
- ✅ 你的 `.npmrc` 文件已指定使用 pnpm
- ✅ 最智能、最不容易出错

---

### 方案 B：手动指定 pnpm build

**操作**：
1. 在 Vercel Dashboard 中
2. 进入 **Settings** → **General** → **Build & Development Settings**
3. **Build Command** 改为：`pnpm build`
4. 保存设置

---

## 📊 完整的推荐配置

### Vercel Build & Development Settings

| 设置项 | 推荐值 | 说明 |
|--------|--------|------|
| **Framework Preset** | `Next.js` | ✅ 保持不变 |
| **Build Command** | **留空** 或 `pnpm build` | ✅ 需要修改 |
| **Output Directory** | **留空** 或 `.next` | ✅ 保持不变 |
| **Install Command** | **留空** | ✅ 自动检测 pnpm |
| **Development Command** | **留空** 或 `next` | ✅ 保持不变 |

---

## 🔍 为什么自动检测有效？

Vercel 的自动检测逻辑：

1. **检测锁定文件**：
   ```
   ✅ 发现 pnpm-lock.yaml → 使用 pnpm
   ❌ 发现 package-lock.json → 使用 npm
   ❌ 发现 yarn.lock → 使用 yarn
   ```

2. **检测 .npmrc**：
   ```ini
   package-manager=pnpm  # 明确指定使用 pnpm
   ```

3. **自动构建命令**：
   ```bash
   pnpm install  # 安装依赖
   pnpm build    # 构建项目
   ```

---

## 🛠️ 修改步骤（详细）

### 步骤 1：访问 Vercel 设置

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目（lumi-dream-app）
3. 点击顶部的 **Settings** 标签

### 步骤 2：修改构建设置

1. 在左侧菜单选择 **General**
2. 滚动到 **Build & Development Settings** 部分
3. 找到 **Build Command** 字段

### 步骤 3：清空或修改

**选项 A（推荐）**：
- 点击 **Override** 旁边的开关（如果已开启）
- 将字段留空
- 点击 **Save**

**选项 B**：
- 点击 **Override** 开关启用
- 输入：`pnpm build`
- 点击 **Save**

### 步骤 4：验证

1. 点击顶部的 **Deployments** 标签
2. 点击最新部署查看构建日志
3. 确认日志中显示：
   ```
   Running "pnpm install"
   Running "pnpm build"
   ```

---

## ⚠️ 常见错误

### 错误 1：仍使用 npm 构建

**症状**：构建日志显示 `npm install`

**原因**：
- Build Command 仍然是 `npm run build`
- 或者 `pnpm-lock.yaml` 不存在

**解决**：
```bash
# 确保 pnpm-lock.yaml 存在
Test-Path pnpm-lock.yaml  # 应该返回 True

# 确保 package-lock.json 不存在
Test-Path package-lock.json  # 应该返回 False
```

---

### 错误 2：构建命令找不到

**症状**：`Error: Command "npm" not found`

**原因**：Override 开启但字段为空或无效

**解决**：
- 关闭 Override，让 Vercel 自动检测
- 或者明确填写 `pnpm build`

---

## ✅ 验证清单

修改后，检查以下项目：

- [ ] `pnpm-lock.yaml` 文件存在于根目录
- [ ] `package-lock.json` 文件不存在
- [ ] `.npmrc` 文件包含 `package-manager=pnpm`
- [ ] `.vercelignore` 文件包含 `.next/cache`
- [ ] Vercel Build Command 设置为空或 `pnpm build`
- [ ] 新的部署日志显示使用 pnpm

---

## 📚 参考资源

- [Vercel Build Configuration](https://vercel.com/docs/build-step)
- [pnpm on Vercel](https://vercel.com/docs/deployments/configure-a-build#install-command)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)

---

## 🎯 总结

### 当前问题
- ❌ Build Command 是 `npm run build`
- ❌ 与项目的 pnpm 配置不一致

### 解决方案
1. ✅ 将 Build Command **留空**（让 Vercel 自动检测）
2. ✅ 或改为 `pnpm build`

### 预期结果
- ✅ Vercel 将使用 pnpm 安装和构建
- ✅ 构建速度更快（pnpm 比 npm 快 3 倍）
- ✅ 与本地开发环境一致

---

_最后更新：2025-10-20_


