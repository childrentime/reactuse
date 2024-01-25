import { useDocumentVisibility } from "@reactuses/core";
import { useEffect, useState } from "react";

export default function Demo() {
  const visibility = useDocumentVisibility("hidden");
  const [message, setMessage] = useState(
    "💡 Minimize the page or switch tab then return",
  );

  useEffect(() => {
    if (visibility === "visible") {
      setTimeout(() => {
        setMessage("🎉 Welcome back!");
      }, 2000);
    }
    else {
      setTimeout(() => {
        setMessage("🥰 Take a break");
      }, 2000);
    }
  }, [visibility]);

  return <div>{message}</div>;
}
