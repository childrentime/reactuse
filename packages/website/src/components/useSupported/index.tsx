import { useSupported } from "@reactuses/core";
import Layout from "../Layout";
import file from "./README.md";

const Demo = () => {
  const isSupported = useSupported(() => "EyeDropper" in window);
  return (
    <div>
      <p>
        window.EyeDropper is {isSupported ? "supported" : "unsupported"} in your
        browser
      </p>
    </div>
  );
};

const Page = () => {
  return (
    <Layout file={file}>
      <Demo />
    </Layout>
  );
};

export default Page;
