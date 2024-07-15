import React from 'react'
import type { Fn } from './types'

const toString = Object.prototype.toString

export function isFunction<T extends Fn>(val: any): val is T {
  return typeof val === 'function'
}
export const isDef = <T = any>(val?: T): val is T => typeof val !== 'undefined'
export function isUndef(value: unknown): value is undefined {
  return typeof value === 'undefined'
}
export const isBoolean = (val: any): val is boolean => typeof val === 'boolean'

export const isNumber = (val: any): val is number => typeof val === 'number'
export function isString(val: unknown): val is string {
  return typeof val === 'string'
}
export function isObject(val: any): val is object {
  return toString.call(val) === '[object Object]'
}

export const isDev
  = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'

export const isBrowser = typeof window !== 'undefined'
export const isNavigator = typeof navigator !== 'undefined'

export function noop() {}

export const isIOS
/* #__PURE__ */ = isBrowser
&& window?.navigator?.userAgent
&& /iP(?:ad|hone|od)/.test(window.navigator.userAgent)

export const isReactLegacy = !React.useId
