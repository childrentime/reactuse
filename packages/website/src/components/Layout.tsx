import { useMarkdown } from "@reactuses/core";
import { ReactElement } from "react";
import markdown from "../utils/markdown";

const Layout = (props: { file: string; children: ReactElement }) => {
  const { file } = props;
  const md = useMarkdown(file);
  const content = markdown.render(md);
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: content }} />
      {props.children}
    </div>
  );
};

export default Layout;
