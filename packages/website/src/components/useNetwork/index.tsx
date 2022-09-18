import { useNetwork } from "@reactuses/core";
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
  const state = useNetwork();

  return <pre>{JSON.stringify(state, null, 2)}</pre>;
};
