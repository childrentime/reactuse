import { useUpdate } from "@reactuses/core";
import ClientRender from "../../../utils/ClientRender";
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

  // to avoid ssr error beacause date.now() will not be same in server and client
  return (
    <ClientRender>
      <div>Time: {Date.now()}</div>
      <button onClick={update}>Update</button>
    </ClientRender>
  );
};
