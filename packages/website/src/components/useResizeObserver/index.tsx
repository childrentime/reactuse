import { useRef, useState } from "react";
import { useResizeObserver } from "@reactuses/core";
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
  const ref = useRef<HTMLTextAreaElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const stop = useResizeObserver(ref, (entries) => {
    const [entry] = entries;
    const { width, height } = entry.contentRect;
    setWidth(width);
    setHeight(height);
  });

  return (
    <div>
      <div>Resize the box to see changes</div>
      <div>
        <button onClick={() => stop()}>stop observe</button>
      </div>
      <br />
      <textarea
        ref={ref}
        disabled
        style={{ width: 286, height: 166 }}
        value={`width: ${width}\nheight: ${height}`}
      />
    </div>
  );
};
