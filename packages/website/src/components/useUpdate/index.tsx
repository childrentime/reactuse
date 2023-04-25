import { useUpdate } from "@reactuses/core";
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
  const update = useUpdate();

  return (
    <>
      {/* to avoid ssr error beacause date.now() will not be same in server and client */}
      <div suppressHydrationWarning={true}>Time: {Date.now()}</div>
      <button onClick={update}>Update</button>
    </>
  );
};
