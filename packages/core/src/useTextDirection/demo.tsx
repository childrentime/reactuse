import { useTextDirection } from "@reactuses/core";
import { useMemo } from "react";

export default () => {
  const [dir, setDir] = useTextDirection({
    selector: "#_useTextDirectionDemo",
  });

  const text = useMemo(
    () =>
      dir === "ltr"
        ? "This paragraph is in English and correctly goes left to right."
        : "This paragraph is in English but incorrectly goes right to left.",
    [dir],
  );

  const handleOnClick = () => {
    const value = dir === "rtl" ? "ltr" : "rtl";
    setDir(value);
  };

  return (
    <div id="_useTextDirectionDemo">
      <p>{text}</p>
      <button onClick={handleOnClick}>
        <span>{dir.toUpperCase()}</span>
      </button>
      <span>Click to change the direction</span>
    </div>
  );
};
