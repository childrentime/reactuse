import MarkdownIt from "markdown-it";
import MarkdownItHightlight from "markdown-it-highlightjs";
import MarkdownItExpandable from "markdown-it-expandable";
import MarkdownItCopy from "./markdown-code-copy";
import MarkdownItContainer from "markdown-it-container";

const markdown = new MarkdownIt({});

markdown.use(MarkdownItContainer, "warning");
markdown.use(MarkdownItHightlight);
markdown.use(MarkdownItExpandable);
markdown.use(MarkdownItCopy);

export default markdown;
