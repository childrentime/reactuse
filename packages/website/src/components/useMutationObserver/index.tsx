import { useEffect, useRef, useState } from "react";
import { useMutationObserver } from "@reactuses/core";
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
  const [width, setWidth] = useState(200);
  const [count, setCount] = useState(0);

  const ref = useRef<HTMLDivElement>(null);

  const stop = useMutationObserver(
    (mutationsList) => {
      mutationsList.forEach(() => setCount(c => c + 1));
    },
    ref,
    { attributes: true },
  );

  useEffect(() => {
    setWidth(300);
  }, []);

  return (
    <div>
      <div
        ref={ref}
        style={{
          width,
          padding: 12,
          border: "1px solid #000",
          marginBottom: 8,
        }}
      >
        current width：{width}
      </div>
      <button onClick={() => setWidth(w => w + 10)}>widening</button>
      <button onClick={() => stop()}>stop observe</button>
      <p>Mutation count {count}</p>
    </div>
  );
};
