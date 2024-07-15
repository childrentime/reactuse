import path from 'node:path'
import fs from 'fs-extra'
import prompts from 'prompts'
import chalk from 'chalk'
import menuGroup from './../packages/website/src/routes.json'

const currentNodeVersion = process.versions.node
const semver = currentNodeVersion.split('.')
const major = +semver[0]

if (major < 14) {
  console.error(
    `You are running Node ${currentNodeVersion}.\n`
    + 'equires Node 14 or higher. \n'
    + 'Please update your version of Node.',
  )
  process.exit(1)
}

const style = chalk.hex('#007acc')
const use = style('use')
const desc = style('description')
const cate = style('category')
const markUp = 'MARKUP'

function randomColor() {
  const red = Math.floor(Math.random() * 256)
  const green = Math.floor(Math.random() * 256)
  const blue = Math.floor(Math.random() * 256)

  return chalk.rgb(red, green, blue)
}

const menus = menuGroup.main.map(menu => {
  return { title: randomColor()(menu.title) }
});

(async () => {
  const { hookName } = await prompts({
    type: 'text',
    name: 'hookName',
    message: `Enter your hook name, start with ${use}`,
    validate: (value: string) =>
      value.startsWith('use')
        ? true
        : `A react hook must start with ${use} prefix`,
  })

  const { description } = await prompts({
    type: 'text',
    name: 'description',
    message: `Please add a ${desc} to intro it`,
  })

  const { category } = await prompts({
    type: 'select',
    name: 'category',
    message: `Choose a ${cate}`,
    choices: menus,
  })

  if (
    typeof hookName === 'undefined'
    || typeof description === 'undefined'
    || typeof category === 'undefined'
  ) {
    return
  }

  // add hook
  const dir = path.resolve(__dirname, `../packages/core/hooks/${hookName}`)
  const dirIndex = `${dir}/index.ts`
  const dirIndexSpec = `${dir}/index.spec.ts`
  const hookTemplate = fs
    .readFileSync(path.resolve(__dirname, './templates/index.ts'), 'utf-8')
    .replaceAll(markUp, hookName)
  const hookTestTemplate = fs
    .readFileSync(path.resolve(__dirname, './templates/index.spec.ts'), 'utf-8')
    .replaceAll(markUp, hookName)
  fs.ensureDirSync(dir)
  fs.ensureFileSync(dirIndex)
  fs.ensureFileSync(dirIndexSpec)
  fs.writeFileSync(dirIndex, hookTemplate)
  fs.writeFileSync(dirIndexSpec, hookTestTemplate)

  // add import and export
  const indexPath = path.resolve(__dirname, '../packages/core/hooks/index.ts')
  let fileContent = fs.readFileSync(indexPath, 'utf-8')
  const importStatement = `import ${hookName} from "./${hookName}";`
  const exportStatement = `export * from "./${hookName}";`
  const importRegex = /(import\s+(?:\S.*?)??from\s+['"][^'"]*['"]\s*;?\s*)/g
  const exportRegex = /(export\s*\*\s*from\s*['"][^'"]*['"]\s*;\s*)/g

  // import
  let lastIndex = 0
  while ((importRegex.exec(fileContent)) !== null) {
    lastIndex = importRegex.lastIndex
  }
  fileContent = [
    fileContent.substring(0, lastIndex).trim(),
    '\n',
    importStatement,
    '\n',
    '\n',
    fileContent.substring(lastIndex),
  ].join('')

  // export
  lastIndex = 0
  while ((exportRegex.exec(fileContent)) !== null) {
    lastIndex = exportRegex.lastIndex
  }

  fileContent = [
    fileContent.slice(0, lastIndex),
    exportStatement,
    fileContent.slice(lastIndex),
    '\n',
  ].join('')

  // export object
  const exportObjectRegex = /export\s+\{([^}]+)\}/g
  fileContent = fileContent.replace(exportObjectRegex, (match, p1: string) => {
    // 将导出项按照逗号分割为数组
    const exports = p1
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    // 添加新的导出项
    exports.push(`${hookName},`)
    // 去重，重新组合为导出语句
    const newExports = Array.from(new Set(exports)).join(',\n  ')
    return `export {\n  ${newExports}\n}`
  })

  fs.writeFileSync(indexPath, fileContent)

  // add docs
  const docs = path.resolve(
    __dirname,
    `../packages/core/hooks/${hookName}`,
  )
  const docsDemo = `${docs}/demo.tsx`
  const docsMD = `${docs}/README.md`
  fs.ensureDirSync(docs)
  fs.ensureFileSync(docsDemo)
  fs.ensureFileSync(docsMD)

  const docsDemoTemplate = fs
    .readFileSync(path.resolve(__dirname, './templates/demo.tsx'), 'utf-8')
    .replaceAll(markUp, hookName)
  const docsMDTemplate = `# ${hookName}\n\n${description}\n${fs.readFileSync(
    path.resolve(__dirname, './templates/README.md'),
    'utf-8',
  )}`

  fs.writeFileSync(docsDemo, docsDemoTemplate)
  fs.writeFileSync(docsMD, docsMDTemplate)

  // add  routes
  const routesPath = path.resolve(
    __dirname,
    '../packages/website/src/routes.json',
  )

  menuGroup.main[category].items.push(hookName)

  fs.writeFileSync(routesPath, JSON.stringify(menuGroup, null, 2))
})()
