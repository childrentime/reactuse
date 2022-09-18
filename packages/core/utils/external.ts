export interface ThrottleSettings {
  leading?: boolean | undefined;
  trailing?: boolean | undefined;
}

export interface DebounceSettings {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}
