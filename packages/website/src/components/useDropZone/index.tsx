import { useRef } from "react";
import { useDropZone } from "@reactuses/core";
import Layout from "../Layout";
import logo from "../../assets/favicon.ico";
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
  const ref = useRef<HTMLDivElement>(null);

  const isOver = useDropZone(ref, (files) => {});
  return (
    <div>
      <p>Drop files into dropZone</p>
      <img src={logo} alt="" />
      <div
        ref={ref}
        style={{
          minHeight: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "1.5rem",
          background: "rgba(156,163,175,0.1)",
        }}
      >
        <div> isOverDropZone: {JSON.stringify(isOver)}</div>
      </div>
    </div>
  );
};
