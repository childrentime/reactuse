import Layout from "../Layout";
import file from "./README.md";
import { useState } from "react";
import { useTitle } from "@reactuses/core";

const Page = () => {
  return (
    <Layout file={file}>
      <Demo />
    </Layout>
  );
};

export default Page;

const Demo = () => {
  const [title, setTitle] = useState("title");

  useTitle(title);

  return (
    <div>
      <button onClick={() => setTitle("newTitle")}>Change Title</button>
    </div>
  );
};
