import { usePreferredDark } from "@reactuses/core";
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
  const isDark = usePreferredDark();

  return <div>PreferredDark: {JSON.stringify(isDark)}</div>;
};
