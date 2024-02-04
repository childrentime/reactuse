import generate from './generate';
import { defaultMarkdownTableSchema, defaultLang } from './default';
import {
  MarkdownTableType,
  FunctionSchema,
  GenerateMarkdownConfig,
  InterfaceSchema,
  NestedTypeSchema,
  PropertyType,
  Schema,
} from './interface';
import { toSingleLine } from './util';

const BASE_TITLE_PREFIX = '###';

function generateMarkdown(
  file: string,
  config?: GenerateMarkdownConfig
): Record<string, string> | string[] | undefined {
  const lang = config?.lang || defaultLang;
  const markdownSchema = defaultMarkdownTableSchema[lang];

  if (!markdownSchema) {
    return;
  }

  const schemas = generate(file, config, lang);

  if (!schemas) {
    return;
  }

  const getMarkdownTable = (data: PropertyType[], type: MarkdownTableType) => {
    const hasVersionTag = data.find((item) => item?.tags?.find((t) => t.name === 'version'));
    const tableColumns: Array<{ title: string; value: string }> = [];

    markdownSchema.forEach(({ title, value }) => {
      title = typeof title === 'object' ? title[type] : title;
      value = typeof value === 'object' ? value[type] : value;
      if (hasVersionTag || value !== 'tag.version') {
        tableColumns.push({ title, value });
      }
    });

    const tableHeader = `|${tableColumns.map(({ title }) => title).join('|')}|
|${tableColumns.map(() => '---').join('|')}|`;

    const tableBody = data
      .map((schema) => {
        const requiredTextWord = lang === 'zh' ? '必填' : 'Required';
        const requiredText = !schema.isOptional ? ` **(${requiredTextWord})**` : '';
        const singleLineMarkdown = tableColumns
          .map((column) => {
            let field = column.value;

            // Field like tag.version
            const execResult = /tag\.(\w+)/.exec(field);
            if (execResult) {
              field = execResult[1];
              const obj = schema.tags?.find((tag) => tag.name === field);
              const value = obj ? toSingleLine(obj.value) : '-';
              return field === 'defaultValue' ? `\`${value}\`` : value;
            }

            const value = schema[field];
            switch (field) {
              case 'type': {
                return `${value} ${requiredText}`;
              }
              case 'initializerText': {
                return value !== null ? `\`${value}\`` : '-';
              }
              default:
                return value;
            }
          })
          .join('|');

        return `|${singleLineMarkdown}|`;
      })
      .join('\n');

    return `${tableHeader}\n${tableBody}`;
  };

  const getMarkdownFromSchema = (title: string, schema: Schema): string => {
    const markdownTitle = `${BASE_TITLE_PREFIX} ${title}`;
    if ((schema as NestedTypeSchema).isNestedType) {
      const markdownBody = `\`\`\`js\n${(schema as NestedTypeSchema).data}\`\`\``;
      return `${markdownTitle}\n\n${markdownBody}`;
    } else {
      const dataForTable = (schema as InterfaceSchema).data || (schema as FunctionSchema).params;
      const tagMap: Record<string, string> = {};
      schema.tags.forEach(({ name, value }) => (tagMap[name] = value));
      let description = tagMap[lang] || '';
      let table =
        dataForTable && dataForTable.length
          ? getMarkdownTable(
              dataForTable,
              (schema as FunctionSchema).params ? 'parameter' : 'interface'
            )
          : '';

      // Function type
      const { params, returns: typeOfReturn } = schema as FunctionSchema;
      if (params) {
        const { version, returns } = tagMap;
        if (version) {
          description += `${description ? '\n\n' : ''}${BASE_TITLE_PREFIX}# Since\n${version}`;
        }
        description += `${
          description ? '\n\n' : ''
        }${BASE_TITLE_PREFIX}# Returns\n\`${typeOfReturn}\`${returns ? `: ${returns}` : ''}`;
        table = `${BASE_TITLE_PREFIX}# Arguments\n${table}`;
      }

      const {type} = schema;

      if(type){
        table = `${BASE_TITLE_PREFIX}# Type\n\n\`${type}\`\n${table}`
      }

      return [markdownTitle, description, table].filter(Boolean).join('\n\n');
    }
  };

  if (config?.strictDeclarationOrder) {
    const markdownList: string[] = [];
    (schemas as Array<{ title: string; schema: Schema }>).forEach(({ title, schema }) =>
      markdownList.push(getMarkdownFromSchema(title, schema))
    );
    return markdownList;
  }

  const markdownMap: Record<string, string> = {};
  Object.entries(schemas as Record<string, Schema>).forEach(([title, schema]) => {
    markdownMap[title] = getMarkdownFromSchema(title, schema);
  });
  return markdownMap;
}

export default generateMarkdown;
