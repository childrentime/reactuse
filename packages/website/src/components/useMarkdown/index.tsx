import { useMarkdown } from "@reactuses/core";
import file from "./README.md";
import demo from "./demo.md";
import markdown from "../../utils/markdown";
import Layout from "../Layout";

const Page = () => {
  return (
    <Layout file={file}>
      <Demo />
    </Layout>
  );
};

const Demo = () => {
  const demoContent = useMarkdown(demo);
  // maybe you can render it with using markdownit
  const demoMarkdown = markdown.render(demoContent);

  return <div dangerouslySetInnerHTML={{ __html: demoMarkdown }} />;
};

export default Page;
