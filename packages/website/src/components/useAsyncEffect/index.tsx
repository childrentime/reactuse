import { useAsyncEffect } from "@reactuses/core";
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
  const [data, setData] = useState(0);

  useAsyncEffect(
    async () => {
      const result = await new Promise<number>((r) => {
        setTimeout(() => {
          r(200);
        }, 5000);
      });
      setData(result);
    },
    () => {},
    [],
  );
  return <div>data: {data}</div>;
};
