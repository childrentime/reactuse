import { useEffect, useState } from 'react';
import { isBrowser } from '../utils/is';
import type { UseBattery, UseBatteryState } from './interface';

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

const defaultState: UseBatteryState = {
  isSupported: false,
  charging: false,
  chargingTime: 0,
  dischargingTime: 0,
  level: 0,
};

export const useBattery: UseBattery = () => {
  const isSupported = isBrowser && typeof (navigator as NavigatorWithBattery).getBattery === 'function';

  const [state, setState] = useState<UseBatteryState>({
    ...defaultState,
    isSupported,
  });

  useEffect(() => {
    if (!isSupported) return;

    let battery: BatteryManager | null = null;

    const updateState = () => {
      if (!battery) return;
      setState({
        isSupported: true,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
        level: battery.level,
      });
    };

    (navigator as NavigatorWithBattery).getBattery!().then((b) => {
      battery = b;
      updateState();

      b.addEventListener('chargingchange', updateState);
      b.addEventListener('chargingtimechange', updateState);
      b.addEventListener('dischargingtimechange', updateState);
      b.addEventListener('levelchange', updateState);
    });

    return () => {
      if (battery) {
        battery.removeEventListener('chargingchange', updateState);
        battery.removeEventListener('chargingtimechange', updateState);
        battery.removeEventListener('dischargingtimechange', updateState);
        battery.removeEventListener('levelchange', updateState);
      }
    };
  }, []);

  return state;
};
