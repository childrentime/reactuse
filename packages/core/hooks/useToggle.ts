import { Reducer, useReducer } from "react";

const toggleReducer = (state: boolean, nextValue?: any) =>
  typeof nextValue === "boolean" ? nextValue : !state;

export default function useToggle(
  initialValue: boolean
): [boolean, (nextValue?: any) => void] {
  return useReducer<Reducer<boolean, any>>(toggleReducer, initialValue);
}
