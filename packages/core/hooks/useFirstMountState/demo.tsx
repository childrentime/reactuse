import { useFirstMountState } from "@reactuses/core";
import { useState } from "react";

export default () => {
  const isFirstMount = useFirstMountState();
  const [render, reRender] = useState(0);

  return (
    <div>
      <span>This component is just mounted: {isFirstMount ? "YES" : "NO"}</span>
      <br />
      <button onClick={() => reRender(1)}>{render}</button>
    </div>
  );
};
