import { useUnmount } from "@reactuses/core";
import { useState } from "react";

export default () => {
  const [value] = useState("mounted");
  useUnmount(() => {
    alert("UnMounted");
  });
  return <div>{value}</div>;
};
