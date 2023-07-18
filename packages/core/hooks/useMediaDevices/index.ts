import { useCallback, useEffect, useRef, useState } from "react";
import useSupported from "../useSupported";
import { off, on } from "../utils/browser";
import { noop } from "../utils/is";

export interface UseMediaDeviceOptions {
  /**
   * Request for permissions immediately if it's not granted,
   * otherwise label and deviceIds could be empty
   *
   * @default false
   */
  requestPermissions?: boolean;
  /**
   * Request for types of media permissions
   *
   * @default { audio: true, video: true }
   */
  constraints?: MediaStreamConstraints;
}
function useMediaDevices(options: UseMediaDeviceOptions = {}) {
  const { requestPermissions, constraints = { audio: true, video: true } }
    = options;
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

    let state: PermissionState | undefined = undefined;

    try {
        state = (await navigator!.permissions.query({
      name: "camera",
    } as unknown as PermissionDescriptor)).state;
    } catch (error) {
      state = 'prompt';
    }

    if (state!== "granted") {
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
}



export default useMediaDevices;