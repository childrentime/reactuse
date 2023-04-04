import { useActiveElement } from "@reactuses/core";
import { useMemo } from "react";
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
  const arr = [1, 2, 3, 4, 5, 6];

  const activeElement = useActiveElement<HTMLElement>();

  const key = useMemo(() => {
    return activeElement?.dataset?.id;
  }, [activeElement?.dataset?.id]);
  return (
    <div>
      <p>Select the inputs below to see the changes </p>
      <div style={{ display: "flex", gap: 15, flexWrap: "wrap" }}>
        {arr.map((i) => {
          return <input key={i} placeholder={`${i}`} data-id={i} />;
        })}
      </div>
      <br />
      <div>
        Current Active Element:
        <span style={{ color: "var(--c-primary)" }}>{key}</span>
      </div>
    </div>
  );
};
