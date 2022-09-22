import { useElementVisibility } from "@reactuses/core";
import { useRef } from "react";
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
  const ref = useRef<HTMLDivElement>(null);
  const visible = useElementVisibility(ref);

  return (
    <div>
      <p>Info on the right bottom corner</p>
      <div
        ref={ref}
        style={{
          borderWidth: 2,
          borderStyle: "solid",
          padding: "1rem",
        }}
      >
        Target Element (scroll down)
      </div>
      <div
        style={{
          borderWidth: 2,
          borderStyle: "solid",
          padding: "1rem",
          position: "fixed",
          bottom: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        Element {visible ? "inside" : "outside"} the viewport
      </div>
    </div>
  );
};
