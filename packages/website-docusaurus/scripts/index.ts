import fs from 'node:fs'
import path from 'node:path'

const source = path.resolve(__dirname, '../../core/changelog.md')

// 目标文件路径
const destination = path.resolve(__dirname, '../docs/changelog.md')

// YAML front matter 模板
const yamlFrontMatter = `---
title: changelog
sidebar_label: changelog
description: >-
  - Initial public release - add useActiveElement - add useDraggable - add useElemenBounding hook - add useElementVisibility hook - add useWindowsFocus hook -
  add
---
`

/**
 * 将 changelog 内容倒序排列
 * 输入: 按时间顺序排列的 changelog (旧版本在上)
 * 输出: 按时间倒序排列的 changelog (新版本在上)
 */
function reverseChangelog(content: string): string {
  const lines = content.split('\n')
  
  // 找到标题行 "# ChangeLog"
  let titleLine = ''
  let contentStartIndex = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('# ')) {
      titleLine = lines[i]
      contentStartIndex = i + 1
      break
    }
  }
  
  // 解析版本块 (以 ## 开头的部分)
  const versionBlocks: string[] = []
  let currentBlock: string[] = []
  
  for (let i = contentStartIndex; i < lines.length; i++) {
    const line = lines[i]
    
    if (line.startsWith('## ')) {
      // 保存上一个版本块
      if (currentBlock.length > 0) {
        versionBlocks.push(currentBlock.join('\n').trim())
      }
      currentBlock = [line]
    } else {
      currentBlock.push(line)
    }
  }
  
  // 保存最后一个版本块
  if (currentBlock.length > 0) {
    versionBlocks.push(currentBlock.join('\n').trim())
  }
  
  // 倒序排列版本块
  const reversedBlocks = versionBlocks.reverse()
  
  // 重新组合内容
  return `${titleLine}\n\n${reversedBlocks.join('\n\n')}\n`
}

try {
  // 读取源文件内容
  const sourceContent = fs.readFileSync(source, 'utf8')
  
  // 倒序排列 changelog
  const reversedContent = reverseChangelog(sourceContent)
  
  // 合并 YAML front matter 和倒序后的内容
  const finalContent = yamlFrontMatter + reversedContent
  
  // 写入目标文件
  fs.writeFileSync(destination, finalContent, 'utf8')
  
  console.log('Changelog copied and reversed successfully (newest first)')
} catch (err) {
  console.error('Error while processing file:', err)
}
