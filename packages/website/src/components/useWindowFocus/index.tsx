import { useWindowsFocus } from "@reactuses/core";
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
  const focus = useWindowsFocus();
  return (
    <div>
      <p>
        {focus
          ? "💡 Click somewhere outside of the document to unfocus."
          : "ℹ Tab is unfocused"}
      </p>
    </div>
  );
};
