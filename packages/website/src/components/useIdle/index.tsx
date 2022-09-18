import { useIdle } from "@reactuses/core";
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
  const isIdle = useIdle(3e3);

  return (
    <div>
      <div>User is idle: {isIdle ? "Yes 😴" : "Nope"}</div>
    </div>
  );
};
