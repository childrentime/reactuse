import Layout from "../Layout";
import file from "./README.md";
import { useRef } from "react";
import { useElementBounding } from "@reactuses/core";

const Page = () => {
  return (
    <Layout file={file}>
      <Demo />
    </Layout>
  );
};

export default Page;

const Demo = () => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const rect = useElementBounding(ref);
  return (
    <div>
      <p> Resize the box to see changes</p>
      <textarea ref={ref} readOnly value={JSON.stringify(rect, null, 2)} />
    </div>
  );
};
