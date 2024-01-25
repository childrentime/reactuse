import { useState } from "react";
import { useEyeDropper } from "@reactuses/core";

export default () => {
  const [color, setColor] = useState("");
  const [supported, open] = useEyeDropper();

  if (supported) {
    return (
      <div style={{ padding: 40 }}>
        Supported: {supported.toString()}
        <br />
        Color: {color}
        <button
          type="button"
          onClick={async () => setColor((await open()).sRGBHex)}
        >
          Pick color
        </button>
      </div>
    );
  }

  return <span>Not Supported by Your Browser</span>;
};
