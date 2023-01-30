import React from "react";
import { Fn } from "./types";

const toString = Object.prototype.toString;

export const isFunction = <T extends Fn>(val: any): val is T =>
  typeof val === "function";
export const isDef = <T = any>(val?: T): val is T => typeof val !== "undefined";
export const isUndef = (value: unknown): value is undefined =>
  typeof value === "undefined";
export const isBoolean = (val: any): val is boolean => typeof val === "boolean";

export const isNumber = (val: any): val is number => typeof val === "number";
export const isString = (val: unknown): val is string =>
  typeof val === "string";
export const isObject = (val: any): val is object =>
  toString.call(val) === "[object Object]";

export const isDev =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

export const isBrowser = typeof window !== "undefined";
export const isNavigator = typeof navigator !== "undefined";
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

export const isIOS =
  /* #__PURE__ */ isBrowser &&
  window?.navigator?.userAgent &&
  /iP(ad|hone|od)/.test(window.navigator.userAgent);

export const isReactLegacy = !React.useId;
