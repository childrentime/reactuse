import { useSticky } from "@reactuses/core";
import type { CSSProperties } from "react";
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
  const element = useRef<HTMLDivElement>(null);
  const [isSticky] = useSticky({
    targetElement: element,
    // header fixed height
    nav: 64,
  });

  const stickyStyle: CSSProperties = isSticky
    ? {
        position: "fixed",
        top: 64,
        zIndex: 50,
        height: 20,
      }
    : {
        height: 20,
      };

  const guardStyle: CSSProperties = {
    width: 1,
    height: 1,
  };

  return (
    <div>
      <div ref={element} style={guardStyle} />
      <button style={stickyStyle}>
        {isSticky ? "stickying" : "not sticky"}
      </button>
      <div style={{ height: "100vh" }} />
    </div>
  );
};
