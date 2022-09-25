import { useCallback, useState } from "react";
import useEventListener from "./useEventListener";

export default function useClipBorad(): readonly [
  string,
  (txt: string) => Promise<void>
] {
  const [text, setText] = useState("");

  const updateText = useCallback(() => {
    window.navigator.clipboard.readText().then((value) => {
      setText(value);
    });
  }, []);

  useEventListener("copy", updateText);
  useEventListener("cut", updateText);

  const copy = useCallback(async (txt: string) => {
    setText(txt);

    await window.navigator.clipboard.writeText(txt);
  }, []);

  return [text, copy] as const;
}
