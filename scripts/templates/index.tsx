import { MARKUP } from "@reactuses/core";
import Layout from "../Layout";
import file from "./README.md";

const Demo = () => {
  return <div></div>;
};

const Page = () => {
  return (
    <Layout file={file}>
      <Demo />
    </Layout>
  );
};

export default Page;
