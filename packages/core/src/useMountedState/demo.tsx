import { useMountedState } from "@reactuses/core";
import { useEffect, useState } from "react";

export default () => {
  const isMounted = useMountedState();

  const [, update] = useState(0);
  useEffect(() => {
    update(1);
  }, []);
  return <div>This component is {isMounted() ? "MOUNTED" : "NOT MOUNTED"}</div>;
};
