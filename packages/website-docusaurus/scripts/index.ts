import fs from 'node:fs'
import path from 'node:path'

const source = path.resolve(__dirname, '../../core/changelog.md')

// 目标文件路径
const destination = path.resolve(__dirname, '../docs/changelog.md')

fs.copyFile(source, destination, err => {
  if (err) {
    console.error('Error while copying file:', err)
  }
  else {
    console.log('File copied successfully')
  }
})
