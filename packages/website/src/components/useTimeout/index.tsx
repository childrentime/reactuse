import { useTimeout } from "@reactuses/core";
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
  const [isPending, start, cancel] = useTimeout(5000);

  return (
    <div>
      <div>Pending: {JSON.stringify(isPending)}</div>
      <button
        onClick={() => {
          start();
        }}
      >
        Start Again
      </button>
      <button
        onClick={() => {
          cancel();
        }}
      >
        Cancel
      </button>
    </div>
  );
};
