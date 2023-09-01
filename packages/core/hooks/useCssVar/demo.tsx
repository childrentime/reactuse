import { useCssVar } from "@reactuses/core";
import { useRef } from "react";

export default function Demo() {
  const key = "--color";
  const ref = useRef<HTMLDivElement>(null);
  const [color, setColor] = useCssVar(key, ref, "");
  const style: any = {
    "--color": "#7fa998",
    "color": "var(--color)",
  };

  const switchColor = () => {
    if (color === "#df8543") {
      setColor("#7fa998");
    }
    else {
      setColor("#df8543");
    }
  };

  return (
    <section>
      <div ref={ref} style={style}>
        Sample text, <>{color}</>
      </div>
      <button onClick={switchColor}>Change Color</button>
    </section>
  );
};
