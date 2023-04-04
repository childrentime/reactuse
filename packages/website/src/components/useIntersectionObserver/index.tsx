import { useIntersectionObserver } from "@reactuses/core";
import { useRef, useState } from "react";
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

const Spacer = () => (
  <div
    style={{
      width: "200px",
      height: "300px",
    }}
  />
);

const Demo = () => {
  const intersectionRef = useRef(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry[]>([]);
  const stop = useIntersectionObserver(
    intersectionRef,
    (entry) => {
      setEntry(entry);
    },
    {
      root: null,
      rootMargin: "0px",
      threshold: 1,
    },
  );

  return (
    <div
      style={{
        width: "400px",
        height: "400px",
        overflow: "scroll",
      }}
    >
      Scroll me
      <Spacer />
      <button
        onClick={() => {
          stop();
        }}
      >
        stop observe
      </button>
      <div
        ref={intersectionRef}
        style={{
          width: "100px",
          height: "100px",
          padding: "20px",
          background: "var(--c-hj-b)",
        }}
      >
        {entry[0] && entry[0].intersectionRatio < 1
          ? "Obscured"
          : "Fully in view"}
      </div>
      <Spacer />
    </div>
  );
};
