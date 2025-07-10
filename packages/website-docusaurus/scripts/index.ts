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

try {
  // 读取源文件内容
  const sourceContent = fs.readFileSync(source, 'utf8')
  
  // 合并 YAML front matter 和源文件内容
  const finalContent = yamlFrontMatter + sourceContent
  
  // 写入目标文件
  fs.writeFileSync(destination, finalContent, 'utf8')
  
  console.log('File copied successfully with YAML front matter preserved')
} catch (err) {
  console.error('Error while processing file:', err)
}
