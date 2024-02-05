import { useEffect, useRef } from "react";
import { useCssVar } from "../useCssVar";
import { useDebounceFn } from "../useDebounceFn";
import { useEventListener } from "../useEventListener";
import useUpdate from "../useUpdate";

const topVarName = "--reactuse-safe-area-top";
const rightVarName = "--reactuse-safe-area-right";
const bottomVarName = "--reactuse-safe-area-bottom";
const leftVarName = "--reactuse-safe-area-left";

const defaultElement = () => document.documentElement;

export default function useScreenSafeArea() {
  const top = useRef("");
  const right = useRef("");
  const bottom = useRef("");
  const left = useRef("");

  const forceUpdate = useUpdate();
  useCssVar(topVarName, defaultElement, "env(safe-area-inset-top, 0px)");
  useCssVar(rightVarName, defaultElement, "env(safe-area-inset-right, 0px)");
  useCssVar(bottomVarName, defaultElement, "env(safe-area-inset-bottom, 0px)");
  useCssVar(leftVarName, defaultElement, "env(safe-area-inset-left, 0px)");

  const { run: update } = useDebounceFn(() => {
    top.current = getValue(topVarName);
    right.current = getValue(rightVarName);
    bottom.current = getValue(bottomVarName);
    left.current = getValue(leftVarName);
    forceUpdate();
  });

  useEffect(() => {
    update();
  }, [update]);
  useEventListener("resize", update);

  return [
    top.current,
    right.current,
    bottom.current,
    left.current,
    update,
  ] as const;
}

function getValue(
  position:
  | typeof topVarName
  | typeof leftVarName
  | typeof rightVarName
  | typeof bottomVarName,
) {
  return getComputedStyle(document.documentElement).getPropertyValue(position);
}
