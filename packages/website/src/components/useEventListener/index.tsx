import { useEventListener } from "@reactuses/core";
import { useRef, useState } from "react";
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState("NO DB Click");

  const onDBClick = () => {
    setState("DB Clicked");
  };

  const onClick = (event: Event) => {
    console.log("button clicked!", event);
  };

  const onVisibilityChange = (event: Event) => {
    console.log("doc visibility changed!", {
      isVisible: !document.hidden,
      event,
    });
  };

  // example with window based event
  useEventListener("dblclick", onDBClick);

  // example with document based event
  useEventListener("visibilitychange", onVisibilityChange, document);

  // example with element based event
  useEventListener("click", onClick, buttonRef);

  return (
    <div style={{ minHeight: "200vh" }}>
      <p>{state}</p>
      <button ref={buttonRef}>Click me</button>
    </div>
  );
};
