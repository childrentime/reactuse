import type { LoaderContext } from "webpack";
import markdown from "../../utils/markdown";

const getComp = (before: string, after: string, demoPath: string) => `
import React from 'react';
import Demo from '${demoPath}';

export default () => (
  <div className="prose">
    <div dangerouslySetInnerHTML={{__html: ${before}}} />
    <div>
      <h2>Example</h2>
      <div className="demo-container">
        <Demo />
      </div>
    </div>
    <div dangerouslySetInnerHTML={{__html: ${after}}} />
  </div>
)
`;
// export default () => React.createElement("React.Fragment", {},
//   React.createElement('div', {dangerouslySetInnerHTML: {__html: ${before}}}),
//   React.createElement(Demo),
//   React.createElement('div', {dangerouslySetInnerHTML: {__html: ${after}}}),
// )

export default function markdownLoader(this: LoaderContext<any>, source: string) {
  const [beforeDemo, afterDemo] = source.split("%%DEMO%%");
  const { resourcePath } = this;
  const demoPath = resourcePath.replace("README.md", "demo.tsx").replaceAll("\\", "/");

  const before = JSON.stringify(markdown.render(beforeDemo));
  const after = JSON.stringify(markdown.render(afterDemo));
  // const result = `export default ${JSON.stringify(content)}`;
  const result = getComp(before, after, demoPath);
  return result;
}
