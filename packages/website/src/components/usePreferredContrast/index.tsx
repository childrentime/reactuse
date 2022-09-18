import { usePreferredContrast } from "@reactuses/core";
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
  const contrast = usePreferredContrast();

  return <div>PreferredContrast: {contrast}</div>;
};
