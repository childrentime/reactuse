import { Dispatch, SetStateAction, useState } from "react";
import { isFunction } from "../utils/is";
import { guessSerializerType } from "../utils/serializer";
import useUpdateEffect from "./useUpdateEffect";
import useEvent from "./useEvent";
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
}
export default function useStorage<
  T extends string | number | boolean | object | null
>(
  key: string,
  defaults: T,
  getStorage: () => Storage | undefined,
  options: UseStorageOptions<T> = {}
) {
  let storage: Storage | undefined;
  const {
    onError = (e) => {
      console.error(e);
    },
  } = options;
  const data = defaults;

  try {
    storage = getStorage();
  } catch (err) {
    console.error(err);
  }

  const type = guessSerializerType<T>(defaults);
  const serializer = options.serializer ?? StorageSerializers[type];

  const getStoredValue = () => {
    try {
      const raw = storage?.getItem(key);
      if (raw) {
        return serializer.read(raw);
      } else {
        storage?.setItem(key, serializer.write(data));
        return data;
      }
    } catch (e) {
      onError(e);
    }
  };

  const [state, setState] = useState<T | null>(() => getStoredValue());

  useUpdateEffect(() => {
    setState(getStoredValue());
  }, [key]);

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

  return [state, updateState] as const;
}
