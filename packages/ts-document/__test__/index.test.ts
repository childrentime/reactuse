import * as path from 'node:path'
import { Project, generate, generateMarkdown } from '../src/index'

const pathFixtures = path.resolve(__dirname, 'fixtures')
const pathBasic = path.resolve(pathFixtures, 'basic.ts')
const pathExtends = path.resolve(pathFixtures, 'extends/interface.ts')
const pathDefaultMap = path.resolve(pathFixtures, 'defaultTypeMap.ts')
const pathFunction = path.resolve(pathFixtures, 'function.ts')
const pathPropertySorter = path.resolve(pathFixtures, 'propertySorter.ts')
const pathNest = path.resolve(pathFixtures, 'nest/interface.ts')
const pathEscape = path.resolve(pathFixtures, 'escape.ts')

function nestLinkFormatter(options) {
  const { typeName, jsDocTitle, fullPath } = options
  const toHyphen = str => {
    return str
      .replace(/^\w/, g => g.toLowerCase())
      .replace(/([A-Z])/g, g => `-${g[0].toLowerCase()}`)
  }
  if (!jsDocTitle) {
    return `#${typeName}`
  }
  const componentName = (fullPath || '').match(/components\/([^/]*)/)?.[1]
  if (componentName) {
    return `${toHyphen(componentName)}#${jsDocTitle}`
  }
  return ''
}

describe('generate', () => {
  it('basic', () => {
    const schema = generate(pathBasic, {
      sourceFilesPaths: './**/*.ts',
    })
    expect(schema).toMatchSnapshot()
  })

  it('extends', () => {
    const schema = generate(pathExtends, {
      sourceFilesPaths: './**/*.ts',
    })
    expect(schema).toMatchSnapshot()
  })

  it('defaultTypeMap', () => {
    const schema = generate(pathDefaultMap, {
      sourceFilesPaths: './**/*.ts',
    })
    expect(schema).toMatchSnapshot()
  })

  it('function type', () => {
    const schema = generate(pathFunction, {
      sourceFilesPaths: './**/*.ts',
    })
    expect(schema).toMatchSnapshot()
  })

  it('sort property', () => {
    const schema = generate(pathPropertySorter, {
      sourceFilesPaths: './**/*.ts',
      propertySorter: ({ type: typeA }, { type: typeB }) => {
        const getLevel = type =>
          type === 'boolean'
            ? 0
            : type === 'number'
              ? 1
              : type === 'string'
                ? 2
                : /([^)]*)\s*=>/.test(type)
                  ? 3
                  : -1
        return getLevel(typeA) - getLevel(typeB)
      },
    })
    expect(schema).toMatchSnapshot()
  })

  it('nested types', () => {
    const schema = generate(pathNest, {
      sourceFilesPaths: './**/*.ts',
      linkFormatter: nestLinkFormatter,
    })
    expect(schema).toMatchSnapshot()
  })

  it('escape', () => {
    const schema = generate(pathEscape, {
      sourceFilesPaths: './**/*.ts',
      escapeChars: false,
    })
    expect(schema).toMatchSnapshot()
  })
})

describe('generateMarkdown', () => {
  it('basic', () => {
    const markdownZh = generateMarkdown(pathBasic, {
      sourceFilesPaths: './**/*.ts',
      lang: 'zh',
    })
    const markdownEn = generateMarkdown(pathBasic, {
      sourceFilesPaths: './**/*.ts',
      lang: 'en',
    })
    expect(markdownZh).toMatchSnapshot()
    expect(markdownEn).toMatchSnapshot()
  })

  it('extends', () => {
    const markdownZh = generateMarkdown(pathExtends, {
      sourceFilesPaths: './**/*.ts',
      lang: 'zh',
    })
    const markdownEn = generateMarkdown(pathExtends, {
      sourceFilesPaths: './**/*.ts',
      lang: 'en',
    })
    expect(markdownZh).toMatchSnapshot()
    expect(markdownEn).toMatchSnapshot()
  })

  it('function type', () => {
    const markdownZh = generateMarkdown(pathFunction, {
      sourceFilesPaths: './**/*.ts',
      lang: 'zh',
    })
    const markdownEn = generateMarkdown(pathFunction, {
      sourceFilesPaths: './**/*.ts',
      lang: 'en',
      strictDeclarationOrder: true,
    })
    expect(markdownZh).toMatchSnapshot()
    expect(markdownEn).toMatchSnapshot()
  })

  it('custom project', () => {
    const project = new Project({
      compilerOptions: {
        jsx: 'react' as any,
      },
    })
    const markdownZh = generateMarkdown(pathFunction, {
      sourceFilesPaths: './**/*.ts',
      lang: 'zh',
      project,
    })
    const markdownEn = generateMarkdown(pathFunction, {
      sourceFilesPaths: './**/*.ts',
      lang: 'en',
      strictDeclarationOrder: true,
      project,
    })
    expect(markdownZh).toMatchSnapshot()
    expect(markdownEn).toMatchSnapshot()
  })

  it('nested types', () => {
    const markdownZh = generateMarkdown(pathNest, {
      sourceFilesPaths: './**/*.ts',
      lang: 'zh',
      linkFormatter: nestLinkFormatter,
    })
    const markdownEn = generateMarkdown(pathNest, {
      sourceFilesPaths: './**/*.ts',
      lang: 'en',
      linkFormatter: nestLinkFormatter,
    })
    expect(markdownZh).toMatchSnapshot()
    expect(markdownEn).toMatchSnapshot()
  })

  it('escape', () => {
    const markdownZh = generateMarkdown(pathEscape, {
      sourceFilesPaths: './**/*.ts',
      lang: 'zh',
      escapeChars: false,

    })
    const markdownEn = generateMarkdown(pathEscape, {
      sourceFilesPaths: './**/*.ts',
      lang: 'en',
      escapeChars: false,
    })
    expect(markdownZh).toMatchSnapshot()
    expect(markdownEn).toMatchSnapshot()
  })
})
