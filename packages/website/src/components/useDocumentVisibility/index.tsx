import { useDocumentVisibility } from "@reactuses/core";
import { useEffect, useRef } from "react";
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
  const visibility = useDocumentVisibility();
  const message = useRef("💡 Minimize the page or switch tab then return");

  useEffect(() => {
    message.current = "🎉 Welcome back!";
  }, [visibility]);

  return <div>{message.current}</div>;
};
