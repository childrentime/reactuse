import { useEffect, useState } from "react";
import { off, on } from "../utils/browser";
import { isNavigator, noop } from "../utils/is";

function useMediaDevices() {
  const [state, setState] = useState<{
    devices: {
      deviceId: string;
      groupId: string;
      kind: MediaDeviceKind;
      label: string;
    }[];
  }>({ devices: [] });

  useEffect(() => {
    let mounted = true;

    const onChange = () => {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          if (mounted) {
            setState({
              devices: devices.map(({ deviceId, groupId, kind, label }) => ({
                deviceId,
                groupId,
                kind,
                label,
              })),
            });
          }
        })
        .catch(noop);
    };

    on(navigator.mediaDevices, "devicechange", onChange);
    onChange();

    return () => {
      mounted = false;
      off(navigator.mediaDevices, "devicechange", onChange);
    };
  }, []);

  return state;
}

const useMediaDevicesMock = () => ({ devices: [] });

export default isNavigator && !!navigator.mediaDevices
  ? useMediaDevices
  : useMediaDevicesMock;
