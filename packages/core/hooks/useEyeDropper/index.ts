import { useCallback } from "react";
import useSupported from "../useSupported";

interface EyeDropperOpenOptions {
  signal?: AbortSignal;
}

export interface EyeDropperOpenReturnType {
  sRGBHex: string;
}

export default function useEyeDropper() {
  const isSupported = useSupported(
    () => typeof window !== "undefined" && "EyeDropper" in window,
    true,
  );

  const open = useCallback(
    async (
      options: EyeDropperOpenOptions = {},
    ): Promise<EyeDropperOpenReturnType> => {
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
}

export type UseEyeDropperReturn = ReturnType<typeof useEyeDropper>;
