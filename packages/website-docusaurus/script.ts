import path from 'node:path'
import fs from 'node:fs'

const files = fs.readdirSync(path.resolve(__dirname, './docs'))
for (const f of files) {
  console.log('f', f)
  const pathname = path.resolve(__dirname, `./docs/${f}`)

  if (pathname.includes('md')) {
    continue
  }
  const files2 = fs.readdirSync(pathname)

  for (const file of files2) {
    const filePath = `${pathname}/${file}`
    let content = fs.readFileSync(filePath, 'utf-8')
    content = content.replace('%%API%%', '\n%%API%%')
    fs.writeFileSync(filePath, content)
  }
}
