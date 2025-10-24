import type { LinkFormatterParam, MarkdownTableType } from './interface'

export const defaultLang = 'en'

export const defaultTypeMap = {
  className: {
    type: 'string \\| string[]',
    tags: [
      {
        name: 'zh',
        value: '节点类名',
      },
      {
        name: 'en',
        value: 'Additional css class',
      },
    ],
  },
  style: {
    type: 'CSSProperties',
    tags: [
      {
        name: 'zh',
        value: '节点样式',
      },
      {
        name: 'en',
        value: 'Additional style',
      },
    ],
  },
}

export const defaultLinkFormatter = ({ typeName }: LinkFormatterParam): string => `#${typeName}`

export const defaultMarkdownTableSchema: Record<
  string,
  Array<{
    title: string | Record<MarkdownTableType, string>
    value: string | Record<MarkdownTableType, string>
  }>
> = {
  'zh': [
    {
      title: '参数名',
      value: 'name',
    },
    {
      title: '描述',
      value: 'tag.zh',
    },
    {
      title: '类型',
      value: 'type',
    },
    {
      title: '默认值',
      value: {
        interface: 'tag.defaultValue',
        parameter: 'initializerText',
      },
    },
    {
      title: '版本',
      value: 'tag.version',
    },
  ],
  'zh-Hant': [
    {
      title: '參數名',
      value: 'name',
    },
    {
      title: '描述',
      value: 'tag.zh-Hant',
    },
    {
      title: '類型',
      value: 'type',
    },
    {
      title: '預設值',
      value: {
        interface: 'tag.defaultValue',
        parameter: 'initializerText',
      },
    },
    {
      title: '版本',
      value: 'tag.version',
    },
  ],
  'en': [
    {
      title: {
        interface: 'Property',
        parameter: 'Argument',
      },
      value: 'name',
    },
    {
      title: 'Description',
      value: 'tag.en',
    },
    {
      title: 'Type',
      value: 'type',
    },
    {
      title: 'DefaultValue',
      value: {
        interface: 'tag.defaultValue',
        parameter: 'initializerText',
      },
    },
    {
      title: 'Version',
      value: 'tag.version',
    },
  ],
}
