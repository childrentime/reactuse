import { useCallback, useEffect, useRef, useState } from "react";
import useSupported from "../useSupported";
import { off, on } from "../utils/browser";
import { noop } from "../utils/is";
import type { UseMediaDeviceOptions, UseMediaDevices } from "./interface";

const defaultConstints = { audio: true, video: true };

export const useMediaDevices: UseMediaDevices = (options: UseMediaDeviceOptions = {}) => {
  const { requestPermissions, constraints = defaultConstints } = options;
  const [state, setState] = useState<{
    devices: {
      deviceId: string;
      groupId: string;
      kind: MediaDeviceKind;
      label: string;
    }[];
  }>({ devices: [] });
  const isSupported = useSupported(
    () =>
      navigator
      && navigator.mediaDevices
      && navigator.mediaDevices.enumerateDevices,
  );
  const permissionGranted = useRef(false);
  const stream = useRef<MediaStream | null>(null);

  const onChange = useCallback(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        if (stream.current) {
          stream.current.getTracks().forEach(t => t.stop());
          stream.current = null;
        }
        setState({
          devices: devices.map(({ deviceId, groupId, kind, label }) => ({
            deviceId,
            groupId,
            kind,
            label,
          })),
        });
      })
      .catch(noop);
  }, []);

  const ensurePermissions = useCallback(async () => {
    if (!isSupported) {
      return false;
    }
    if (permissionGranted.current) {
      return true;
    }

    let state: PermissionState | undefined;

    try {
      state = (
        await navigator!.permissions.query({
          name: "camera",
        } as unknown as PermissionDescriptor)
      ).state;
    }
    catch (error) {
      state = "prompt";
    }

    if (state !== "granted") {
      stream.current = await navigator!.mediaDevices.getUserMedia(constraints);
      onChange();
      permissionGranted.current = true;
    }
    else {
      permissionGranted.current = false;
    }

    return permissionGranted.current;
  }, [onChange, isSupported, constraints]);

  useEffect(() => {
    if (!isSupported) {
      return;
    }
    if (requestPermissions) {
      ensurePermissions();
    }

    on(navigator.mediaDevices, "devicechange", onChange);
    onChange();

    return () => {
      off(navigator.mediaDevices, "devicechange", onChange);
    };
  }, [onChange, isSupported, requestPermissions, ensurePermissions]);

  return [state, ensurePermissions] as const;
};
