import ClipboardJS from "clipboard";
import MarkdownIt from "markdown-it";
import { RenderRule } from "markdown-it/lib/renderer";
import { toast } from "react-toastify";

const clip = new ClipboardJS(".markdown-it-code-copy");
clip.on("success", () => {
  toast.success("Copied", {
    position: toast.POSITION.TOP_CENTER,
  });
});

const options = {
  imageClass: "markdown-it-copy-image",
  class: "markdown-it-code-copy",
} as const;

function renderCode(origRule: RenderRule) {
  return (...args: Parameters<RenderRule>) => {
    const [tokens, idx] = args;
    const content = tokens[idx].content
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&lt;");
    const origRendered = origRule(...args);

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
  md.renderer.rules.fence = renderCode(md.renderer.rules.fence!);
}
