import { useEventEmitter } from "@reactuses/core";
import { IDisposable } from "@reactuses/core/hooks/useEventEmitter";
import { useEffect, useRef, useState } from "react";
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
  const [state, setState] = useState(0);
  const [event, fire, dispose] = useEventEmitter<number>();

  const event1 = useRef<IDisposable>();
  useEffect(() => {
    event((val) => {
      setState((s) => s + val);
    });
    event1.current = event((val) => setState((s) => s + val + 10));
  }, [event]);

  return (
    <div>
      <div>state: {state}</div>
      <button onClick={() => fire(1)}>fire</button>
      <button onClick={() => dispose()}>disposeALL</button>
      <button onClick={() => event1.current?.dispose()}>disposeOne</button>
    </div>
  );
};
