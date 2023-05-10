# useFavicon

React side-effect hook sets the favicon of the page.

## Usage

```tsx
import { useFavicon } from "@reactuses/core";
import { useState } from "react";
import logo from "../../assets/favicon.ico";
import twitter from "../../assets/twitter-pip.2.ico";

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
```
