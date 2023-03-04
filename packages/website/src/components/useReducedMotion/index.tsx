import { useReducedMotion } from "@reactuses/core";
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
  const motion = useReducedMotion(false);

  return <div>ReducedMotion: {JSON.stringify(motion)}</div>;
};
