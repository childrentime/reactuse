# ReactUse Multilingual Support AI Assistant Guide

This is a comprehensive guide designed specifically for AI assistants to automate adding new language support to the ReactUse project.

## 🎯 Task Overview

Add new language support to the ReactUse project, including:
1. Configure Docusaurus internationalization
2. Configure API documentation generation
3. Add multilingual comments to all hooks
4. Translate all documentation content

## 📋 Execution Steps

### 1. Configure Docusaurus Internationalization

Update `packages/website-docusaurus/docusaurus.config.ts`:
```typescript
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'zh-Hans', 'NEW_LOCALE'], // Add new language code
},
```

### 2. Configure API Documentation Generation

Update `packages/core/scripts/tsdoc.ts`:
```typescript
// Add new language configuration
const newLangConfig = {
  lang: 'zh', // Use 'zh' for Chinese variants, corresponding code for other languages
  fallbackLang: 'en',
  outputDir: path.resolve(__dirname, '../../website-docusaurus/api'),
  exclude: ['**/node_modules/**', '**/*.test.ts', '**/*.spec.ts'],
  readme: {
    enable: true,
    template: path.resolve(__dirname, './template-NEW_LANG.md'),
  },
}

// Add new language to generation loop
const configs = [enConfig, zhConfig, newLangConfig]
```

### 3. Add npm Scripts

Update `packages/website-docusaurus/package.json`:
```json
{
  "scripts": {
    "start:NEW_LOCALE": "npm run start -- --locale NEW_LOCALE",
    "write-translations:NEW_LOCALE": "docusaurus write-translations --locale NEW_LOCALE"
  }
}
```

### 4. Add Multilingual Comments to All Hooks

Add new language comments to each `packages/core/src/*/interface.ts` file:

```typescript
/**
 * @title useCounter
 * @returns 包含以下元素的元组：...
 * @returns_en A tuple with the following elements:...
 * @returns_NEW_LANG Description of return value in new language
 */
export type UseCounter = (
  /**
   * @zh Simplified Chinese description
   * @zh-Hant Traditional Chinese description
   * @NEW_LANG New language description
   * @en English description
   */
  param: Type
) => ReturnType
```

**Important**: Must process all 104 interface.ts files, do not stop until all are completed.

### 5. Generate and Translate Documentation

```bash
# Generate translation files
cd packages/website-docusaurus
pnpm write-translations:NEW_LOCALE

# Copy existing documentation
cp -r i18n/zh-Hans/docusaurus-plugin-content-docs/current/* i18n/NEW_LOCALE/docusaurus-plugin-content-docs/current/
```

### 6. Translate Documentation Content

File types that need translation:

1. **Category files** (`_category_.json`)
2. **Main documentation** (`intro.md`, `sponsor.md`, `doms.md`)  
3. **Hook documentation** (approximately 108 `.mdx` files)

**Translation Pattern**:
- Title: `title: hookName 用法与示例` → `title: hookName Usage & Examples`
- Description: Simplified Chinese → Target language
- Body content: Simplified Chinese → Target language

## 🤖 AI Execution Instructions

When receiving a request to add a new language:

1. **Do not create automated scripts**, process manually one by one
2. **Do not stop** until all files are processed
3. **Track progress** using TODO tools
4. **Batch process** using MultiEdit tools for efficiency
5. **Verify completeness** ensuring all files are translated

## 📊 Progress Tracking Commands

```bash
# Count total files
find packages/core/src -name "interface.ts" | wc -l

# Count translated files  
find packages/core/src -name "interface.ts" -exec grep -l "@NEW_LANG" {} \; | wc -l

# View untranslated files
find packages/core/src -name "interface.ts" -exec grep -L "@NEW_LANG" {} \;

# Count documentation files
find packages/website-docusaurus/i18n/NEW_LOCALE/docusaurus-plugin-content-docs/current -name "*.mdx" | wc -l
```

## 🔧 Common Language Codes

| Language | Code | Docusaurus locale |
|----------|------|-------------------|
| Traditional Chinese | zh-Hant | zh-Hant |
| Japanese | ja | ja |
| Korean | ko | ko |
| French | fr | fr |
| German | de | de |
| Spanish | es | es |
| Russian | ru | ru |
| Portuguese | pt | pt |

## 📝 Translation Reference Table (Traditional Chinese Example)

| Simplified Chinese | Traditional Chinese |
|-------------------|-------------------|
| 管理 | 管理 |
| 状态 | 狀態 |
| 函数 | 函數 |
| 参数 | 參數 |
| 组件 | 組件 |
| 配置 | 配置 |
| 默认 | 預設 |
| 设置 | 設定 |
| 获取 | 獲取 |
| 监听 | 監聽 |
| 处理 | 處理 |
| 实例 | 實例 |
| 类型 | 類型 |
| 数组 | 數組 |
| 对象 | 對象 |

## ⚡ Execution Template

When receiving request: "Add [language] support", immediately execute:

1. Create TODO list to track progress
2. Update configuration files (docusaurus.config.ts, tsdoc.ts, package.json)
3. Generate translation file structure
4. Batch process all interface.ts files
5. Translate all documentation files
6. Verify completeness
7. Report completion status

**Key Principles**:
- ✅ Process manually one by one to ensure quality
- ✅ Work continuously until 100% completion
- ✅ Use tools to track progress
- ❌ Do not create automated scripts
- ❌ Do not stop midway
- ❌ Do not skip any files

---

**Usage Instructions**: Provide this guide to an AI assistant, and it will be able to automatically complete the entire multilingual addition process.
