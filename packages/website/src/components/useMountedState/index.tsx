import { useMountedState } from "@reactuses/core";
import Layout from "../Layout";
import file from "./README.md";
import { useEffect } from "react";
import { useState } from "react";
const Page = () => {
  return (
    <Layout file={file}>
      <Demo />
    </Layout>
  );
};

export default Page;

const Demo = () => {
  const isMounted = useMountedState();

  const [, update] = useState(0);
  useEffect(() => {
    update(1);
  }, []);
  return <div>This component is {isMounted() ? "MOUNTED" : "NOT MOUNTED"}</div>;
};
