import { useClipboard, usePermission } from "@reactuses/core";
import { useState } from "react";
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
  const [value, setValue] = useState("");
  const [text, copy] = useClipboard();
  const permissionRead = usePermission("clipboard-read");
  const permissionWrite = usePermission("clipboard-write");
  return (
    <div>
      <p>
        Clipboard Permission: read <b>{permissionRead}</b> | write&nbsp;
        <b>{permissionWrite}</b>
      </p>
      <p>
        Current copied: <code>{text || "none"}</code>
      </p>
      <input
        value={value}
        onChange={(event) => {
          setValue(event.currentTarget.value);
        }}
      />
      <button onClick={() => copy(value)}>Copy</button>
    </div>
  );
};
