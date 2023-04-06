import { useState } from "react";
import { useEyeDropper } from "@reactuses/core";
import Layout from "../Layout";
import file from "./README.md";

const Demo = () => {
  const [color, setColor] = useState("");
  const [supported, open] = useEyeDropper();

  if (supported) {
    return (
      <div style={{ padding: 40 }}>
        Supported: {supported.toString()}
        <br />
        Color: {color}
        <button
          type="button"
          onClick={async () => setColor((await open()).sRGBHex)}
        >
          Pick color
        </button>
      </div>
    );
  }

  return <span>Not Supported by Your Browser</span>;
};

const Page = () => {
  return (
    <Layout file={file}>
      <Demo />
    </Layout>
  );
};

export default Page;
