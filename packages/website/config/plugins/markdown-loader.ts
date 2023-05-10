import type { LoaderContext } from "webpack";
import markdown from "../../utils/markdown";

const getComp = (content: string) => `
import React from 'react';

export default () => React.createElement("div", {dangerouslySetInnerHTML: {__html: ${content}}})
`;

export default function markdownLoader(this: LoaderContext<any>, source: string) {
  const content = markdown.render(source);
  // const result = `export default ${JSON.stringify(content)}`;
  const result = getComp(JSON.stringify(content));
  return result;
}
