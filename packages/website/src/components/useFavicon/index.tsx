import Layout from "../Layout";
import file from "./README.md";
import { useState } from "react";
import { useFavicon } from "@reactuses/core";
import logo from "../../assets/favicon.ico";
import twitter from "../../assets/twitter-pip.2.ico";

const Page = () => {
  return (
    <Layout file={file}>
      <Demo />
    </Layout>
  );
};

export default Page;

const Demo = () => {
  const [icon, setIcon] = useState(twitter);
  useFavicon(icon);
  return (
    <div>
      <p>Change Favicon to</p>
      <button
        onClick={() => {
          setIcon(logo);
        }}
      >
        React
      </button>
      <button
        onClick={() => {
          setIcon(twitter);
        }}
      >
        Twitter
      </button>
    </div>
  );
};
