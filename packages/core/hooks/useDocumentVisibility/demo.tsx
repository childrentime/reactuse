import { useDocumentVisibility } from "@reactuses/core";
import { useEffect, useRef } from "react";

export default () => {
  const visibility = useDocumentVisibility();
  const message = useRef("💡 Minimize the page or switch tab then return");

  useEffect(() => {
    message.current = "🎉 Welcome back!";
  }, [visibility]);

  return <div>{message.current}</div>;
};
