import { useState } from "react";
import { useFavicon } from "@reactuses/core";
import logo from "../../../website/src/assets/favicon.ico";
import twitter from "../../../website/src/assets/twitter-pip.2.ico";

export default () => {
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
