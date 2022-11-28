import markdown from "../utils/markdown";

export default function markdownLoader(source: string) {
  const content = markdown.render(source);
  const result = `export default ${JSON.stringify(content)}`;
  return result;
}
