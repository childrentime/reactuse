import { useRef } from "react";
import type { UseFirstMountState } from "./interface";

export const useFirstMountState: UseFirstMountState = (): boolean => {
  const isFirst = useRef(true);

  if (isFirst.current) {
    isFirst.current = false;

    return true;
  }

  return isFirst.current;
};
