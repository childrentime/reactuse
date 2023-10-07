import { useCallback, useEffect, useRef } from "react";
import useSupported from "../useSupported";
import useUnmount from "../useUnmount";
import { defaultOptions } from "../utils/defaults";

export default function useWebNotification(requestPermissions = false) {
  const isSupported = useSupported(() => !!window && "Notification" in window);
  const permissionGranted = useRef(false);

  const notificationRef = useRef<Notification | null>(null);

  const show = (
    title: string,
    options: NotificationOptions = defaultOptions,
  ) => {
    // If either the browser does not support notifications or the user has
    // not granted permission, do nothing:
    if (!isSupported && !permissionGranted.current) {
      return;
    }

    notificationRef.current = new Notification(title || "", options);
    return notificationRef.current;
  };

  const close = useCallback((): void => {
    if (notificationRef.current) {
      notificationRef.current.close();
    }

    notificationRef.current = null;
  }, []);

  useEffect(() => {
    permissionGranted.current
      = isSupported
      && "permission" in Notification
      && Notification.permission === "granted";
  }, [isSupported]);

  const ensurePermissions = useCallback(async () => {
    if (!isSupported)
      return;

    if (!permissionGranted.current && Notification.permission !== "denied") {
      const result = await Notification.requestPermission();
      if (result === "granted")
        permissionGranted.current = true;
    }

    return permissionGranted.current;
  }, [isSupported]);

  useEffect(() => {
    if (requestPermissions) {
      ensurePermissions();
    }
  }, [requestPermissions, ensurePermissions]);

  useUnmount(close);

  return [isSupported, show, close, ensurePermissions] as const;
}
