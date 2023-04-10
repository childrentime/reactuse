import type { Dispatch, SetStateAction } from "react";
import { isBrowser } from "../utils/is";
import type { UseStorageOptions } from "../createStorage";
import createStorage from "../createStorage";

export default function useSessionStorage(
  key: string,
  defaults: string,
  options?: UseStorageOptions<string>
): readonly [string | null, Dispatch<SetStateAction<string | null>>];
export default function useSessionStorage(
  key: string,
  defaults: number,
  options?: UseStorageOptions<number>
): readonly [number | null, Dispatch<SetStateAction<number | null>>];
export default function useSessionStorage(
  key: string,
  defaults: boolean,
  options?: UseStorageOptions<boolean>
): readonly [boolean | null, Dispatch<SetStateAction<boolean | null>>];
export default function useSessionStorage<T>(
  key: string,
  defaults: T,
  options?: UseStorageOptions<T>
): readonly [T | null, Dispatch<SetStateAction<T | null>>];
export default function useSessionStorage<T = unknown>(
  key: string,
  defaults: null,
  options?: UseStorageOptions<T>
): readonly [T | null, Dispatch<SetStateAction<T | null>>];

export default function useSessionStorage<
  T extends string | number | boolean | object | null,
>(key: string, defaults: T, options: UseStorageOptions<T> = {}) {
  return createStorage(
    key,
    defaults,
    () => (isBrowser ? sessionStorage : undefined),
    options,
  );
}
