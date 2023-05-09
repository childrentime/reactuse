import { useIsomorphicLayoutEffect } from "@reactuses/core";
import { useState } from "react";

export default () => {
  const [value] = useState("useIsomorphicLayoutEffect");
  useIsomorphicLayoutEffect(() => {
    window.console.log(value);
  }, [value]);

  return <div>{value}</div>;
};
