import type MarkdownIt from "markdown-it";
import type { RenderRule } from "markdown-it/lib/renderer";

const options = {
  imageClass: "markdown-it-copy-image",
  class: "markdown-it-code-copy",
} as const;

function renderCode(origRule: RenderRule) {
  return (...args: Parameters<RenderRule>) => {
    const origRendered = origRule(...args);
    const [tokens, idx] = args;

    // 注意node15才支持replaceAll
    const content = tokens[idx].content
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&lt;");

    if (content.length === 0) {
      return origRendered;
    }

    return `
<div style="position: relative">
	${origRendered}
	<div class=${options.class} data-clipboard-text="${content}"  title="Copy">
    <div class = ${options.imageClass}></div>
	</div>
</div>
`;
  };
}

export default function codeCopyPlugin(md: MarkdownIt) {
  md.renderer.rules.code_block = renderCode(md.renderer.rules.code_block!);
  if (md.renderer.rules.fence) {
    md.renderer.rules.fence = renderCode(md.renderer.rules.fence);
  }
}
