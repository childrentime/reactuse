import { useMousePressed } from "@reactuses/core";
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
  const [mouse, type] = useMousePressed();

  return (
    <div>
      <p>Pressed: {JSON.stringify(mouse)}</p>
      <p>SourceType: {JSON.stringify(type)}</p>
    </div>
  );
};
