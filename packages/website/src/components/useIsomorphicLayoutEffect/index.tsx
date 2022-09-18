import { useIsomorphicLayoutEffect } from "@reactuses/core";
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
  const [value] = useState("useIsomorphicLayoutEffect");
  useIsomorphicLayoutEffect(() => {
    window.console.log(value);
  }, [value]);

  return <div>{value}</div>;
};
