import { useScriptTag } from "@reactuses/core";
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

// it's an example, use your types instead

declare const jQuery: any;
const Demo = () => {
  const [, status] = useScriptTag(
    "https://code.jquery.com/jquery-3.5.1.min.js",
  );

  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (typeof jQuery !== "undefined") {
      setVersion(jQuery.fn.jquery);
    }
  }, [status]);

  return <div>jQuery version: {version}</div>;
};
