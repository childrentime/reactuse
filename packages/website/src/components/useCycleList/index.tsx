import { useCycleList } from "@reactuses/core";
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
  const [state, next, prev] = useCycleList([
    "Dog",
    "Cat",
    "Lizard",
    "Shark",
    "Whale",
    "Dolphin",
    "Octopus",
    "Seal",
  ]);

  return (
    <div>
      <div>{state}</div>
      <div>
        <button onClick={() => next()}>next</button>
        <button onClick={() => prev()}>prev</button>
      </div>
    </div>
  );
};
