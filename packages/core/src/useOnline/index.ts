import { useNetwork } from "../useNetwork";
import type { UseOnline } from "./interface";

export const useOnline: UseOnline = (): boolean | undefined => {
  const { online } = useNetwork();
  return online;
};
