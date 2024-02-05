import type { Project } from "ts-morph";

// K-V pair parsed from jsDoc
export interface TagType {
  name: string;
  value: string;
}

// Schema parsed from Symbol
export interface PropertyType {
  name: string;
  type: string;
  isOptional: boolean;
  tags: TagType[];
}

// Schema parsed from function declaration
export interface FunctionSchema {
  tags: TagType[];
  params: Array<PropertyType & { initializerText: string | null }>;
  returns: string;
  type?: string;
}

// Schema parsed from interface declaration
export interface InterfaceSchema {
  tags: TagType[];
  data: PropertyType[];
  type?: string;
}

// Schema parsed from nested type declaration
export interface NestedTypeSchema {
  tags: TagType[];
  data: string;
  isNestedType: true;
  type?: string;
}

export interface LinkFormatterParam {
  typeName: string;
  jsDocTitle?: string;
  fullPath?: string;
}

export type LinkFormatter = (param: LinkFormatterParam) => string | undefined;

export type SchemaList = Array<{ title: string; schema: Schema }>;

// Collect of all schema type generated
export type Schema = FunctionSchema | InterfaceSchema | NestedTypeSchema;

// Table type in markdown generated
export type MarkdownTableType = "interface" | "parameter";

export type DefaultTypeMapT = Record<string, { type: string; tags: TagType[] }>;

export interface GenerateConfig {
  defaultTypeMap?: DefaultTypeMapT;
  sourceFilesPaths: string | string[];
  /**
   * Whether to skip parsing documentation comment as property description
   */
  strictComment?: boolean;
  /**
   * Generate schema in the order they appear in the document
   * When it's true, generate function will return Array<{ title: string; schema: Schema }>
   */
  strictDeclarationOrder?: boolean;
  /**
   * The compare function to sort properties/arguments of schema
   */
  propertySorter?: (a: PropertyType, b: typeof a) => number;
  /**
   * Custom project to use in generate function
   */
  project?: Project;
  /**
   * Format function to generate link of the nested type
   */
  linkFormatter?: LinkFormatter;
  /**
   * When parsing nested types, whether to ignore these nested types if they are defined in some files
   * When returning true, nested types must not be exported, but when false is returned, nested types may not be exported due to other reasons (such as the nested type has jsdoc @title, which needs to be manually exported)
   */
  ignoreNestedType?: (definitionFilePath: string) => boolean;
  /*
   * Whether to escape characters for extracted type text.
   * E.g. `|` will be escaped to `\|`, `<Promise>` will be escaped to `&lt;Promise&gt;`.
   */
  escapeChars?: boolean;
}

export type GenerateMarkdownConfig = GenerateConfig & {
  lang?: string;
};
