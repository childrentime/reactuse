import { useMount } from "@reactuses/core";
import { useState } from "react";

export default () => {
  const [value, setValue] = useState("UnMounted");
  useMount(() => {
    setValue("Mounted");
  });
  return <div>{value}</div>;
};
