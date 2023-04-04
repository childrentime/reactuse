import MarkdownIt from "markdown-it";
import MarkdownItHightlight from "markdown-it-highlightjs";
import MarkdownItExpandable from "markdown-it-expandable";
import MarkdownItContainer from "markdown-it-container";
import MarkdownItCopy from "./markdown-code-copy";

const markdown = new MarkdownIt({});

markdown.use(MarkdownItContainer, "warning");
markdown.use(MarkdownItHightlight);
markdown.use(MarkdownItExpandable);
markdown.use(MarkdownItCopy);

export default markdown;
