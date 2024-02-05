import { useEffect } from "react";
import type { UseTitle } from "./interface";

export const useTitle: UseTitle = (title: string) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
};
