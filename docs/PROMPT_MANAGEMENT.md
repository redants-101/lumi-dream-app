# Lumi 提示词管理系统

## 📋 概述

本文档描述了 Lumi AI 解梦应用的提示词管理和版本控制系统。

## 🎯 Master Prompt - Version 1.0

**最后更新时间：** 2025年10月15日  
**理论框架：** 荣格分析心理学 + 正念 + 积极心理学  
**结构：** 5 部分工作流

### 核心原则

1. **核心身份**
   - Lumi 作为温暖的心理向导
   - 根植于荣格心理学 + 正念 + 积极心理学
   - 定位：伙伴，而非字典

2. **沟通风格**
   - 语气：温暖、平和、包容、鼓励
   - 用词：非结论性（"This might symbolize...", "It could be..."）
   - 共情优先原则

3. **响应结构**（5 部分工作流）
   - **Part 1：** 情感连接（共情开场）
   - **Part 2：** 核心主题总结（一句话）
   - **Part 3：** 符号解构（2-3 个符号，包含心理层面 + 原型分析）
   - **Part 4：** 综合洞察（连贯叙事）
   - **Part 5：** 连接清醒世界（可操作的反思练习）

4. **安全边界**
   - ❌ 禁止医疗/心理健康诊断
   - ❌ 禁止算命或预测
   - ⚠️ 自残内容应急协议（引导寻求专业帮助）

## 🗂️ 文件结构

```
lib/
  prompts.ts              # 集中管理提示词
app/api/interpret/
  route.ts                # 使用提示词的 API 路由
```

## 📝 使用方法

### 在 API 路由中使用

```typescript
import { getCurrentPrompt, PROMPT_VERSION } from "@/lib/prompts"

// 使用提示词
const result = await generateText({
  model: openrouter(modelId),
  prompt: getCurrentPrompt(dream),
  // ... 其他参数
})

// 记录版本号用于追踪
console.log("Prompt Version:", PROMPT_VERSION)
```

### 创建新版本提示词

1. **在 `lib/prompts.ts` 中添加新版本：**

```typescript
export const DREAM_INTERPRETATION_PROMPT_V2 = (dream: string) => `
  // 新的提示词内容（保持英文）
`;
```

2. **更新当前使用的提示词：**

```typescript
// 修改这一行即可切换版本
export const getCurrentPrompt = DREAM_INTERPRETATION_PROMPT_V2;
export const PROMPT_VERSION = "2.0";
export const PROMPT_LAST_UPDATED = "2025-XX-XX";
```

3. **无需修改其他文件！** API 路由会自动使用当前版本。

## 🔄 版本管理的优势

- ✅ **A/B 测试：** 轻松在不同提示词版本间切换
- ✅ **快速回滚：** 如果新提示词表现不佳，可快速恢复
- ✅ **版本追踪：** 每个 API 响应的元数据中都包含 `promptVersion`
- ✅ **数据分析：** 监控不同提示词版本的性能表现
- ✅ **集中维护：** 所有提示词集中在一个文件，便于管理

## 📊 监控

### 服务端日志
每次解梦都会记录：
```json
{
  "model": "google/gemini-2.0-flash-thinking-exp:free",
  "promptVersion": "1.0",
  "inputTokens": 450,
  "outputTokens": 280,
  "totalTokens": 730,
  "finishReason": "stop"
}
```

### API 响应元数据
前端接收到的数据：
```json
{
  "interpretation": "...",
  "metadata": {
    "model": "google/gemini-2.0-flash-thinking-exp:free",
    "promptVersion": "1.0",
    "usage": { ... },
    "finishReason": "stop"
  }
}
```

## 🧪 测试新提示词

### 开发环境测试
1. 在 `lib/prompts.ts` 中创建 `DREAM_INTERPRETATION_PROMPT_V2`
2. 更新 `getCurrentPrompt` 使用 V2 版本
3. 使用各种梦境输入进行测试
4. 监控质量、Token 使用量和响应时间

### 生产环境 A/B 测试（未来功能）
```typescript
// 示例：随机选择提示词版本
export const getCurrentPrompt = (dream: string) => {
  const useV2 = Math.random() > 0.5;
  return useV2 
    ? DREAM_INTERPRETATION_PROMPT_V2(dream)
    : DREAM_INTERPRETATION_PROMPT_V1(dream);
};
```

## 📈 版本历史

| 版本 | 日期 | 主要变更 | 性能表现 |
|------|------|---------|---------|
| 1.0 | 2025-10-15 | 初始 Master Prompt，包含 5 部分结构、荣格框架、安全边界 | 基线 |

## 🎓 最佳实践

1. **记录变更：** 每个新提示词都要更新版本历史表
2. **充分测试：** 切换版本前使用多样化的梦境示例进行测试
3. **监控指标：** 对比 Token 使用量、响应时间、用户反馈
4. **保留旧版本：** 不要删除之前的提示词（便于快速回滚）
5. **版本命名：** 使用语义化版本号（1.0, 1.1, 2.0）

## 🔒 安全指南

所有提示词版本必须包含：
- 明确禁止医疗诊断
- 自残内容应急处理协议
- 非预测性语言
- 共情、支持性的语气

## 📚 参考资料

- [荣格心理学 (Jungian Psychology)](https://en.wikipedia.org/wiki/Analytical_psychology)
- [正念方法 (Mindfulness-Based Approaches)](https://en.wikipedia.org/wiki/Mindfulness)
- [积极心理学 (Positive Psychology)](https://en.wikipedia.org/wiki/Positive_psychology)
- [OpenRouter 模型列表](https://openrouter.ai/models)

---

**维护团队：** Lumi 开发团队  
**最后审核：** 2025年10月15日
