import { useCallback, useEffect, useRef, useState } from "react";
import type {
  EventSourceMessage,
  FetchEventSourceInit,
} from "@microsoft/fetch-event-source";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useEvent } from "../useEvent";
import { useUnmount } from "../useUnmount";
import type {
  UseFetchEventSource,
  UseFetchEventSourceOptions,
  UseFetchEventSourceReturn,
  UseFetchEventSourceStatus,
} from "./interface";

export const useFetchEventSource: UseFetchEventSource = (
  url: string | URL,
  options: UseFetchEventSourceOptions = {}
): UseFetchEventSourceReturn => {
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] =
    useState<UseFetchEventSourceStatus>("DISCONNECTED");
  const [event, setEvent] = useState<string | null>(null);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  const retries = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const explicitlyClosed = useRef(false);

  const close = useEvent(() => {
    if (!explicitlyClosed.current) {
      explicitlyClosed.current = true;
      abortController.current?.abort();
      abortController.current = null;

      setStatus("DISCONNECTED");
      options.onClose?.();
    }
  });

  const open = useEvent(async () => {
    close();

    setStatus("CONNECTING");
    explicitlyClosed.current = false;
    retries.current = 0;

    // 创建新的 AbortController
    abortController.current = new AbortController();

    try {
      // 从选项中提取 FetchEventSourceInit 相关的选项
      const {
        immediate,
        autoReconnect,
        onOpen,
        onMessage,
        onError,
        onClose,
        withCredentials,
        body,
        ...fetchOptions
      } = options;

      // 构建请求配置
      const finalOptions: FetchEventSourceInit = {
        method: options.method || "GET",
        headers: {
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          ...options.headers,
        },
        signal: abortController.current.signal,
        credentials: withCredentials ? "include" : "same-origin",
        ...fetchOptions,
      };

      // 只在 POST 请求时添加 body
      if (options.method === "POST" && body) {
        finalOptions.body = body;
        finalOptions.headers = {
          ...finalOptions.headers,
          "Content-Type": "application/json",
        };
      }

      await fetchEventSource(url.toString(), {
        ...finalOptions,
        openWhenHidden: false,
        async onopen(response) {
          if (response.ok) {
            setStatus("CONNECTED");
            setError(null);
            options.onOpen?.();
          } else {
            const error = new Error(
              `Failed to connect: ${response.status} ${response.statusText}`
            );
            setError(error);
            throw error;
          }
        },

        onmessage(msg: EventSourceMessage) {
          if (!explicitlyClosed.current) {
            setData(msg.data);
            setLastEventId(msg.id ?? null);
            setEvent(msg.event || null);
            options.onMessage?.(msg);
          }
        },

        onerror(err) {
          setError(err);
          setStatus("DISCONNECTED");
          const retryDelay = options.onError?.(err);

          if (options.autoReconnect && !explicitlyClosed.current) {
            const {
              retries: maxRetries = -1,
              delay = 1000,
              onFailed,
            } = options.autoReconnect;

            retries.current += 1;

            if (
              (typeof maxRetries === "number" &&
                (maxRetries < 0 || retries.current < maxRetries)) ||
              (typeof maxRetries === "function" && maxRetries())
            ) {
              return retryDelay ?? delay;
            } else {
              onFailed?.();
              throw err;
            }
          }
          throw err;
        },

        onclose() {
          if (!explicitlyClosed.current) {
            setStatus("DISCONNECTED");
            options.onClose?.();
          }
        },
      });
    } catch (err) {
      // 只处理非主动关闭导致的错误
      if (!explicitlyClosed.current) {
        console.error("EventSource Error:", err);
        setError(err as Error);
        setStatus("DISCONNECTED");
      }
    }
  });

  useEffect(() => {
    if (options.immediate !== false) {
      open();
    }
    return () => {
      // 组件卸载时关闭连接
      close();
    };
  }, [open, close, options.immediate]);

  // 组件卸载时确保连接关闭
  useUnmount(() => {
    close();
  });

  return {
    data,
    error,
    status,
    lastEventId,
    event,
    close,
    open,
  };
};
