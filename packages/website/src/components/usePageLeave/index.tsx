import { usePageLeave } from "@reactuses/core";
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
  const isLeft = usePageLeave();

  return <div>isLeft: {JSON.stringify(isLeft)}</div>;
};
