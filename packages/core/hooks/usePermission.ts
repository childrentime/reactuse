import { useEffect, useState } from "react";
import { off, on } from "../utils/browser";
import { noop } from "../utils/is";

export type IState = PermissionState | "";

type DescriptorNamePolyfill =
  | "accelerometer"
  | "accessibility-events"
  | "ambient-light-sensor"
  | "background-sync"
  | "camera"
  | "clipboard-read"
  | "clipboard-write"
  | "gyroscope"
  | "magnetometer"
  | "microphone"
  | "notifications"
  | "payment-handler"
  | "persistent-storage"
  | "push"
  | "speaker";

export type GeneralPermissionDescriptor =
  | PermissionDescriptor
  | { name: DescriptorNamePolyfill };

export default function usePermission(
  permissionDesc:
    | GeneralPermissionDescriptor
    | GeneralPermissionDescriptor["name"]
): IState {
  const [state, setState] = useState<IState>("");

  useEffect(() => {
    const desc =
      typeof permissionDesc === "string"
        ? ({ name: permissionDesc } as PermissionDescriptor)
        : (permissionDesc as PermissionDescriptor);
    let mounted = true;
    let permissionStatus: PermissionStatus | null = null;

    const onChange = () => {
      if (!mounted) {
        return;
      }
      setState(() => permissionStatus?.state ?? "");
    };

    navigator.permissions
      .query(desc)
      .then((status) => {
        permissionStatus = status;
        on(permissionStatus, "change", onChange);
        onChange();
      })
      .catch(noop);

    return () => {
      permissionStatus && off(permissionStatus, "change", onChange);
      mounted = false;
      permissionStatus = null;
    };
  }, [permissionDesc]);

  return state;
}
