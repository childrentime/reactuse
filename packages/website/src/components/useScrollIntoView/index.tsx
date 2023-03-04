import { useScrollIntoView } from "@reactuses/core";
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
  const targetRef = useRef<HTMLParagraphElement>(null);
  const { scrollIntoView } = useScrollIntoView({
    offset: 60,
    targetElement: targetRef,
  });

  return (
    <div>
      <button onClick={() => scrollIntoView({ alignment: "center" })}>
        Scroll to target
      </button>
      <div style={{ height: "50vh" }} />
      <p ref={targetRef}>Hello there</p>
    </div>
  );
};
