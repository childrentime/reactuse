import { useUnmount } from "@reactuses/core";
import { useState } from "react";
import Layout from "../Layout";
import file from "./README.md";

const Page = () => {
  return (
    <Layout file={file}>
      <Demo />
    </Layout>
  );
};

export default Page;

const Demo = () => {
  const [value] = useState("mounted");
  useUnmount(() => {
    alert("UnMounted");
  });
  return <div>{value}</div>;
};
