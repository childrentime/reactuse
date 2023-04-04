import { useState } from "react";
import { useTitle } from "@reactuses/core";
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
  const [title, setTitle] = useState("title");

  useTitle(title);

  return (
    <div>
      <button onClick={() => setTitle("newTitle")}>Change Title</button>
    </div>
  );
};
