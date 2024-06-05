import { useState, useEffect, useRef, useCallback } from "react";
import { EventSourceStatus, UseEventSource, UseEventSourceOptions } from "./interface";
import { useEvent } from "../useEvent";
import { defaultOptions } from "../utils/defaults";
import { useUnmount } from "../useUnmount";

export const useEventSource: UseEventSource = <Events extends string[]>(
  url: string | URL,
  events: Events = [] as unknown as Events,
  options: UseEventSourceOptions = defaultOptions
) => {
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<Event | null>(null);
  const [status, setStatus] = useState<EventSourceStatus>("DISCONNECTED");
  const [event, setEvent] = useState<string | null>(null);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const retries = useRef(0);
  const explicitlyClosed = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const eventListenerRef = useRef<Map<string,((event: MessageEvent<any>) => void)>>();
  if(!eventListenerRef.current) {
    eventListenerRef.current = new Map();
  }

  const clean = useCallback(() => {
    const listeners = eventListenerRef.current;

    events.forEach((name) => {
      const handler = listeners?.get(name);
      if(handler) {
        eventSourceRef.current?.removeEventListener(name, handler);
      }
    });
  }, []);

  const close = useCallback(() => {
    setStatus("DISCONNECTED");
    clean();
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    explicitlyClosed.current = true;
  }, []);

  const open = useEvent(() => {
    close();
    explicitlyClosed.current = false;
    retries.current = 0;

    if (!eventSourceRef.current) {
      eventSourceRef.current = new EventSource(url, {
        withCredentials: options.withCredentials,
      });
    }

    const es = eventSourceRef.current;

    es.onopen = () => {
      setStatus("CONNECTED");
      setError(null);
    };

    es.onmessage = (ev) => {
      setData(ev.data);
      setLastEventId(ev.lastEventId);
      setStatus("CONNECTED");
    };

    es.onerror = (err) => {
      setError(err);
      setStatus("DISCONNECTED");

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
          setTimeout(open, delay);
        } else {
          onFailed?.();
        }
      }
    };

    const listeners = eventListenerRef.current;

    events.forEach((name) => {
      const handler = (event: MessageEvent<any>) => {
        setEvent(name);
        setData(event.data ?? null);
      };
      es.addEventListener(name, handler);
      listeners?.set(name, handler);
    });
  });

  useEffect(() => {
    if (options.immediate !== false) {
      open();
    }

    return close;
  }, [open, close, options.immediate]);

  useUnmount(() => {
    close();
  })

  return {
    eventSourceRef,
    data,
    error,
    status,
    lastEventId,
    event,
    close,
    open,
  };
};
