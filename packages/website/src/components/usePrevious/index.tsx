import file from "./README.md";
import { useState } from "react";
import { usePrevious } from "@reactuses/core";
import Layout from "../Layout";

const Page = () => {
  return (
    <Layout file={file}>
      <Demo />
    </Layout>
  );
};

const Demo = () => {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
      <p>
        Now: {count}, before: {prevCount}
      </p>
    </div>
  );
};

export default Page;
