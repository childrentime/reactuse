import { useLatest } from "@reactuses/core";
import file from "./README.md";
import { useRef, useState } from "react";
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
  const arr = useRef([1, 2]);
  const latestCount = useLatest(count);
  const handleAlertClick = () => {
    setTimeout(() => {
      alert(`Latest count value: ${latestCount.current}`);
    }, 3000);
  };

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
      <button onClick={handleAlertClick}>Show alert</button>
      <div>{arr.current.toString()}</div>
    </div>
  );
};

export default Page;
