---
sidebar_position: 1
slug: /
title: 介紹
sidebar_label: 介紹
description: Reactuse 是一個全面的自定義 React Hooks 集合，旨在增強您的功能組件！ 您可以輕鬆釋放 React Hooks 的全部潛力，並利用其強大功能來創建可重用且高效的代碼。 本文介紹其用法、最佳實踐與代碼示例。
---
# 起步

Reactuse 是一個全面的自定義 React Hooks 集合，旨在增強您的功能組件！ 您可以輕鬆釋放 React Hooks 的全部潛力，並利用其強大功能來創建可重用且高效的代碼。

## 安裝

```shell
npm i @reactuses/core
```

## 用例

```tsx
import { useToggle } from '@reactuses/core'

function Demo() {
  const [on, toggle] = useToggle(true)

  return (
    <div>
      <div>{on ? 'ON' : 'OFF'}</div>
      <button onClick={toggle}>Toggle</button>
      <button onClick={() => toggle(true)}>set ON</button>
      <button onClick={() => toggle(false)}>set OFF</button>
    </div>
  )
}
```
