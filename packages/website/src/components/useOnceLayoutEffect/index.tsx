import { useOnceLayoutEffect } from "@reactuses/core";
import { useLayoutEffect, useState } from "react";
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
  const [updateEffect, setLayoutEffect] = useState(0);
  const [onceLayoutEffect, setOnceLayoutEffect] = useState(0);

  useOnceLayoutEffect(() => {
    setOnceLayoutEffect(onceEffect => onceEffect + 1);
  }, []);

  useLayoutEffect(() => {
    setLayoutEffect(effect => effect + 1);
  }, []);

  return (
    <div>
      <div>onceEffect: {onceLayoutEffect}</div>
      <br />
      <div>effect: {updateEffect}</div>
    </div>
  );
};
