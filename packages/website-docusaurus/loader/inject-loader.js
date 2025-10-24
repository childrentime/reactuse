const path = require('node:path')
const fs = require('node:fs')

function injectLoader(content) {
  const component = path.parse(this.resourcePath).name
  const isChinese = this.resourcePath.includes('zh-Hans')
  const isChineseHant = this.resourcePath.includes('zh-Hant')
  const newContent = content.replace(
    /%%API%%/g,
    getAPI(component, { isChinese, isChineseHant }),
  )
  return newContent
}

function getAPI(component, { isChinese, isChineseHant }) {
  // Define hook aliases mapping
  const aliases = {
    'useClickAway': 'useClickOutside',
    'useCopyToClipboard': 'useClipboard'
  }
  const suffix = isChineseHant ? '-zhHant' : isChinese ? '-zhHans' : ''
  
  // Use original hook name for aliases
  const actualComponent = aliases[component] || component
  const pathname = path.resolve(__dirname, `../api/${actualComponent}-README${suffix}.md`)
  
  if (!fs.existsSync(pathname)) {
    return ''
  }
  return `## API\n\nimport API from \'${pathname}\'\n\n<API />`
}

module.exports = injectLoader
