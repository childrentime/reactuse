import { Dispatch, SetStateAction, useEffect } from "react";
import { useState } from "react";
import { isBrowser, isFunction } from "../utils/is";
import { guessSerializerType } from "../utils/serializer";
import { useEvent } from "../useEvent";
import { defaultOnError, defaultOptions } from "../utils/defaults";
import { useDeepCompareEffect } from "../useDeepCompareEffect";

export interface Serializer<T> {
  read: (raw: string) => T;
  write: (value: T) => string;
}

export const StorageSerializers: Record<
  "boolean" | "object" | "number" | "any" | "string" | "map" | "set" | "date",
  Serializer<any>
> = {
  boolean: {
    read: (v: any) => v === "true",
    write: (v: any) => String(v),
  },
  object: {
    read: (v: any) => JSON.parse(v),
    write: (v: any) => JSON.stringify(v),
  },
  number: {
    read: (v: any) => Number.parseFloat(v),
    write: (v: any) => String(v),
  },
  any: {
    read: (v: any) => v,
    write: (v: any) => String(v),
  },
  string: {
    read: (v: any) => v,
    write: (v: any) => String(v),
  },
  map: {
    read: (v: any) => new Map(JSON.parse(v)),
    write: (v: any) =>
      JSON.stringify(Array.from((v as Map<any, any>).entries())),
  },
  set: {
    read: (v: any) => new Set(JSON.parse(v)),
    write: (v: any) => JSON.stringify(Array.from(v as Set<any>)),
  },
  date: {
    read: (v: any) => new Date(v),
    write: (v: any) => v.toISOString(),
  },
};

export interface UseStorageOptions<T> {
  /**
   * @en Custom data serialization
   * @zh 自定义数据序列化
   */
  serializer?: Serializer<T>;
  /**
   * @en On error callback
   * @zh 错误回调
   * @defaultValue `console.error`
   */
  onError?: (error: unknown) => void;
  /**
   * @en set to storage when nodata in first mount
   * @zh 首次挂载时没有数据时设置到 storage
   * @deprecated
   */
  effectStorageValue?: T | (() => T);
  /**
   * @en set to storage when nodata in first mount
   * @zh 首次挂载时没有数据时设置到 storage
   */
  mountStorageValue?: T | (() => T);
  /**
   * @en listen to storage changes
   * @zh 监听 storage 变化
   * @defaultValue `true`
   */
  listenToStorageChanges?: boolean;
}
function getInitialState(
  key: string,
  defaultValue?: any,
  storage?: Storage,
  serializer?: Serializer<any>,
  onError?: (error: unknown) => void
) {
  // Prevent a React hydration mismatch when a default value is provided.
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  if (isBrowser) {
    try {
      const raw = storage?.getItem(key);
      if (raw !== undefined && raw !== null) {
        return serializer?.read(raw);
      }
      return null;
    } catch (error) {
      onError?.(error);
    }
  }

  // A default value has not been provided, and you are rendering on the server, warn of a possible hydration mismatch when defaulting to false.
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "`createStorage` When server side rendering, defaultValue should be defined to prevent a hydration mismatches."
    );
  }

  return null;
}

export default function useStorage<
  T extends string | number | boolean | object | null
>(
  key: string,
  defaultValue?: T,
  getStorage: () => Storage | undefined = () =>
    isBrowser ? sessionStorage : undefined,
  options: UseStorageOptions<T> = defaultOptions
) {
  let storage: Storage | undefined;
  const {
    onError = defaultOnError,
    effectStorageValue,
    mountStorageValue,
    listenToStorageChanges = true,
  } = options;
  const storageValue = mountStorageValue ?? effectStorageValue;

  try {
    storage = getStorage();
  } catch (err) {
    onError(err);
  }

  const type = guessSerializerType<T | undefined>(defaultValue);
  const serializer = options.serializer ?? StorageSerializers[type];

  const [state, setState] = useState<T | null>(
    getInitialState(key, defaultValue, storage, serializer, onError)
  );

  useDeepCompareEffect(() => {
    const data =
      (storageValue
        ? isFunction(storageValue)
          ? storageValue()
          : storageValue
        : defaultValue) ?? null;

    const getStoredValue = () => {
      try {
        const raw = storage?.getItem(key);
        if (raw !== undefined && raw !== null) {
          return serializer.read(raw);
        } else {
          storage?.setItem(key, serializer.write(data));
          return data;
        }
      } catch (e) {
        onError(e);
      }
    };

    setState(getStoredValue());
  }, [key, serializer, storage, onError, storageValue]);

  const updateState: Dispatch<SetStateAction<T | null>> = useEvent(
    (valOrFunc) => {
      const currentState = isFunction(valOrFunc) ? valOrFunc(state) : valOrFunc;
      setState(currentState);

      if (currentState === null) {
        storage?.removeItem(key);
      } else {
        try {
          storage?.setItem(key, serializer.write(currentState));
        } catch (e) {
          onError(e);
        }
      }
    }
  );

  const listener = useEvent(() => {
    try {
      const raw = storage?.getItem(key);
      if (raw !== undefined && raw !== null) {
        updateState(serializer.read(raw));
      }else {
        updateState(null);
      }
    } catch (e) {
      onError(e);
    }
  });

  useEffect(() => {
    if (listenToStorageChanges) {
      window.addEventListener("storage", listener);
      return () => window.removeEventListener("storage", listener);
    }
    return () => {};
  }, [listenToStorageChanges, listener]);

  return [state, updateState] as const;
}
