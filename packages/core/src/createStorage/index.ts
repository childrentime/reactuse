import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { isBrowser, isFunction } from "../utils/is";
import { guessSerializerType } from "../utils/serializer";
import { useEvent } from "../useEvent";
import { defaultOnError, defaultOptions } from "../utils/defaults";

export interface Serializer<T> {
  read(raw: string): T;
  write(value: T): string;
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
   * Custom data serialization
   */
  serializer?: Serializer<T>;
  /**
   * On error callback
   *
   * Default log error to `console.error`
   */
  onError?: (error: unknown) => void;
  /**
   * set to storage when nodata in effect, fallback to defaults
   */
  effectStorageValue?: T | (() => T);
}
const getInitialState = (
  key: string,
  defaultValue?: any,
  storage?: Storage,
  serializer?: Serializer<any>,
  onError?: (error: unknown) => void,
) => {
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
    }
    catch (error) {
      onError?.(error);
    }
  }

  // A default value has not been provided, and you are rendering on the server, warn of a possible hydration mismatch when defaulting to false.
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "`createStorage` When server side rendering, defaultValue should be defined to prevent a hydration mismatches.",
    );
  }

  return null;
};

export default function useStorage<
  T extends string | number | boolean | object | null,
>(
  key: string,
  defaultValue?: T,
  getStorage: () => Storage | undefined = () =>
    isBrowser ? sessionStorage : undefined,
  options: UseStorageOptions<T> = defaultOptions,
) {
  let storage: Storage | undefined;
  const { onError = defaultOnError, effectStorageValue } = options;

  try {
    storage = getStorage();
  }
  catch (err) {
    onError(err);
  }

  const type = guessSerializerType<T | undefined>(defaultValue);
  const serializer = useMemo(() => {
    return options.serializer ?? StorageSerializers[type];
  }, [options.serializer, type]);

  const [state, setState] = useState<T | null>(
    getInitialState(key, defaultValue, storage, serializer, onError),
  );

  useEffect(() => {
    const data = effectStorageValue
      ? isFunction(effectStorageValue)
        ? effectStorageValue()
        : effectStorageValue
      : defaultValue;
    const getStoredValue = () => {
      try {
        const raw = storage?.getItem(key);
        if (raw !== undefined && raw !== null) {
          return serializer.read(raw);
        }
        else {
          storage?.setItem(key, serializer.write(data));
          return data;
        }
      }
      catch (e) {
        onError(e);
      }
    };

    setState(getStoredValue());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, serializer, storage, onError, effectStorageValue]);

  const updateState: Dispatch<SetStateAction<T | null>> = useEvent(
    (valOrFunc) => {
      const currentState = isFunction(valOrFunc) ? valOrFunc(state) : valOrFunc;
      setState(currentState);

      if (currentState === null) {
        storage?.removeItem(key);
      }
      else {
        try {
          storage?.setItem(key, serializer.write(currentState));
        }
        catch (e) {
          onError(e);
        }
      }
    },
  );

  return [state, updateState] as const;
}
