import { useMountedState } from "@reactuses/core";
import { useEffect, useState } from "react";
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
  const isMounted = useMountedState();

  const [, update] = useState(0);
  useEffect(() => {
    update(1);
  }, []);
  return <div>This component is {isMounted() ? "MOUNTED" : "NOT MOUNTED"}</div>;
};
