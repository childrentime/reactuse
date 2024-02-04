import { useCallback } from "react";
import useSupported from "../useSupported";
import type { UseEyeDropper, UseEyeDropperOpenOptions, UseEyeDropperOpenReturnType } from "./interface";

export const useEyeDropper: UseEyeDropper = () => {
  const isSupported = useSupported(
    () => typeof window !== "undefined" && "EyeDropper" in window,
    true,
  );

  const open = useCallback(
    async (
      options: UseEyeDropperOpenOptions = {},
    ): Promise<UseEyeDropperOpenReturnType> => {
      if (!isSupported) {
        return {
          sRGBHex: "",
        };
      }

      const eyeDropper = new (window as any).EyeDropper();
      return eyeDropper.open(options);
    },
    [isSupported],
  );

  return [isSupported, open] as const;
};

export type UseEyeDropperReturn = ReturnType<typeof useEyeDropper>;
