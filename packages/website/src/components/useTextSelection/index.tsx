import { useTextSelection } from "@reactuses/core";
import Layout from "../Layout";
import file from "./README.md";

const Demo = () => {
  const selection = useTextSelection();
  return (
    <div style={{ padding: 40 }}>
      <p>
        Select some text here or anywhere on the page and it will be displayed
        below
      </p>

      <div>Selected text: {selection?.toString()}</div>
    </div>
  );
};

const Page = () => {
  return (
    <Layout file={file}>
      <Demo />
    </Layout>
  );
};

export default Page;
