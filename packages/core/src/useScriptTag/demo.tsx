import { useScriptTag } from "@reactuses/core";
import { useEffect, useState } from "react";

// it's an example, use your types instead

declare const jQuery: any;
export default () => {
  const [, status] = useScriptTag(
    "https://code.jquery.com/jquery-3.5.1.min.js",
  );

  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (typeof jQuery !== "undefined") {
      setVersion(jQuery.fn.jquery);
    }
  }, [status]);

  return <div>jQuery version: {version}</div>;
};
