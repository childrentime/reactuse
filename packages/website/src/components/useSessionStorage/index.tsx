import { useSessionStorage } from "@reactuses/core";
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
  // bind string
  const [value, setValue] = useSessionStorage("my-key", "key");

  return (
    <div>
      <div>Value: {value}</div>
      <button onClick={() => setValue("bar")}>bar</button>
      <button onClick={() => setValue("baz")}>baz</button>
      {/* delete data from storage */}
      <button onClick={() => setValue(null)}>Remove</button>
    </div>
  );
};
