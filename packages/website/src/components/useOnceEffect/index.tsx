import { useOnceEffect } from "@reactuses/core";
import { useEffect, useState } from "react";
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
  const [effect, setEffect] = useState(0);
  const [onceEffect, setOnceEffect] = useState(0);

  useOnceEffect(() => {
    setOnceEffect((onceEffect) => onceEffect + 1);
  }, []);

  useEffect(() => {
    setEffect((effect) => effect + 1);
  }, []);

  return (
    <div>
      <div>onceEffect: {onceEffect}</div>
      <br />
      <div>effect: {effect}</div>
    </div>
  );
};
