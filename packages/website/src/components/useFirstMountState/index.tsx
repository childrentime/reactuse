import { useFirstMountState } from "@reactuses/core";
import { useMemo, useState } from "react";
import Layout from "../Layout";
import file from "./README.md";

const Page = () => {
  return (
    <Layout file={file}>
      {useMemo(
        () => (
          <Demo />
        ),
        [],
      )}
    </Layout>
  );
};

const Demo = () => {
  const isFirstMount = useFirstMountState();
  const [render, reRender] = useState(0);

  return (
    <div>
      <span>This component is just mounted: {isFirstMount ? "YES" : "NO"}</span>
      <br />
      <button onClick={() => reRender(1)}>{render}</button>
    </div>
  );
};

export default Page;
